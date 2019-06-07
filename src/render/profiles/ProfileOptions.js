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
import { ModalPageWrapper, ModalPage } from '../layout/ModalPages';
import { ContextMenu, ContextMenuTrigger, MenuItem } from 'react-contextmenu';
import Snackbar from '../snackbar/Snackbar';

class ProfileOptions extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: ''
        }
    }

    render() {
        return (
            <ModalPageWrapper default="overview">
                <ModalPage header>
                    <img src={this.props.profile.icon} alt="Profile Icon" />
                </ModalPage>
                <ModalPage id="overview" display="Overview">
                    <p>Profile Overview</p>
                </ModalPage>
                <ModalPage id="screenshots" display="Screenshots">
                    <Screenshots profile={this.props.profile.name} />
                </ModalPage>
                <ModalPage id="mods" display="Mods" disabled>
                    <p>Profile Overview</p>
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

class Screenshots extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
        };

        window.ipc.on('profile:screenshots', (event, payload) => {
            this.setState({
                images: payload,
                loading: false,
            })
        });

        if (props.profile !== undefined)
            window.ipc.send('profile:screenshots', props.profile);
    }

    getImagesSafe() {
        if (this.state.images === undefined)
            return [];
        return this.state.images;
    }

    handleDelete = (image) => {
        this.setState({ loading: true });
        window.ipc.send('profile:screenshots:delete', {
            profile: this.props.profile,
            image: image
        });
        Snackbar.sendSnack({
            body: `Deleted ${image}`
        });
    };

    render() {
        if (this.state.images !== undefined && this.state.images.length === 0)
            return (
                <div className="profile-screenshots-none">
                    <div>
                        <p>THERE ARE NO SCREENSHOTS</p>
                    </div>
                </div>
            );
        else return (
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
                                <MenuItem onClick={() => alert("open large")}><i className="fas fa-image"></i>Focus</MenuItem>
                                <MenuItem onClick={() => window.ipc.send('open-item', image.path)}><i className="fas fa-file-image"></i>Show File</MenuItem>
                                <MenuItem divider />
                                <MenuItem onClick={() => this.handleDelete(image.name)}><i className="fas fa-trash-alt"></i>Trash</MenuItem>
                            </ContextMenu>
                        </div>
                    )
                })}
            </div>
        );
    }
}

export {
    ProfileOptions,
}
