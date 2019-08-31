import React from 'react';
import Wrapper from "../../../index";
import {Queue} from '../helper';

import './snackbar.css';

/*
Snack {
    body: 'The text to display with the snack.',
    action: 'The text to display on the button (should be very short)',
    onAction: () -> 'The click listener. Or a string channel to send the response to if this is from ipc'
    onClick: () -> 'A function to be called when it is clicked (anywhere)'
    dismissable: true (Whether it can be dismissed or not),
    timeout: true (Whether it will be removed automatically or not)
}
 */

export default class Snackbar extends React.Component {
    constructor(props) {
        super(props);

        this.snackbar = React.createRef();
        this.queue = new Queue();
        this.snack = {};
        this.state = { running: false }
    }

    componentDidMount() {
        window.ipc.addListener('snackbar:create', this.acceptSnack);
    }
    componentWillUnmount() {
        window.ipc.removeListener('snackbar:create', this.acceptSnack);
    }

    acceptSnack = (_, snack) => {
        if (snack.onAction)
            snack.onAction = () => window.ipc.send(`snackbar:callback:${snack.onAction}`);
        if (snack.onClick)
            snack.onClick = () => window.ipc.send(`snackbar:callback:${snack.onClick}`);
        Snackbar.enqueue(snack);
    };

    static enqueue = snack => {
        Wrapper.snackbar.current.queue.add(snack);
        Wrapper.snackbar.current.run();
    };

    run = () => {
        if (this.state.running || this.queue.length() === 0)
            return;
        this.snack = this.queue.pull();
        this.setState({ running: true }, () => {
            this.snackbar.current.style.animation = 'fadein 0.5s';
            this.snackbar.current.animationPlayState = 'running';
            if (this.snack.timeout !== false)
                this.snack.timeout = setTimeout(this.dismiss, 2500);
        })
    };

    dismiss = () => {
        clearTimeout(this.snack.timeout);
        this.snackbar.current.style.animation = 'fadeout 0.5s';
        this.snackbar.current.animationPlayState = 'running';

        setTimeout(() => {
            this.setState({ running: false });
            setTimeout(() => {
                this.run(); //todo can this just be in the callback of setState?
            }, 100);
        }, 500);
    };

    /**
     * Called when the snackbar is clicked anywhere.
     *   - Call the onClick event of the snack, if it exists.
     *   - Dismiss the snack if it is set to dismissable.
     */
    onClick = () => {
        this.snack.onClick && this.snack.onClick();
        this.snack.dismissable !== false && this.dismiss();
    };

    /**
     * Called when the action button on the snack is clicked.
     *   - Run the action
     *   - Remove the action (to mark it as already executed)
     */
    onAction = () => {
        if (!this.snack.action)
            return;
        this.snack.onAction();
        delete this.snack.action;
        delete this.snack.onAction;
    };

    render() {
        return (
            <div ref={this.snackbar}
                 className={`snackbar ${this.state.action && 'snackbar-action'} ${this.state.running && 'show'}`}
                 onClick={() => this.onClick()}>
                <p>{this.snack.body}</p>
                {this.snack.action &&
                (<button onClick={() => this.onAction()}>{this.snack.action.toUpperCase()}</button>)}
            </div>
        );
    }
}