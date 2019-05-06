import React from 'react';
import './profiles.css';

class Profiles extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            profiles: [
                // {
                //     id: 12345,
                //     name: 'All the Mods 3',
                //     icon: 'https://media.forgecdn.net/avatars/thumbnails/196/458/256/256/636885406042747877.png',
                //     version: 'v1.2.3',
                //     played: 1557109303000,
                //     onLaunch: () => {this.handleLaunch(12345)}
                // },
                // {
                //     id: 54321,
                //     name: 'All the Mods 4',
                //     icon: 'https://media.forgecdn.net/avatars/thumbnails/196/458/256/256/636885406042747877.png',
                //     version: 'v1.2.3',
                //     played: 1557109303000,
                //     onLaunch: () => {this.handleLaunch(54321)}
                // }
            ]
        };
    }

    handleLaunch(profile) {
        alert('launching ' + profile);
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
                    return (<Profile key={profile.id} {...profile} />)
                })}
            </div>
        );
    }
}

const Profile = (props) => {
    return (
        <div className="profile">
            <img src={props.icon} alt={props.name}/>
            <div className="profile-content" style={{backgroundImage: `url("${props.icon}")`}}>
                <div className="profile-blur"></div>
                <div className="profile-details">
                    <h1>{props.name}</h1>
                    <p>{props.version}<span>•</span>{new Date(props.played).toLocaleDateString()}</p>
                </div>
                <div className="profile-play" onClick={() => props.onLaunch()}>
                    <i className="fas fa-play"></i>
                </div>
            </div>
        </div>
    );
};

export {
    Profiles,
    Profile
}
