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
import { ModalPageWrapper, ModalPage } from '../layout/ModalPages';

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
                    <p>Screenshots</p>
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

        this.state = { };

        window.ipc.on('profile:screenshots', (event, payload) => {

        })
    }

    render() {
        if (this.state.images !== undefined && this.state.images.length === 0)
            return (
                <div className="profile-screenshots-none">
                    <div className="profile-screenshots-error">

                    </div>
                </div>
            );
        else return (
            <div className="profile-screenshots">

            </div>
        );
    }
}

export {
    ProfileOptions,
}
