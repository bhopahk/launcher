import React from 'react';
import './newTabs.css'

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

    getDisplay(type, value) {
        if (type)
            return (<i className="material-icons">{value}</i>);
        return value;
    }

    render() {
        return (
            <div className="tabs">
                <div className="tab-list" style={this.props.style}>
                    {this.props.children.map(child => {
                        return (<button data-icon={child.props.icon} key={child.props.name} className={`${child.props.name === this.state.active ? 'active' : ''}`} onClick={() => this.openTab(child.props.name)}>
                            {this.getDisplay(child.props.icon, child.props.display)}
                            <div></div>
                        </button>);
                    })}
                </div>
                <hr/>
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
    Tab
}
