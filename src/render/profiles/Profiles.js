import React from 'react';
import { ContextMenu, ContextMenuTrigger, MenuItem } from 'react-contextmenu';
import { ModalConductor } from '../modal/Modal';
import './profiles.css';

class Profiles extends React.Component {
    constructor(props) {
        super(props);

        window.ipc.send('profile:list');

        this.state = { profiles: [ ] };
    }

    componentWillMount() {
        window.ipc.on('profile:render', this.handleRender);
    }
    componentWillUnmount() {
        window.ipc.removeListener('profile:render', this.handleRender);
    }

    handleRender = (event, payload) => {
        this.setState({
            profiles: payload,
        });
    };

    handleLaunch(profile) {
        window.ipc.send('profile:launch', profile);
    }

    render() {
        if (this.state.profiles.length === 0) {
            return (
                <div className="profiles-empty">
                    <h1><i className="fas fa-exclamation"></i></h1>
                    <p>You do not appear to have any profiles installed!</p>
                    <p>Consider&nbsp;
                        <span onClick={() => document.getElementById('curse').click()}>installing one from curse</span>
                        , or&nbsp;
                        <span onClick={() => document.getElementById('custom').click()}>creating your own</span>.
                    </p>
                </div>
            );
        }
        return (
            <div className="profiles">
                {this.state.profiles.map(profile => {
                    return (<Profile key={profile.name} openOptions={() => {
                        this.props.onProfileOptions(profile);
                        ModalConductor.openModal('profileOptionsModal');
                    }} {...profile} onLaunch={(name) => this.handleLaunch(name)} />)
                })}
            </div>
        );
    }
}

const Profile = (props) => { //todo need to create an icon container for icon centering. Some sort of <Icon /> componenty
    const flavorIcon = props.flavor === 'fabric' ? 'scroll' : props.flavor === 'forge' ? 'gavel' : 'cube';
    return (
        <div>
            <ContextMenuTrigger id={props.name}>
                <div className="profile">
                    <div className="profile-flavor">
                        <i className={`fas fa-${flavorIcon}`}></i>
                    </div>
                    <img src={props.icon} alt={props.name}/>
                    <div className="profile-content" style={{backgroundImage: `url("${props.icon}")`}}>
                        <div className="profile-blur"></div>
                        <div className="profile-details">
                            <h1>{props.name}</h1>
                            <p>{props.minecraftVersion}<span>•</span>{new Date(props.played).toLocaleDateString()}</p>
                        </div>
                        <div className="profile-play" onClick={() => props.onLaunch(props.name)}>
                            <i className="fas fa-play"></i>
                        </div>
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenu id={props.name}>
                <MenuItem onClick={() => props.onLaunch(props.name)}><i className="fas fa-play"></i>Launch</MenuItem>
                <MenuItem onClick={() => alert("// not implemented //")} disabled><i className={`fa${props.favorite ? 'r' : 's' } fa-star`}></i>Favorite</MenuItem>
                <MenuItem onClick={() => props.openOptions()}><i className="fas fa-cog"></i>Settings</MenuItem>
                <MenuItem onClick={() => window.ipc.send('open-folder', props.directory)}><i className="fas fa-folder"></i>Open Folder</MenuItem>
                <MenuItem onClick={() => alert("// not implemented //")} disabled><i className="fas fa-link"></i>Create Shortcut</MenuItem>
                <MenuItem onClick={() => alert("// not implemented //")} disabled><i className="fas fa-file-export"></i>Export</MenuItem>
                <MenuItem divider />
                <MenuItem onClick={() => window.ipc.send('profile:delete', props.name)}><i className="fas fa-trash-alt"></i>Delete</MenuItem>
            </ContextMenu>
        </div>
    );
};

export {
    Profiles,
    Profile
}
