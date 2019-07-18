import React from 'react';
import './actions.css';
import { MaterialIcon } from '../../layout/Generic';

const Actions = () => {
    return (
        <div className="actions">
            <MaterialIcon icon="remove" onClick={() => window.ipc.send('titlebar', { action: 'MINIMIZE' })} />
            <MaterialIcon icon="crop_square" onClick={() => window.ipc.send('titlebar', { action: 'MAXIMIZE' })} />
            <MaterialIcon icon="close" onClick={() => window.ipc.send('titlebar', { action: 'QUIT' })} />
        </div>
    );
};

export default Actions;
