import React from 'react';
import "./sidebar.css";
import "./content.css";
import "../download/downloads.css";
import logo from '../static/LauncherNoText.png'

class Sidebar extends React.Component {
    constructor(props) {
        super(props);

        let p = {
            activeGroup: 0,
            activeItem: 0,
            links: [],
        };
        let index = 0;
        props.children.forEach(child => {
            if (index === 0)
                p.header = child;
            else if (index === 4)
                p.footer = child;
            else {
                this.minifiedGroupName = child.type.name;
                p.links[child.props.index] = [];
                child.props.children.forEach(childChild => {
                    p.links[child.props.index].push(childChild);
                    if (childChild.props.id === props.default) {
                        p.activeGroup = child.props.index;
                        p.activeItem = p.links[child.props.index].length - 1;
                    }
                });
            }
            index++;
        });

        this.state = p;

        let downloads = null;
        document.addEventListener('click', e => {
            if (downloads == null)
                downloads = document.getElementById('downloads-button');
            if (!downloads.contains(e.target))
                document.getElementById('downloads-button').classList.remove('active');
        })
    }

    setActive(group, item, stop) {
        if (stop)
            return;
        let active = this.state.links[group][item];
        if (active.type.hasOwnProperty('onClick')) {
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
                        if (child.type.name !== this.minifiedGroupName)
                            return (<div key={Math.random()}></div>);
                        group++;
                        return (
                            <div key={child.props.title} className="group">
                                <p>{child.props.title.toUpperCase()}</p>
                                {child.props.children.map(link => {
                                    item++;
                                    const g = group;
                                    const i = item;
                                    return (<button key={link.props.id} id={link.props.id}
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

class SidebarFooter extends React.Component {
    constructor(props) {
        super(props);

        this.state = {

            totalProgress: 0.7,
        }
    }


    render() {
        const percentage = 100 * (1 - this.state.totalProgress);

        return (
            <div className="sidebar-footer">
                <button onClick={(event) => {event.target.classList.toggle('active')}}>
                    <i className="fas fa-cog flip"></i>
                </button>
                <button onClick={() => {window.ipc.send('open-external', 'https://www.google.com/search?q=this+will+be+a+discord+link+eventually')}}><i className="fab fa-discord"></i></button>
                <button id="downloads-button">
                    <i className="fas fa-arrow-alt-circle-down" style={{
                        background: `linear-gradient(#b5b3b3 ${percentage}%, #185cc9 ${percentage}%)`,
                        WebkitBackgroundClip: `text`
                    }} onClick={() => { document.getElementById('downloads-button').classList.toggle('active') }}></i>
                    <div className="downloads">
                        <p>Hello</p>
                    </div>
                </button>
                <button onClick={() => {alert('showing changelog')}}>v1.2.3</button>
            </div>
        );
    }
}

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
