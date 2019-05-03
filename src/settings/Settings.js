import React from 'react';
import './settings.css';

class Settings extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: props.default,
            index: this.findIndex(props.default),
        }
    }

    openPage(page) {
        this.setState({
            active: page,
            index: this.findIndex(page),
        })
    }

    findIndex(page) {
        let index = 0;
        let i = 0;
        this.props.children.forEach(child => {
            if (child.props.name === page)
                index = i;
            i++;
        });
        return index;
    }

    render() {
        return (
            <div className="settings">
                <div className="settings-list">
                    {this.props.children.map(child => {
                        return (
                            <button key={child.props.name} className={`${child.props.name === this.state.active ? 'active' : ''}`} onClick={() => this.openPage(child.props.name)}>{child.props.display}</button>
                        );
                    })}
                </div>
                <div className="settings-content scroll">
                    {this.props.children[this.state.index]}
                </div>
            </div>
        );
    }
}

const SettingsPage = (props) => {
    return (
        <div className="settings-page">
            {props.children}
        </div>
    );
};

export {
    Settings,
    SettingsPage
}
