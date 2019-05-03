import React from 'react';
import Thumbnail from '../core/Thumbnail';
import MaterialIcon from '../core/Icon';

import './titlebar.css'

import logo from '../static/LauncherNoText.png';

const Titlebar = (props) => {
    return (
        <div id="titlebar">
            <Thumbnail src={logo} size={30} />
            <h1>Launcher</h1>
            <div id="titlebarRight">
                <MaterialIcon name={'remove'} size={25} onClick={() => window.ipc.send('titlebar', { action: 'MINIMIZE' })} />
                <MaterialIcon name={'crop_square'} size={25} onClick={() => window.ipc.send('titlebar', { action: 'MAXIMIZE' })} />
                <MaterialIcon name={'close'} size={25} onClick={() => window.ipc.send('titlebar', { action: 'QUIT' })} />
            </div>
        </div>
    );
};

const TitleBarActions = (props) => {
    return (
        <div id="titlebarActions" style={props.style}>
            <MaterialIcon name={'remove'} size={40} onClick={() => window.ipc.send('titlebar', { action: 'MINIMIZE' })} />
            <MaterialIcon name={'crop_square'} size={40} onClick={() => window.ipc.send('titlebar', { action: 'MAXIMIZE' })} />
            <MaterialIcon name={'close'} size={40} onClick={() => window.ipc.send('titlebar', { action: 'QUIT' })} />
        </div>
    );
};

export {
    Titlebar,
    TitleBarActions
};
