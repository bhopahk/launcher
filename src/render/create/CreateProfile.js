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
import './create.css';

export default class CreateProfile extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: 'vanilla',
            disabled: []
        };
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

    handleVersion(newVersion) {
        switch (newVersion) {
            case '1.14':
                this.setState({
                    disabled: ['forge'],
                });
                break;
            case '1.13':
                this.setState({
                    disabled: ['forge', 'fabric'],
                });
                break;
            case '1.12':
                this.setState({
                    disabled: ['fabric'],
                });
                break;
            default:
                this.setState({
                    disabled: [],
                });
                break;
        }
    }

    render() {
        return (
            <div className="create-profile-wrapper">
                <div className="create-profile">
                    <h1>Create Custom Profile</h1>
                    <select onChange={e => this.handleVersion(e.target.value)}>
                        <option>1.14</option>
                        <option>1.13.2</option>
                        <option>1.13</option>
                        <option>1.12.2</option>
                        <option>1.12.1</option>
                        <option>1.12</option>
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
                            <select>
                                <option>FORGE_VERSION_1</option>
                                <option>FORGE_VERSION_2</option>
                                <option>FORGE_VERSION_3</option>
                            </select>
                        </div>
                        <div className={`create-profile-type ${this.state.active === 'fabric' ? 'active' : ''} ${this.isDisabled('fabric') ? 'disabled' : ''}`} onClick={() => this.setActive('fabric')}>
                            <i className="fas fa-info-circle" onClick={() => window.ipc.send('open-external', 'https://fabricmc.net/')}></i>
                            <h2>FABRIC<i className="fas fa-info-circle"></i></h2>
                            <p>Fabric is a lightweight, experimental modding toolchain for Minecraft. THIS SHOULD BE FLAGGED AS IN EARLY DEV STAGE!</p>
                            <select>
                                <option>MAPPINGS_VERSION_1</option>
                                <option>MAPPINGS_VERSION_2</option>
                                <option>MAPPINGS_VERSION_3</option>
                            </select>
                            <select>
                                <option>API_VERSION_1</option>
                                <option>API_VERSION_2</option>
                                <option>API_VERSION_3</option>
                            </select>
                        </div>
                    </div>
                    <div className="create-profile-name">
                        <input id="createProfileName" type="text" placeholder="Profile Name" />
                        <i className="fas fa-pencil-alt"></i>
                    </div>
                    <br/>
                    <button>Create Profile</button>
                </div>
            </div>
        );
    }
}
