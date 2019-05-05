import React from 'react';
import "./sidebar.css";
import "./content.css";
import logo from '../static/LauncherNoText.png'

class Sidebar extends React.Component {
    constructor(props) {
        super(props);

        let p = {
            activeGroup: 0,
            activeItem: 0,
            links: [],
        };
        props.children.forEach(child => {
            if (child.type.name === 'SidebarHeader')
                p.header = child;
            if (child.type.name === 'SidebarFooter')
                p.footer = child;
            if (child.type.name === 'SidebarGroup') {
                p.links[child.props.index] = [];
                child.props.children.forEach(childChild => {
                    p.links[child.props.index].push(childChild);
                    if (childChild.props.id === props.default) {
                        p.activeGroup = child.props.index;
                        p.activeItem = p.links[child.props.index].length - 1;
                    }
                });
            }
        });
        console.log(p);

        this.state = p;
    }

    setActive(group, item, stop) {
        if (stop)
            return;
        let active = this.state.links[group][item];
        if (active.type.name === 'Link') {
            active.props.onClick();
            return;
        }

        this.setState({
            activeGroup: group,
            activeItem: item,
        });
    }

    render() {
        let group = -1;
        let item = -1;
        const active = this.state.links[this.state.activeGroup][this.state.activeItem];
        return (
            <div className="wrapper">
                <div className="sidebar">
                    {this.state.header}
                    {this.props.children.map(child => {
                        item = -1;
                        if (child.type.name !== 'SidebarGroup')
                            return (<div key={Math.random()}></div>);
                        group++;
                        return (
                            <div key={child.props.title} className="group">
                                <p>{child.props.title.toUpperCase()}</p>
                                {child.props.children.map(link => {
                                    item++;
                                    const g = group;
                                    const i = item;
                                    return (<button key={link.props.id}
                                                    className={`${this.state.activeGroup === group && this.state.activeItem === item ? 'active' : '' }
                                                        ${link.props.disabled ? 'disabled' : ''}`}
                                                    onClick={() => {this.setActive(g, i, link.props.disabled)}}>
                                        <i className={`fas fa-${link.props.icon}`}></i>{link.props.display}
                                    </button>)
                                })}
                            </div>
                        )
                    })}
                    {this.state.footer}
                </div>
                <div className="content">
                    {active}
                </div>
            </div>
        );
    }
}

const SidebarHeader = (props) => {
    return (
        <div className="sidebar-header">
            <img src={logo} alt="Launcher Logo" />
            <h1>Named Launcher</h1>
        </div>
    );
};

const SidebarFooter = (props) => {
    return (
        <div className="sidebar-footer">
            <button onClick={() => {alert('opening settings')}}><i className="fas fa-cog flip"></i></button>
            <button onClick={() => {window.ipc.send('open-external', 'https://www.google.com/search?q=this+will+be+a+discord+link+eventually')}}><i className="fab fa-discord"></i></button>
            <button onClick={() => {alert('showing changelog')}}>v1.2.3</button>
        </div>
    );
};

const SidebarGroup = () => {};

const Page = (props) => {
    return (
        <div className="page-wrapper">
            {props.children}
        </div>
    );
};

const Link = () => {};

export {
    Sidebar,
    SidebarHeader,
    SidebarFooter,
    SidebarGroup,
    Page, Link
};
