import React from 'react';
import { NavLink } from 'react-router-dom';
import { ImageSquare, Title } from "../../render/layout/Generic";
import logo from "../../render/static/LauncherNoText.png";
// import {ModalConductor} from "../../render/modal/Modal";
import Tasks from './tasks';
import './sidebar.css';
// import {Downloads} from "../../render/download/Downloads";

export default class Sidebar extends React.Component {
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
                        <Tab exact to="/profiles" icon="lock" display="Profiles" />
                        <Tab exact to="/accounts" icon="lock" display="Accounts" />
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
                    </div>
                </nav>
                <div className="sidebar-footer">
                    <button><i className="fas fa-cog"/></button>
                    <Tasks />
                    <button>v1.2.3</button>
                    {/*{this.getVersionButton()}*/}
                </div>
            </div>
        );
    }
}

const Tab = props => props.disabled ?
    <a href="javascript:void(0)" className="disabled"><i className={`fas fa-${props.icon}`}/>{props.display}</a> :
    <NavLink to={props.to} exact={props.exact} activeClassName="active"><i className={`fas fa-${props.icon}`}/>{props.display}</NavLink>;