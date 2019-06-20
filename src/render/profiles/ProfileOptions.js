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
import './options.css';
import './screenshots.css';
import './mods.css';
import { ModalPageWrapper, ModalPage } from '../layout/ModalPages';
import { ContextMenu, ContextMenuTrigger, MenuItem } from 'react-contextmenu';
import { Switch, Button } from '../input/Input';
import Snackbar from '../snackbar/Snackbar';

class ProfileOptions extends React.Component {
    constructor(props) {
        super(props);

        this.imageSelect = React.createRef();

        this.state = {
            active: ''
        }
    }

    handleChangeIcon = target => {
        alert('changing profile background to ' + target);
    };

    render() {
        return (
            <ModalPageWrapper default="overview">
                <ModalPage header>
                    <div className="po-overview-image">
                        <div className="po-o-hidden" onClick={() => this.imageSelect.current.click()}>
                            <p>Change Icon</p>
                        </div>
                        <input type="file" ref={this.imageSelect} accept="image/png" onChange={e => this.handleChangeIcon(e.target.files[0].path)} hidden />
                        <img src={this.props.profile.icon} alt="Profile Icon" />
                    </div>
                </ModalPage>
                <ModalPage id="overview" display="Overview">
                    <p>Profile Overview</p>
                </ModalPage>
                <ModalPage id="mods" display="Mods" disabled={this.props.profile.flavor === 'vanilla'}>
                    <Mods profile={this.props.profile.name} />
                </ModalPage>
                <ModalPage id="screenshots" display="Screenshots">
                    <Screenshots profile={this.props.profile.name} />
                </ModalPage>
                <ModalPage id="resourcePacks" display="Resource Packs" disabled>
                    <p>Profile Overview</p>
                </ModalPage>
                <ModalPage id="worlds" display="Worlds" disabled>
                    <p>Profile Overview</p>
                </ModalPage>
            </ModalPageWrapper>
        );
    }
}

class Mods extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            mods: [],
        };

        window.ipc.once('profile:mod:list', this.handleRenderMods);
        window.ipc.send('profile:mod:list', this.props.profile);
    }

    handleRenderMods = (event, mods) => this.setState({ loading: false, mods });
    componentWillUnmount() {
        window.ipc.removeListener('profile:mod:list', this.handleRenderMods);
    }

    render() {
        return (
            <div className="profile-mods-wrapper">
                <div className={`profile-mods-loading ${this.state.loading ? '' : 'hidden'}`}>
                    <div className="lds-dual-ring"></div>
                </div>
                <div className="profile-mods-header">
                </div>
                <div className="profile-mods-content">
                    {this.state.mods.map(mod => {
                        return (
                            <div key={mod._id} className="profile-mods-mod">
                                <div className="pmm-select">
                                </div>
                                <div className="pmm-switch">
                                    <Switch id={`${mod._id}.enabled`} getValue={() => true} setValue={next => {}} />
                                </div>
                                <div className="pmm-title">
                                    <p>{mod.name} <span>{mod.authors.length > 0 ? `by ${mod.authors[0]}` : ``}</span></p>
                                </div>
                                <div className="pmm-delete">
                                    <Button classList="pmm-delete-btn" onClick={() => alert('deleting mod')}>
                                        <i className="fas fa-trash-alt"></i>
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

class Screenshots extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
        };

        if (props.profile !== undefined)
            window.ipc.send('profile:screenshot:list', props.profile);
    }

    componentWillMount() {
        window.ipc.on('profile:screenshot:render', this.handleRender)
    }
    componentWillUnmount() {
        window.ipc.removeListener('profile:screenshot:render', this.handleRender)
    }

    handleRender = (event, payload) => {
        this.setState({
            images: payload,
            loading: false,
        })
    };

    getImagesSafe() {
        if (this.state.images === undefined)
            return [];
        return this.state.images;
    }

    handleDelete = (image) => {
        this.setState({ loading: true });
        window.ipc.send('profile:screenshot:delete', {
            profile: this.props.profile,
            image: image
        });
        Snackbar.sendSnack({
            body: `Deleted ${image}`
        });
    };

    handleFocus = image => {
        // todo this should be called by clicking at some point as well
        alert('// not implemented //');
    };

    render() {
        if (this.state.images !== undefined && this.state.images.length === 0)
            return (
                <div className="profile-screenshots-none">
                    <div>
                        <i className="fas fa-image"></i>
                        <br />
                        No screenshots were found!
                    </div>
                </div>
            );
        else return (
            <div className="profile-screenshots-wrapper">
                <h1>Screenshots - {this.getImagesSafe().length}</h1>
                <div className="profile-screenshots">
                    <div className={`profile-screenshots-loading ${this.state.loading ? '' : 'hidden'}`}>
                        <div className="lds-dual-ring"></div>
                    </div>
                    {this.getImagesSafe().map(image => {
                        return (
                            <div>
                                <ContextMenuTrigger id={image.name}>
                                    <div className="profile-screenshot">
                                        <img src={image.src} alt={image.name} />
                                        <div>
                                            {image.name}
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenu id={image.name}>
                                    <MenuItem onClick={() => this.handleFocus(image)}><i className="fas fa-image"></i>Focus</MenuItem>
                                    <MenuItem onClick={() => window.ipc.send('open-item', image.path)}><i className="fas fa-file-image"></i>Show File</MenuItem>
                                    <MenuItem divider />
                                    <MenuItem onClick={() => this.handleDelete(image.name)}><i className="fas fa-trash-alt"></i>Trash</MenuItem>
                                </ContextMenu>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }
}

export {
    ProfileOptions,
}
