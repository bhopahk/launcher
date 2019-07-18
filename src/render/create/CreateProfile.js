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

import { Dropdown, Option, TextField, Button } from '../input/Input';

export default class CreateProfile extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            active: 'vanilla',

            versions: [],
            selected: {
                snapshots: [],
                forge: [],
                fabric: [],
            },
            fabric: [],

            input_snapshot: 'release',
            input_name: '',
        };

        new Promise(resolve => {
            window.ipc.send('cache:versions:keys');
            window.ipc.once('cache:versions:keys', (event, data) => resolve(data));
        }).then(keys => {
            const versions = window.ipc.sendSync('cache:versions:fabric');
            let fabric = [];
            Object.keys(versions).forEach(key => {
                versions[key].reverse().forEach(ver => {
                    ver.id = key;
                    fabric.push(ver);
                });
            });
            const selected = window.ipc.sendSync('cache:versions', keys[0]);
            this.setState({
                loading: false,
                versions: keys,
                selected: selected,
                fabric: fabric.reverse(),
                input_snapshot: selected.url == null ? selected.snapshots[0].name : 'release',
            });
        });
    }

    componentWillMount() {
        window.ipc.on('profile:create:response', this.handleResponse);
    }
    componentWillUpdate(nextProps, nextState, nextContext) {
        if (this.state.selected !== nextState.selected) {
            nextState.input_snapshot = nextState.selected.url == null ? nextState.selected.snapshots[0].name : 'release';
            nextState.input_forge = nextState.selected.forge.length === 0 ? null : nextState.selected.forge[0].id;
            nextState.input_fabric_loader = nextState.fabric[0].raw;

            if (this.isDisabled(this.state.active, nextState))
                nextState.active = 'vanilla';
        }
        if (this.state.selected !== nextState.selected || this.state.input_snapshot !== nextState.input_snapshot) {
            nextState.input_fabric_mappings = this.getFabricMappings(nextState).length === 0 ? null : this.getFabricMappings(nextState)[0].version;
        }
    }
    componentWillUnmount() {
        window.ipc.removeListener('profile:create:response', this.handleResponse);
    }

    getFabricMappings(state = this.state) {
        if (state.input_snapshot === 'release')
            return state.selected.fabric;
        else for (let i = 0; i < state.selected.snapshots.length; i++)
            if (state.selected.snapshots[i].name === state.input_snapshot)
                return state.selected.snapshots[i].fabric;
        return [];
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
        this.setState({ active: type });
    }

    stopLoading = () => {
        this.setState({
            loading: false,
        });
    };

    handleResponse = (event, data) => {
        this.stopLoading();
        if (data && data.error) {
            console.log(`An error has occured while installing a profile: ${data.error}`);
            if (data.errorRaw)
                console.log(data.errorRaw);
            Snackbar.sendSnack({ body: data.errorMessage });
        }
    };

    sendCreationRequest() {
        if (this.state.active !== 'vanilla' && this.state.active !== 'forge' && this.state.active !== 'fabric') {
            Snackbar.sendSnack({ body: `Please select a profile type!` });
            return;
        } else if (this.state.input_name.trim().length === 0) {
            Snackbar.sendSnack({ body: `Please enter a profile name!` });
            return;
        } else
            this.setState({ loading: true });

        let version = {
            version: this.state.selected.url !== undefined ? this.state.selected.name : this.state.input_snapshot,
            flavor: this.state.active
        };
        switch (this.state.active) {
            case 'vanilla':
                break;
            case 'forge':
                version.forge = this.state.input_forge;
                break;
            case 'fabric':
                version.mappings = this.state.input_fabric_mappings;
                version.loader = this.state.input_fabric_loader;
                break;
            default:
                Snackbar.sendSnack({ body: 'An error has occurred, please try again.' });
                return;
        }

        window.ipc.send('profile:create', {
            version,
            name: this.state.input_name.trim(),
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
                    <h1 className="light-text text-shadow">Create Custom Profile</h1>
                    <Dropdown minuscule getValue={() => this.state.selected.name } setValue={next => this.setState({ selected: window.ipc.sendSync('cache:versions', next) })}>
                        {this.state.versions.map(ver =>
                            <Option key={ver} value={ver} display={ver} />)}
                    </Dropdown>
                    <div className="create-profile-types">
                        <div className={`create-profile-type transparent-bg-alt ${this.state.active === 'vanilla' ? 'active' : ''}`} onClick={() => this.setActive('vanilla')}>
                            <i className="fas fa-info-circle more-info" onClick={() => window.ipc.send('open-external', 'https://minecraft.net/')}></i>
                            <div>
                                <h2>VANILLA</h2>
                                <p>The unmodified game distributed by Mojang. Snapshot versions are not guaranteed to function correctly, expect bugs.</p>
                            </div>
                            <div className="create-profile-selectors">
                                <Dropdown getValue={() => this.state.input_snapshot } setValue={next => this.setState({ input_snapshot: next })}>
                                    {this.state.selected.url != null ? (<Option value={"release"} display={"Release"} />) : null}
                                    {this.state.selected.snapshots.map(ver =>
                                        <Option key={ver.name} value={ver.name} display={ver.name} />)}
                                </Dropdown>
                                <Button onClick={() => {}}>Select</Button>
                            </div>
                        </div>
                        <div className={`create-profile-type ${this.state.active === 'forge' ? 'active' : ''} ${this.isDisabled('forge') ? 'disabled' : ''}`} onClick={() => this.setActive('forge')}>
                            <i className="fas fa-info-circle more-info" onClick={() => window.ipc.send('open-external', 'https://www.minecraftforge.net/')}></i>
                            <div>
                                <h2>FORGE</h2>
                                <p>Minecraft Forge is a free, open-source modding API and loader designed to simplify compatibility between community-created mods.</p>
                            </div>
                            <div className="create-profile-selectors">
                                <Dropdown getValue={() => this.state.input_forge} setValue={next => this.setState({ input_forge: next })}>
                                    {this.state.selected.forge.map(ver =>
                                        <Option key={ver.id} value={ver.id} display={ver.id} />)}
                                </Dropdown>
                                <Button onClick={() => {}} disabled={this.isDisabled('forge')}>Select</Button>
                            </div>
                        </div>
                        <div className={`create-profile-type ${this.state.active === 'fabric' ? 'active' : ''} ${this.isDisabled('fabric') ? 'disabled' : ''}`} onClick={() => this.setActive('fabric')}>
                            <i className="fas fa-info-circle more-info" onClick={() => window.ipc.send('open-external', 'https://fabricmc.net/')}></i>
                            <div>
                                <h2>FABRIC <span className={`badge ${this.isDisabled('fabric') ? 'disabled' : ''}`} style={{ position: 'absolute', top: '16px' }}>Pre Release</span></h2>
                                <p>The Fabric project is a lightweight, experimental modding toolchain for Minecraft, primarily targeting 1.14+ versions of the game.</p>
                            </div>
                            <div className="create-profile-selectors">
                                <Dropdown getValue={() => this.state.input_fabric_mappings} setValue={next => this.setState({ input_fabric_mappings: next })}>
                                    {this.getFabricMappings().map(ver =>
                                        <Option key={ver.version} value={ver.version} display={`${ver.game} build ${ver.mappings}`} />)}
                                </Dropdown>
                                <Dropdown getValue={() => this.state.input_fabric_loader} setValue={next => this.setState({ input_fabric_loader: next })}>
                                    {this.state.fabric.map(ver => {
                                        if (this.isDisabled('fabric'))
                                            return null;
                                        return (<Option key={ver.raw} value={ver.raw} display={`${ver.id} build ${ver.build}`} />)
                                    })}
                                </Dropdown>
                                <Button onClick={() => {}} disabled={this.isDisabled('fabric')}>Select</Button>
                            </div>
                        </div>
                    </div>
                    <div className="create-profile-name">
                        <TextField id="customProfileName" icon="fas fa-pencil-alt" placeholder="Enter name..." timeout={250} getValue={() => this.state.input_name} setValue={next => this.setState({ input_name: next })} />
                    </div>
                    <br/>
                    <Button onClick={() => this.sendCreationRequest()}>
                        Create Profile
                    </Button>
                </div>
            </div>
        );
    }
}
