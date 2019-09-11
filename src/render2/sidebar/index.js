import React from 'react';
import { NavLink } from 'react-router-dom';
import QuickLaunch from "../profiles/quick";
import Tasks from './tasks';
import { ImageSquare, Title } from "../../render/layout/Generic";

import './sidebar.css';
import logo from "../../render/static/LauncherNoText.png";

export default class Sidebar extends React.Component {
    static tasks = React.createRef();

    render() {
        return (
            <div className="sidebar sidebar-normal">
                <div className="sidebar-header">
                    <ImageSquare src={logo} alt="Proton Launcher" size={35} />
                    <Title>Proton Launcher</Title>
                </div>
                <nav>
                    <div className="sidebar-group">
                        <p>library</p>
                        <Tab exact to="/profiles" icon="list" display="Profiles" />
                        <Tab exact to="/accounts" icon="user" display="Accounts" />
                        <Tab disabled exact to="/" icon="lock" display="Coming Soon" />
                    </div>
                    <div className="sidebar-group">
                        <p>install</p>
                        <Tab disabled exact to="/" icon="star" display="Recommended" />
                        <Tab exact to="/curse" icon="fire" display="Curse Modpacks" />
                        <Tab disabled exact to="/" icon="wrench" display="Technic Modpacks" />
                        <Tab exact to="/custom" icon="tools" display="Custom Profile" />
                    </div>
                    <div className="sidebar-group">
                        <p>quick launch</p>
                        <QuickLaunch />
                    </div>
                </nav>
                <div className="sidebar-footer">
                    <button><i className="fas fa-cog"/></button>
                    <Tasks ref={Sidebar.tasks} />
                    <button>v1.2.3</button>
                    {/*{this.getVersionButton()}*/}
                </div>
            </div>
        );
    }
}

const Tab = props => props.disabled || props.clickable ?
    <button className={props.disabled && 'disabled'} onClick={() => props.clickable && props.onClick()}><i className={`fas fa-${props.icon}`}/>{props.display}</button> :
    <NavLink to={props.to} exact={props.exact} activeClassName="active"><i className={`fas fa-${props.icon}`}/>{props.display}</NavLink>;

export {
    Tab
}