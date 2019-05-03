import React from 'react';
import './input.css'

const Text = (props) => {
    return (
        <div className="text">
            <input id={props.id} type="text" onChange={(e) => props.onInput(e)} required={true} value={props.getValue()} />
            <label htmlFor={props.id}>{props.label}</label>
        </div>
    );
};

const Password = (props) => {
    return (
        <div className="text">
            <input id={props.id} type="password" onChange={(e) => props.onInput(e)} required={true} value={props.getValue()} />
            <label htmlFor={props.id}>{props.label}</label>
        </div>
    );
};

const File = (props) => {
    return (
        <label>
            {props.label}
            <input id={props.id} type="file" accept={props.accept} onChange={e => props.onInput(e)} />
        </label>
    );
};

const Switch = (props) => {
    return (
        <div className="switch">
            <input id={props.id} type="checkbox" name={props.id} onChange={(e) => props.onInput(e, e.target.checked)} value={props.getValue()} />
            <label htmlFor={props.id}></label>
        </div>
    );
};

const Checkbox = (props) => {
    return (
        <div className="check">
            <input id={props.id} type="checkbox" onChange={(e) => props.onInput(e, e.target.checked)} value={props.getValue()} />
            <label htmlFor={props.id}></label>
        </div>
    );
};

const Radio = (props) => {
    return (
        <div className="radio">
            {props.children.map(child => {
                return React.cloneElement(child, {
                    key: child.props.id,
                    group: props.id,
                    onInput: (event) => {
                        event.target.id = props.id;
                        props.onInput(event);
                    },
                });
            })}
        </div>
    );
};

const RadioOption = (props) => {
    return (
        <div className="">
            <input id={props.id} type="radio" name={props.group} value={props.value} onChange={(e) => props.onInput(e)} />
            <label htmlFor={props.id}>{props.label}</label>
        </div>
    );
};

const Range = (props) => {
    return (
        <label>
            {props.label}
            <input id={props.id} type="range" min={props.min} max={props.max} value={props.getValue(props.value)} step={props.step} onChange={(e) => props.onInput(e)} />
        </label>
    );
};

const Progress = (props) => {
    return (
        <div className="progress">
            <progress id={props.id} max={props.max} value={props.value}></progress>
        </div>
    );
};

class Dropdown extends React.Component {
    constructor(props) {
        super(props);
        if (this.props.default)
            this.props.onInput({ target: { id: this.props.id } }, this.props.default);
    }

    render() {
        return (
            <div className="dropdown">
                <select id={this.props.id} defaultValue={this.props.default} onChange={(e) => this.props.onInput(e)}>
                    {this.props.children}
                </select>
                <label htmlFor={this.props.id}>{this.props.label}</label>
            </div>
        );
    }
}

const DropdownOption = (props) => {
    return (
        <option value={props.value}>{props.name}</option>
    );
};

class ColorPicker extends React.Component {
    constructor(props) {
        super(props);

        let val = props.getValue(this.props.default);
        if (val == null)
            val = '000000';
        let rgb = ColorPicker.hexToRgb(`${val.startsWith('#') ? '' : '#'}${val}`);
        // if (this.props.default)
        //     rgb = ColorPicker.hexToRgb(`${this.props.default.startsWith('#') ? '' : '#'}${this.props.default}`);
        // else rgb = { r: 0, g: 0, b: 0 };

        this.state = {
            red: rgb.r,
            green: rgb.g,
            blue: rgb.b
        }
    }

    // Credits to https://stackoverflow.com/a/5624139/9842323
    static hexToRgb(hex) {
        let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    static rgbToHex(r, g, b) {
        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    update(type, value) {
        let newState = {};
        newState[type] = parseInt(value);
        this.setState(newState);
        let hex = ColorPicker.rgbToHex(this.state.red, this.state.green, this.state.blue);
        console.log(hex);
        this.props.onInput({
            target: { id: this.props.id }
        }, hex);
    }

    render() {
        const hex = ColorPicker.rgbToHex(this.state.red, this.state.green, this.state.blue);
        return (
            <div className="color-picker">
                <p>Hex</p>
                <main style={{
                    borderBottom: `2px solid #${hex}`,
                    color: `#${hex}`,
                    }}>#
                    <input type="text" defaultValue={hex} onChange={e => {
                        if (e.target.value.length !== 6)
                            return;
                        let rgb = ColorPicker.hexToRgb(e.target.value);
                        this.setState({
                            red: rgb.r,
                            green: rgb.g,
                            blue: rgb.b,
                        });
                    }} />
                </main>
                <div>
                    <p>
                        R
                        <input type="text" value={this.state.red} onChange={e => this.update('red', e.target.value)} style={{
                            borderBottom: `1px solid #${ColorPicker.rgbToHex(this.state.red, 0, 0)}`
                        }} />
                    </p>
                    <p>
                        G
                        <input type="text" value={this.state.green} onChange={e => this.update('green', e.target.value)} style={{
                            borderBottom: `1px solid #${ColorPicker.rgbToHex(0, this.state.green, 0)}`
                        }} />
                    </p>
                    <p>
                        B
                        <input type="text" value={this.state.blue} onChange={e => this.update('blue', e.target.value)} style={{
                            borderBottom: `1px solid #${ColorPicker.rgbToHex(0, 0, this.state.blue)}`
                        }} />
                    </p>
                </div>
            </div>
        )
    }
}

export {
    Text,
    Password,
    File,
    Switch,
    Checkbox,
    Radio,
    RadioOption,
    Range,
    Progress,
    Dropdown,
    DropdownOption,
    ColorPicker
}
