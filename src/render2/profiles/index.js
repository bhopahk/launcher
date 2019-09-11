import React from 'react';
import { Link, BrowserRouter as Router, Redirect, Route } from 'react-router-dom';
import { ContextMenu, ContextMenuTrigger, MenuItem } from 'react-contextmenu';
import { flavorIcon } from "../common/helper";
import { LoadingOverlay } from "../common/overlay";
import { Tab } from "../sidebar";

import './profiles.css';
import './profile_settings.css';
import {ModalConductor} from "../../render/modal/Modal";

class Profiles extends React.Component {
    constructor(props) {
        super(props);

        this.rerender = (_, profiles) => this.setState({ profiles });
        this.state = { };
    }

    componentDidMount() {
        window.ipc.on('profile:render', this.rerender);
        window.ipc.send('profile:list');
    }
    componentWillUnmount() {
        window.ipc.removeListener('profile:render', this.rerender);
    }

    render() {
        if (!this.state.profiles)
            return <div className="profiles"><LoadingOverlay padding={0} /></div>;

        return this.state.profiles.length === 0 ? (
            <div className="profiles-empty">
                <h1><i className="fas fa-exclamation"/></h1>
                <p>You do not appear to have any profiles installed!</p>
                <p>Consider&nbsp;
                    <Link to="/curse">installing one from curse</Link>
                    , or&nbsp;
                    <Link to="custom">creating your own</Link>.
                </p>
            </div>
        ) : (
            <div className="profiles">
                {this.state.profiles.map(profile => (
                    <Profile key={profile.name} {...profile} redirect={loc => this.props.history.push(loc)} />
                ))}
            </div>
        );
    }
}

const Profile = props => (
    <div>
        <ContextMenuTrigger id={props.name}>
            <div className="profile">
                <div className="profile-flavor">
                    <i className={`fas fa-${flavorIcon(props.flavor)}`}/>
                </div>
                <img src={props.icon} alt={props.name}/>
                <div className="profile-content" style={{backgroundImage: `url("${props.icon}")`}}>
                    <div className="profile-blur" />
                    <div className="profile-details">
                        <h1>{props.name}</h1>
                        <p>{props.minecraftVersion}{props.played === 0 ? null : <span>•</span>}{props.played === 0 ? null : new Date(props.played).toLocaleDateString()}</p>
                    </div>
                    <div className="profile-play" onClick={() => props.onLaunch(props.name)}>
                        <i className="fas fa-play"/>
                    </div>
                </div>
            </div>
        </ContextMenuTrigger>
        <ContextMenu id={props.name}>
            <MenuItem onClick={() => window.ipc.send('profile:launch', props.name)}><i className="fas fa-play"/>Launch</MenuItem>
            <MenuItem onClick={() => alert("// not implemented //")} disabled><i className={`fa${props.favorite ? 'r' : 's'} fa-star`}/>Favorite</MenuItem>
            <MenuItem onClick={() => props.redirect(`/profiles/${props.name}/settings`)}><i className="fas fa-cog"/>Settings</MenuItem>
            <MenuItem onClick={() => window.ipc.send('open:folder', props.directory)}><i className="fas fa-folder"/>Open Folder</MenuItem>
            <MenuItem onClick={() => alert("// not implemented //")} disabled><i className="fas fa-link"/>Create Shortcut</MenuItem>
            <MenuItem onClick={() => alert("// not implemented //")} disabled><i className="fas fa-file-export"/>Export</MenuItem>
            <MenuItem divider />
            <MenuItem onClick={() => window.ipc.send('profile:delete', props.name)}><i className="fas fa-trash-alt"/>Delete</MenuItem>
        </ContextMenu>
    </div>
);

class ProfileSettings extends React.Component {
    constructor(props) {
        super(props);

        this.imageSelect = React.createRef();

        this.state = window.ipc.sendSync('profile:get', props.match.params.name);
    }


    render() {
        return (
            <div className="profile-settings-wrapper">
                <div className="profile-settings">
                    <div className="profile-settings-close">
                        <Link to="/profiles"><i className="material-icons">close</i></Link>
                    </div>
                    <div className="sidebar-group profile-settings-sidebar">
                        <div className="profile-icon">
                            <div onClick={() => this.imageSelect.current.click()}>
                                <p>Change Icon</p>
                            </div>
                            <input type="file" ref={this.imageSelect} accept="image/png" onChange={e => this.handleChangeIcon(this.state.name, e.target.files[0].path)} hidden />
                            <img src={this.state.icon} alt="Profile Icon" />
                        </div>
                        <Tab exact to={`/profiles/${this.state.name}/settings`} icon="fire" display="Overview"/>
                        {this.state.flavor === 'vanilla' || <Tab exact to={`/profiles/${this.state.name}/settings/mods`} icon="fire" display="Mods"/>}
                        <Tab exact to={`/profiles/${this.state.name}/settings/screenshots`} icon="fire" display="Screenshots"/>
                        <Tab exact to={`/profiles/${this.state.name}/settings/textures`} icon="fire" display="Resource Packs"/>
                        <Tab exact to={`/profiles/${this.state.name}/settings/worlds`} icon="fire" display="Worlds"/>
                    </div>
                    <div className="profile-settings-content">
                        PROFILE_SETTINGS!!!
                        <Router>
                            {/*<Route exact path="" render={() => <Redirect to={`/profiles/${this.state.name}/settings/overview`}/>}/>*/}
                        </Router>
                    </div>
                </div>
            </div>
        );
    }
}

export {
    Profiles, ProfileSettings
}
