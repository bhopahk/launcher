import React from 'react';
import { Link } from 'react-router-dom';
import { ContextMenu, ContextMenuTrigger, MenuItem } from 'react-contextmenu';
import { flavorIcon } from "../common/helper";

import './profiles.css';
import {LoadingOverlay} from "../common/overlay";

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
            <MenuItem onClick={() => props.redirect('/curse')}><i className="fas fa-cog"/>Settings</MenuItem>
            <MenuItem onClick={() => window.ipc.send('open:folder', props.directory)}><i className="fas fa-folder"/>Open Folder</MenuItem>
            <MenuItem onClick={() => alert("// not implemented //")} disabled><i className="fas fa-link"/>Create Shortcut</MenuItem>
            <MenuItem onClick={() => alert("// not implemented //")} disabled><i className="fas fa-file-export"/>Export</MenuItem>
            <MenuItem divider />
            <MenuItem onClick={() => window.ipc.send('profile:delete', props.name)}><i className="fas fa-trash-alt"/>Delete</MenuItem>
        </ContextMenu>
    </div>
);

class ProfileSettings extends React.Component {

    render() {
        return (
            <div>
                PROFILE_SETTINGS!!!
            </div>
        );
    }
}

export {
    Profiles, ProfileSettings
}
