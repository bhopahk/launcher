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
                        return (<button key={child.props.id ? child.props.id : Math.random()}
                                        className={child.props.id === this.state.active ? 'active' : ''}
                                        onClick={() => this.setState({ active: child.props.id })}>{child.props.display}</button>)
                    })}
                    <hr/>
                    <div className="settings-links">
                        <i className="fab fa-github" onClick={() => {window.ipc.send('open-external', 'https://github.com/bhopahk/launcher')}}></i>
                        <i className="fab fa-discord" onClick={() => {window.ipc.send('open-external', 'https://www.google.com/search?q=this+will+be+a+discord+link+eventually')}}></i>
                    </div>
                </div>
                {this.props.children.map(child => {
                    if (child.props.id === this.state.active)
                        return child;
                    return null;
                })}
            </div>
        );
    }
}

const Settings = (props) => {
    return (
        <div className="settings-page">
            {React.Children.map(props.children, child => {
                return React.cloneElement(child, {
                    key: child.props.title ? child.props.title : Math.random(),
                    parentId: props.id,
                });
            })}
        </div>
    );
};

const Separator = () => {
    return (<hr/>);
};

const Title = (props) => {
    return (<h1>{props.children}</h1>)
};

export {
    SettingsWrapper,
    Settings,
    Separator,
    Title,
}
