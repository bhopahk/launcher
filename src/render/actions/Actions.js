import React from 'react';
import './actions.css';

const Actions = (props) => {
    return (
        <div className="actions">
            {/*<div>*/}
            {/*    <i className="fas fa-minus"></i>*/}
            {/*    <i id="thick" className="far fa-square"></i>*/}
            {/*    <i className="fas fa-times"></i>*/}
            {/*</div>*/}
            <div>
                <i className="material-icons" onClick={() => window.ipc.send('titlebar', { action: 'MINIMIZE' })}>remove</i>
                <i className="material-icons" onClick={() => window.ipc.send('titlebar', { action: 'MAXIMIZE' })}>crop_square</i>
                <i className="material-icons" onClick={() => window.ipc.send('titlebar', { action: 'QUIT' })}>close</i>
            </div>
        </div>
    );
};

export default Actions;
