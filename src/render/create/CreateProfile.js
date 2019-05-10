/*
Copyright (c) 2019 Matt Worzala <bhop.me>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import React from 'react';
import Snackbar from '../snackbar/Snackbar';
import './create.css';

export default class CreateProfile extends React.Component {
    constructor(props) {
        super(props);

        fetch('https://addons-ecs.forgesvc.net/api/minecraft/version', { //todo this should probably be cached somewhere instead of being pulled every time.
            headers: { "User-Agent": "Launcher (https://github.com/bhopahk/launcher/)" }
        }).then(resp => resp.json()).then( json => {
            this.setState({
                vanilla: json.map(ver => ver.versionString),
                loading: false,
            }, async () => {
                await this.loadVersion(this.state.vanilla[this.state.vanilla.length - 1]);
            });
        });

        //todo replace these with state changes.
        this.vanillaRef = React.createRef();
        this.forgeRef = React.createRef();
        this.fabricMappingRef = React.createRef();
        this.fabricLoaderRef = React.createRef();
        this.nameRef = React.createRef();
        this.forgeCache = null;

        this.state = {
            active: 'vanilla',
            disabled: [],
            loading: true,
            vanilla: [],
            forge: [],
            fabricMapping: [],
            fabricLoader: [],
        };

        window.ipc.on('profile:custom', (event, message) => {
            this.setState({
                loading: false,
            });
            switch (message.result) {
                case 'SUCCESS':
                    Snackbar.sendSnack({
                        body: `Creating ${message.name}!`,
                        action: 'cancel',
                        onAction: () => alert('This function has not been implemented, please stay tuned!'),
                    });

                    break;
                case 'ERROR':
                    if (message.type === 'arbitrary')
                        Snackbar.sendSnack({ body: message.value });
                    if (message.type === 'existing')
                        Snackbar.sendSnack({
                            body: message.value,
                            action: 'overwrite',
                            onAction: () => window.ipc.send('profile:custom', message.callback),
                        });
                    break;
                default:
                    break;
            }
        });
    }

    componentWillUpdate(nextProps, nextState, nextContext) {
        if (!this.isDisabled(nextState.active, nextState.disabled))
            return;
        nextState.active = 'vanilla';
    }

    isDisabled(type, ref) {
        const dis = ref == null ? this.state.disabled : ref;
        for (let i = 0; i < dis.length; i++)
            if (dis[i] === type)
                return true;
        return false;
    }

    setActive(type) {
        if (this.isDisabled(type))
            return;

        this.setState({
            active: type,
        });
    }

    async loadVersion(newVersion) {
        this.setState({
            loading: true,
        });

        let newState = {
            active: newVersion,
            disabled: ['fabric'],
            loading: false,
        };

        const forgeVersions = await this.getForgeVersions(newVersion);
        if (forgeVersions == null)
            newState.disabled.push('forge');
        else {
            newState.forge = [];
            newState.forge.push(forgeVersions.recommended);
            newState.forge = newState.forge.concat(forgeVersions.versions);
        }

        this.setState(newState);
    }

    async getForgeVersions(version) {
        if (this.forgeCache == null) {
            const json = await fetch(`https://addons-ecs.forgesvc.net/api/minecraft/modloader`, {
                headers: {"User-Agent": "Launcher (https://github.com/bhopahk/launcher/)"}
            }).then(resp => resp.json());
            this.forgeCache = {};
            json.forEach(forge => {
                if (this.forgeCache[forge.gameVersion] == null)
                    this.forgeCache[forge.gameVersion] = {versions: [], count: 0};
                if (forge.latest)
                    this.forgeCache[forge.gameVersion].latest = forge.name;
                if (forge.recommended)
                    this.forgeCache[forge.gameVersion].recommended = forge.name;
                this.forgeCache[forge.gameVersion].versions[this.forgeCache[forge.gameVersion].count] = forge.name;
                this.forgeCache[forge.gameVersion].count++;
            });
        }
        return this.forgeCache[version];
    }

    sendCreationRequest() {
        if (this.state.active !== 'vanilla' && this.state.active !== 'forge' && this.state.active !== 'fabric') {
            Snackbar.sendSnack({ body: `Please select a profile type!` });
            return;
        }
        const name = this.nameRef.current.value;
        if (name.trim().length === 0) {
            Snackbar.sendSnack({ body: `Please enter a profile name!` });
            return;
        }
        let version = '';
        switch (this.state.active) {
            case 'vanilla':
                version = this.vanillaRef.current.value;
                break;
            case 'forge':
                version = this.forgeRef.current.value;
                break;
            case 'fabric':
                version = {
                    mappings: this.fabricMappingRef.current.value,
                    loader: this.fabricLoaderRef.current.value,
                };
                break;
            default:
                Snackbar.sendSnack({ body: 'An error has occurred, please try again.' });
                return;
        }

        this.setState({
            loading: true,
        });

        window.ipc.send('profile:custom', {
            action: 'CREATE',
            flavor: this.state.active,
            version, name,
        });
    }

    render() {
        return (
            <div className="create-profile-wrapper">
                <div className={`create-profile-cover ${this.state.loading ? '' : 'hidden'}`}>
                    <div className="lds-dual-ring"></div>
                </div>
                <div className="create-profile">
                    <h1>Create Custom Profile</h1>
                    <select onChange={e => this.loadVersion(e.target.value)} ref={this.vanillaRef}>
                        {this.state.vanilla.map(ver => {
                            return (<option key={ver}>{ver}</option>);
                        })}
                    </select>
                    <div className="create-profile-types">
                        <div className={`create-profile-type ${this.state.active === 'vanilla' ? 'active' : ''} ${this.isDisabled('vanilla') ? 'disabled' : ''}`} onClick={() => this.setActive('vanilla')}>
                            <i className="fas fa-info-circle" onClick={() => window.ipc.send('open-external', 'https://minecraft.net/')}></i>
                            <h2>VANILLA</h2>
                            <p>The unmodified game distributed by Mojang.</p>
                        </div>
                        <div className={`create-profile-type ${this.state.active === 'forge' ? 'active' : ''} ${this.isDisabled('forge') ? 'disabled' : ''}`} onClick={() => this.setActive('forge')}>
                            <i className="fas fa-info-circle" onClick={() => window.ipc.send('open-external', 'https://www.minecraftforge.net/')}></i>
                            <h2>FORGE</h2>
                            <p>Minecraft Forge is a free, open-source modding API and loader designed to simplify compatibility between community-created mods.</p>
                            <select ref={this.forgeRef}>
                                {this.state.forge.map(ver => {
                                    return (<option key={ver}>{ver}</option>);
                                })}
                            </select>
                        </div>
                        <div className={`create-profile-type ${this.state.active === 'fabric' ? 'active' : ''} ${this.isDisabled('fabric') ? 'disabled' : ''}`} onClick={() => this.setActive('fabric')}>
                            <i className="fas fa-info-circle" onClick={() => window.ipc.send('open-external', 'https://fabricmc.net/')}></i>
                            <h2>FABRIC<i className="fas fa-info-circle"></i></h2>
                            <p>Fabric is a lightweight, experimental modding toolchain for Minecraft. THIS SHOULD BE FLAGGED AS IN EARLY DEV STAGE!</p>
                            <select ref={this.fabricMappingRef}>
                                <option>MAPPINGS_VERSION_1</option>
                                <option>MAPPINGS_VERSION_2</option>
                                <option>MAPPINGS_VERSION_3</option>
                            </select>
                            <select ref={this.fabricLoaderRef}>
                                <option>LOADER_VERSION_1</option>
                                <option>LOADER_VERSION_2</option>
                                <option>LOADER_VERSION_3</option>
                            </select>
                        </div>
                    </div>
                    <div className="create-profile-name">
                        <input ref={this.nameRef} type="text" placeholder="Profile Name" />
                        <i className="fas fa-pencil-alt"></i>
                    </div>
                    <br/>
                    <button onClick={() => this.sendCreationRequest()}>Create Profile</button>
                </div>
            </div>
        );
    }
}
