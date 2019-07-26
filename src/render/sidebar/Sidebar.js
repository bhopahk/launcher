import React from 'react';
import "./sidebar.css";
import "./content.css";
import logo from '../static/LauncherNoText.png'

import { Title, ImageSquare } from '../layout/Generic'
import { Downloads } from '../download/Downloads';
import { ModalConductor } from "../modal/Modal";

class Sidebar extends React.Component {
    constructor(props) {
        super(props);

        let p = {
            activeGroup: 0,
            activeItem: 0,
            links: [],
        };
        let index = 0;
        React.Children.forEach(this.props.children, child => {
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
            try {
                if (!downloads.contains(e.target))
                    downloads.classList.remove('active');
            } catch (e) {

            }
        })
    }

    setActive(group, item, stop) {
        if (stop)
            return;
        let active;
        for (const child of React.Children.toArray(this.props.children))
            if (child.props.index === group)
                active = React.Children.toArray(child.props.children)[item];
        if (active.props.hasOwnProperty('onClick')) {
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
                <div className={`sidebar ${this.props.vibrant ? 'sidebar-vibrant' : 'sidebar-normal'}`}>
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
            <ImageSquare src={logo} alt="Proton Launcher" size={35} />
            <Title>Proton Launcher</Title>
        </div>
    );
};

class SidebarFooter extends React.Component {
    constructor(props) {
        super(props);

        const version = window.ipc.sendSync('updater:status', {});

        this.state = {
            current: version.version,
            available: version.available,
            checking: false,
        };

        window.ipc.on('updater:checking', () => {
            this.setState({ checking: true });
        });
        window.ipc.on('updater:checked', (event, data) => {
            this.setState({
                current: data.version,
                available: data.available,
                next: data.nextVersion,
                checking: false,
            });
        });
    }

    handleUpdateClick() {
        if (this.state.available)
            window.ipc.send('updater:update', {});
        else window.ipc.send('updater:check', {})
    }

    getVersionButton() {
        if (this.state.checking)
            return (
                <button onClick={() => {this.handleUpdateClick()}}><i className="fas fa-sync-alt"></i></button>
            );
        else return (
            <button className={this.state.available ? 'active' : ''} onClick={() => {this.handleUpdateClick()}}>v{this.state.current}</button>
        );
    }

    render() {
        return (
            <div className="sidebar-footer">
                <button onClick={() => {ModalConductor.openModal('settingsModal')}}><i className="fas fa-cog"></i></button>
                <Downloads />
                {this.getVersionButton()}
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

const Link = () => {
    return (
        <div></div>
    );
};

export {
    Sidebar,
    SidebarHeader,
    SidebarFooter,
    SidebarGroup,
    Page, Link
};
