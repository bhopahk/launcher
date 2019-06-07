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
import './pages.css';
import { ModalConductor } from "../modal/Modal";

class ModalPageWrapper extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: props.default,
        };
    }

    render() {
        return (
            <div className="modal-page-wrapper">
                <div className="modal-page-close">
                    <i className="material-icons" onClick={() => ModalConductor.closeModals()}>close</i>
                </div>
                <div className="modal-page-selector">
                    {this.props.children[0]}
                    <hr/>
                    {this.props.children.map(child => {
                        if (child.props.header)
                            return null;
                        if (!child.props.id)
                            return child;
                        return (<button key={child.props.id ? child.props.id : Math.random()}
                                        className={`${child.props.id === this.state.active ? 'active' : ''} ${child.props.disabled ? 'disabled' : ''}`}
                                        onClick={() => { if (!child.props.disabled) this.setState({ active: child.props.id })}}>{child.props.display}</button>)
                    })}
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

const ModalPage = (props) => {
    if (props.header)
        return (
            <div className="modal-page-header">
                {props.children}
            </div>
        );
    else return (
        <div className="modal-page">
            {React.Children.map(props.children, child => {
                return React.cloneElement(child, {
                    key: child.props.title ? child.props.title : Math.random(),
                });
            })}
        </div>
    );
};

export {
    ModalPageWrapper,
    ModalPage,
}
