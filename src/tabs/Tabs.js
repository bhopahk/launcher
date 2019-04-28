import React from 'react';

import './tabs.css';

class Tabs extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: props.default,
            index: this.findIndex(props.default),
        };
    }

    openTab(tab) {
        this.setState({
            active: tab,
            index: this.findIndex(tab),
        });
    }

    findIndex(tab) {
        let index = 0;
        let i = 0;
        this.props.children.forEach(child => {
            if (child.props.name === tab)
                index = i;
            i++;
        });
        return index;
    }

    render() {
        return (
            <div className="tabs">
                <div className="tab-list">
                    {this.props.children.map(child => {
                        return (<button key={child.props.name} className={`${child.props.name === this.state.active ? 'active' : ''}`} style={{
                            width: `${100 / this.props.children.length}%`
                        }} onClick={() => this.openTab(child.props.name)}>{child.props.display}</button>);
                    })}
                    <hr style={{
                        width: `${100 / this.props.children.length}%`,
                        marginLeft: `${this.state.index * 100 / this.props.children.length}%`,
                    }} />
                </div>
                <div className={`tab-content ${this.props.children[this.state.index].props.scroll ? 'scroll' : ''}`}>
                    {this.props.children[this.state.index]}
                </div>
            </div>
        );
    }
}

const Tab = (props) => {
    return (
        <div className="tab">
            {props.children}
        </div>
    );
};

export {
    Tabs,
    Tab,
}
