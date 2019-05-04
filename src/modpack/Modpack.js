import React from 'react';
import Snackbar from '../snackbar/Snackbar';
import './modpack.css';

export default class ModpackBrowser extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            error: true,
        };
    }

    // noinspection JSMethodCanBeStatic
    onRefresh() {
        this.forceUpdate();
        Snackbar.sendSnack({
            body: 'Take me to lunch?',
            action: 'undo',
            onAction: () => {alert('undone!')},
            // dismissOnClick: false,
            // requireAction: true,
        });
    }

    render() {
        if (this.state.error) {
            return (
                <div className="modpack-browser">
                    <div className="bug">
                        <h1><i className="fas fa-bug"></i></h1>
                        <p>An error has occurred, please <span onClick={() => this.onRefresh()}>refresh</span> the page.</p>
                    </div>
                </div>
            );
        }
        return (
            <div className="modpack-browser">
                <p>{this.state.test}</p>
            </div>
        );
    }
}

const Modpack = (props) => {
    return (
        <div className="modpack">
        </div>
    );
};

export {
    Modpack
}
