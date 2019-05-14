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
                        active: this.state.active === child.props.value || this.state[child.props.value] === true,
                        onSelect: () => {
                            if (!this.props.multiple)
                                this.setState({ active: child.props.value });
                            else {
                                let newState = {};
                                newState[child.props.value] = !this.state[child.props.value];
                                this.setState(newState);
                            }
                        }
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
                <input id={props.value} value={props.value} type="checkbox" checked={props.active} onChange={() => { /* Fix to error saying the field is immutable. */ }} />
                <label htmlFor={props.value}></label>
            </div>
            <h5>{props.display}</h5>
            <p>{props.description}</p>
        </div>
    )
};

class Switch extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            value: this.props.getValue(),
        }
    }

    handleChange(e) {
        this.props.setValue(e.target.checked);
        this.setState({
            value: this.props.getValue()
        })
    }

    render() {
        return (
            <div className="switch">
                <input id={this.props.id} type="checkbox" onChange={this.handleChange.bind(this)} checked={this.state.value} />
                <label htmlFor={this.props.id}></label>
            </div>
        );
    }
}

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

class Dropdown extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: props.default ? props.default : props.children[0].props.value,
            shown: false,
        }
    }

    componentWillMount() {
        this._ismounted = true;
        document.addEventListener('click', this.onClickAnywhere.bind(this))
    }

    componentWillUnmount() {
        this._ismounted = false;
        document.removeEventListener('click', this.onClickAnywhere.bind(this))
    }

    getActiveDisplay() {
        for (let i = 0; i < this.props.children.length; i++)
            if (this.props.children[i].props.value === this.state.active)
                return {
                    display: this.props.children[i].props.display,
                    description: this.props.children[i].props.description,
                };
    }

    onClickAnywhere(e) {
        const dropdowns = document.getElementsByClassName('dropdown');
        for (let i = 0; i < dropdowns.length; i++)
            if (dropdowns[i].contains(e.target))
                return;

        if (!this._ismounted)
            return;
        this.setState({
            shown: false,
        });
    }

    render() {
        const active = this.getActiveDisplay();

        return (
            <div className={`dropdown ${this.props.small ? 'small' : ''}`}>
                <div className="dropdown-active" onClick={() => this.setState({ shown: !this.state.shown })}>
                    <div>
                        <h5>{active.display}</h5>
                        <p>{active.description}</p>
                    </div>
                    <i className="fas fa-chevron-down"></i>
                </div>
                <div className={`dropdown-options ${this.state.shown ? '' : 'hidden'}`}>
                    {this.props.children.map(child => {
                        return React.cloneElement(child, {
                            key: child.props.value,
                            active: child.props.value === this.state.active,
                            onSelect: () => {this.setState({
                                active: child.props.value,
                                shown: false,
                            })}
                        });
                    })}
                </div>
            </div>
        );
    }
}

const Option = (props) => {
    return (
        <div className={`dropdown-option ${props.active ? 'active' : ''}`} onClick={() => props.onSelect()}>
            <h5>{props.display}</h5>
            <p>{props.description}</p>
        </div>
    );
};

export {
    Checkbox,
    Check,
    Switch,
    FolderSelect,
    Button,
    Dropdown,
    Option,
}
