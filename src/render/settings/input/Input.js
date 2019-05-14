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
import './input.css';

class Checkbox extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: ''
        }
    }

    render() {
        return (
            <div className="">
                {this.props.children.map(child => {
                    return React.cloneElement(child, {
                        key: child.props.value,
                        active: this.state.active === child.props.value,
                        onSelect: () => this.setState({ active: child.props.value }),
                    });
                })}
            </div>
        );
    }
}

const Check = (props) => {
    return (
        <div className="check" onClick={() => {props.onSelect()}}>
            <div className="checkbox">
                <input id={props.value} value={props.value} type="checkbox" checked={props.active} />
                <label htmlFor={props.value}></label>
            </div>
            <h5>{props.display}</h5>
            <p>{props.description}</p>
        </div>
    )
};

const Switch = (props) => {
    return (
        <div className="switch">
            <input id={props.id} type="checkbox" />
            <label htmlFor={props.id}></label>
        </div>
    );
};

class FolderSelect extends React.Component {
    constructor(props) {
        super(props);

        this.input = React.createRef();

        this.state = {
            active: '',
        };
    }

    componentDidMount() {
        // Workaround to unsupported attribute. According to V, this is fixed but it does not seem to work.
        // https://reactjs.org/blog/2017/09/08/dom-attributes-in-react-16.html
        this.input.current.webkitdirectory = true;
    }

    render() {
        return (
            <div className="folder" onClick={() => this.input.current.click()}>
                <input type="file" ref={this.input} onChange={e => this.setState({ active: e.target.files[0].path })} hidden />
                <p>{this.state.active === '' ? 'Select a folder...' : this.state.active}</p>
                <i className="fas fa-ellipsis-v"></i>
            </div>
        );
    }
}

const Button = (props) => {
    return (
        <button className={`btn ${props.style}`}>{props.display}</button>
    );
};

export {
    Checkbox,
    Check,
    Switch,
    FolderSelect,
    Button,
}
