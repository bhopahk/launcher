import React from 'react';
import App from '../App';
import './snackbar.css';

import Queue from '../util/Queue';

export default class Snackbar extends React.PureComponent {
    constructor(props) {
        super(props);

        this.snackbar = React.createRef();
        this.queue = new Queue();
        this.snack = {};
        this.state = {
            running: false,
        };
    }

    static sendSnack(snack) {
        App.snackbar.current.queueSnack(snack);
    }

    queueSnack(snack) {
        this.queue.add(snack);

        this.handleSnacks();
    }

    handleSnacks() {
        if (this.state.running || this.queue.length() === 0)
            return;
        this.snack = this.queue.pull();
        this.setState({ running: true }, () => {
            this.snackbar.current.style.animation = 'fadein 0.5s';
            this.snackbar.current.animationPlayState = 'running';

            if (!this.snack.requireAction)
                this.snack.timeout = setTimeout(this.closeCurrentSnack.bind(this), 2500);
        })
    }

    closeCurrentSnack() {
        delete this.snack.action;
        this.snack.dismissOnClick = false;
        clearTimeout(this.snack.timeout);

        this.snackbar.current.style.animation = 'fadeout 0.5s';
        this.snackbar.current.animationPlayState = 'running';
        setTimeout(() => {
            this.setState({ running: false });
            setTimeout(() => {
                this.handleSnacks();
            }, 100);
        }, 500);
    }

    handleDismiss(force) {
        if (this.snack.hasOwnProperty('dismissOnClick') && !this.snack.dismissOnClick && !force)
            return;
        this.closeCurrentSnack();
    }

    handleSnacktion() {
        if (!this.snack.action || this.snack.hasHadAction)
            return;
        this.snack.onAction();
        this.snack.hasHadAction = true;
    }

    render() {
        const isActive = this.state.running;
        return (
            <div ref={this.snackbar} className={`snackbar ${isActive ? 'show' : ''}`} onClick={() => this.handleDismiss()}>
                <p>{this.snack.body}</p>
                <button onClick={() => this.handleSnacktion()} style={{
                    display: `${this.snack.action ? 'block' : 'none'}`
                }}>{this.snack.action ? this.snack.action.toUpperCase() : ''}</button>
            </div>
        );
    }
}

