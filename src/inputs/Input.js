import React from 'react';
import './input.css'
import MaterialIcon from "../core/Icon";

const Text = (props) => {
    return (
        <div className="text">
            <input id={props.id} type="text" onInput={(e) => props.onInput(e)} required={true}/>
            <label htmlFor={props.id}>{props.label}</label>
        </div>
    );
};

const Password = (props) => {
    return (
        <div className="text">
            <input id={props.id} type="password" onInput={(e) => props.onInput(e)} required={true} />
            <label htmlFor={props.id}>{props.label}</label>
        </div>
    );
};

const TextArea = (props) => {
    return (
        <label>
            {props.label}
            <textarea id={props.id} placeholder={props.placeholder} onInput={(e) => props.onInput(e)} rows={props.height} cols={props.width}></textarea>
        </label>
    );
};

const File = (props) => {
    return (
        <label>
            {props.label}
            <input id={props.id} type="file" accept={props.accept} onInput={e => props.onInput(e)} />
        </label>
    );
};

const Switch = (props) => {
    return (
        <label>
            {props.label}
            <label className="switch">
                <input id={props.id} type="checkbox" onInput={(e) => props.onInput(e, e.target.checked)} />
                <span></span>
            </label>
        </label>
    );
};

const Checkbox = (props) => {
    return (
        <div className="check">
            {props.label}
            <input id={props.id} type="checkbox" onInput={(e) => props.onInput(e, e.target.checked)} />
            <span></span>
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
        <label>
            {props.label}
            <input type="radio" name={props.group} value={props.value} onInput={(e) => props.onInput(e)} />
        </label>
    );
};

const Range = (props) => {
    return (
        <label>
            {props.label}
            <input type="range" min={props.min} max={props.max} value={props.value} step={props.step} onInput={(e) => props.onInput(e)} />
        </label>
    );
};

const Progress = (props) => {
    return (
        <label>
            {props.label}
            <progress id={props.id} max={props.max} value={props.value}></progress>
        </label>
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
            <label>
                {this.props.label}
                <select id={this.props.id} defaultValue={this.props.default} onInput={(e) => this.props.onInput(e)}>
                    {this.props.children}
                </select>
            </label>
        );
    }
}

const DropdownOption = (props) => {
    return (
        <option value={props.value}>{props.name}</option>//
    );
};

class ColorPicker extends React.Component {
    constructor(props) {
        super(props);

        let rgb;
        if (this.props.default)
            rgb = ColorPicker.hexToRgb(`${this.props.default.startsWith('#') ? '' : '#'}${this.props.default}`);
        else rgb = { r: 0, g: 0, b: 0 };

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
        newState[type] = value;
        this.setState(newState);
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
                    <input type="text" defaultValue={hex} onInput={e => {
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
                        <input type="text" value={this.state.red} onInput={e => this.update('red', e.target.value)} style={{
                            borderBottom: `1px solid #${ColorPicker.rgbToHex(this.state.red, 0, 0)}`
                        }} />
                    </p>
                    <p>
                        G
                        <input type="text" value={this.state.green} onInput={e => this.update('green', e.target.value)} style={{
                            borderBottom: `1px solid #${ColorPicker.rgbToHex(0, this.state.green, 0)}`
                        }} />
                    </p>
                    <p>
                        B
                        <input type="text" value={this.state.blue} onInput={e => this.update('blue', e.target.value)} style={{
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
    TextArea,
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
