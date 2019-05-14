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
import './settings.css';
import {ModalConductor} from "../modal/Modal";

class SettingsWrapper extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: props.default,
        };
    }

    getRenderedPage() {
        for (let i = 0; i < this.props.children.length; i++)
            if (this.props.children[i].props.id === this.state.active)
                return this.props.children[i].props.children;
    }

    render() {
        return (
            <div className="settings-wrapper">
                <div className="settings-close">
                    <i className="material-icons" onClick={() => ModalConductor.closeModals()}>close</i>
                </div>
                <div className="settings-selector">
                    <h1>Settings</h1>
                    <hr/>
                    {this.props.children.map(child => {
                        return React.cloneElement(child, {
                            key: child.props.id ? child.props.id : Math.random(),
                            active: child.props.id === this.state.active,
                            onSelect: () => this.setState({ active: child.props.id }),
                        });
                    })}
                    <hr/>
                    <div className="settings-links">
                        <i className="fab fa-github" onClick={() => {window.ipc.send('open-external', 'https://github.com/bhopahk/launcher')}}></i>
                        <i className="fab fa-discord" onClick={() => {window.ipc.send('open-external', 'https://www.google.com/search?q=this+will+be+a+discord+link+eventually')}}></i>
                    </div>
                </div>
                <div className="settings-page">
                    {this.getRenderedPage()}
                </div>
            </div>
        );
    }
}

const Settings = (props) => {
    return (
        <button className={props.active ? 'active' : ''} onClick={() => props.onSelect()}>
            {props.display}
        </button>
    );
};

const Separator = () => {
    return (<hr/>);
};

export {
    SettingsWrapper,
    Settings,
    Separator,
}
