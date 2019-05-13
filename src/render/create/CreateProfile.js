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

        new Promise(resolve => {
            window.ipc.send('cache:versions:keys');
            window.ipc.once('cache:versions:keys', (event, data) => resolve(data));
        }).then(keys => {
            const selected = window.ipc.sendSync('cache:versions', keys[0]);
            this.setState({
                loading: false,
                versions: keys,
                selected: selected,
                input_snapshot: selected.url == null ? selected.snapshots[0].name : 'release',
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
            loading: true,
            active: 'vanilla',

            versions: [],
            selected: {
                snapshots: [],
                forge: [],
                fabric: [],
            },

            input_snapshot: 'release',
        };

        this.stopLoading = () => {
            this.setState({
                loading: false,
            });
        };
    }

    componentWillUpdate(nextProps, nextState, nextContext) {
        if (this.state.selected !== nextState.selected) {
            nextState.input_snapshot = nextState.selected.url == null ? nextState.selected.snapshots[0].name : 'release';
            if (this.isDisabled(this.state.active, nextState))
                nextState.active = 'vanilla';
        }
    }

    componentWillMount() {
        window.ipc.on('profile:custom', this.stopLoading);
    }
    componentWillUnmount() {
        window.ipc.removeListener('profile:custom', this.stopLoading);
    }

    isDisabled(type, state = this.state) {
        if (type === 'forge' && state.selected.forge.length === 0)
            return true;
        else if (type === 'fabric' && this.getFabricMappings(state).length === 0)
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

    handleInput(key, value) {
        let nextState = {};
        nextState[key] = value;
        this.setState(nextState);
    }

    getFabricMappings(state = this.state) {
        if (state.input_snapshot === 'release')
            return state.selected.fabric;
        else for (let i = 0; i < state.selected.snapshots.length; i++)
            if (state.selected.snapshots[i].name === state.input_snapshot)
                return state.selected.snapshots[i].fabric;
        return [];
    }

    getFabricLoaderVersions() {
        const versions = window.ipc.sendSync('cache:versions:fabric');
        let all = [];
        Object.keys(versions).forEach(key => {
            versions[key].forEach(ver => {
                ver.id = key;
                all.push(ver);
            });
        });
        return all;
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

    //todo add alpha/beta versions as another selector at the top which just disables all of the ones below.

    render() {
        return (
            <div className="create-profile-wrapper">
                <div className={`create-profile-cover ${this.state.loading ? '' : 'hidden'}`}>
                    <div className="lds-dual-ring"></div>
                </div>
                <div className="create-profile">
                    <h1>Create Custom Profile</h1>
                    <select onChange={e => this.setState({ selected: window.ipc.sendSync('cache:versions', e.target.value) })} ref={this.vanillaRef}>
                        {this.state.versions.map(ver => {
                            return (<option key={ver}>{ver}</option>);
                        })}
                    </select>
                    <div className="create-profile-types">
                        <div className={`create-profile-type ${this.state.active === 'vanilla' ? 'active' : ''}`} onClick={() => this.setActive('vanilla')}>
                            <i className="fas fa-info-circle" onClick={() => window.ipc.send('open-external', 'https://minecraft.net/')}></i>
                            <h2>VANILLA</h2>
                            <p>The unmodified game distributed by Mojang.</p>
                            <select onChange={e => this.handleInput('input_snapshot', e.target.value)}>
                                {this.state.selected.url != null ? (<option value="release">Release</option>) : null}
                                {this.state.selected.snapshots.map(ver => {
                                    return (<option key={ver.name}>{ver.name}</option>);
                                })}
                            </select>
                        </div>
                        <div className={`create-profile-type ${this.state.active === 'forge' ? 'active' : ''} ${this.isDisabled('forge') ? 'disabled' : ''}`} onClick={() => this.setActive('forge')}>
                            <i className="fas fa-info-circle" onClick={() => window.ipc.send('open-external', 'https://www.minecraftforge.net/')}></i>
                            <h2>FORGE</h2>
                            <p>Minecraft Forge is a free, open-source modding API and loader designed to simplify compatibility between community-created mods.</p>
                            <select ref={this.forgeRef}>
                                {this.state.selected.forge.map(ver => {
                                    return (<option key={ver.id}>{ver.id}</option>);
                                })}
                            </select>
                        </div>
                        <div className={`create-profile-type ${this.state.active === 'fabric' ? 'active' : ''} ${this.isDisabled('fabric') ? 'disabled' : ''}`} onClick={() => this.setActive('fabric')}>
                            <i className="fas fa-info-circle" onClick={() => window.ipc.send('open-external', 'https://fabricmc.net/')}></i>
                            <h2>FABRIC<i className="fas fa-info-circle"></i></h2>
                            <p>Fabric is a lightweight, experimental modding toolchain for Minecraft. THIS SHOULD BE FLAGGED AS IN EARLY DEV STAGE!</p>
                            <select ref={this.fabricMappingRef}>
                                {this.getFabricMappings().map(ver => {
                                    return (<option key={ver.version}>{`${ver.game} build ${ver.mappings}`}</option>)
                                })}
                            </select>
                            <br/>
                            <select ref={this.fabricLoaderRef}>
                                {this.getFabricLoaderVersions().map(ver => {
                                    return (<option key={ver.raw}>{`${ver.id} build ${ver.build}`}</option>)
                                })}
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
