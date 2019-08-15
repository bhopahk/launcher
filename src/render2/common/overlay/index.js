import React from 'react';

import './overlay.css';
import './loading_icon.css';

const LoadingOverlay = props => {
    let padding = props.padding;
    if (padding == null)
        padding = 30;
    return (
        <div className={`loading-overlay ${props.inactive && 'inactive'}`} style={{
            left: `-${padding}px`,
            top: `-${padding}px`,
            width: `calc(100% + ${2 * padding}px)`,
            height: `calc(100% + ${2 * padding}px)`
        }}>
            <div className="loading-spinner" />
        </div>
    );
};

export {
    LoadingOverlay
}