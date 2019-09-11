import React from 'react';
import Snackbar from "../common/snackbar";
import Tasks from "../sidebar/tasks";

export default class CurseModpacks extends React.Component {

    render() {
        return (
            <div>
                CURSE MODPACKS
                <br/>
                <br/>
                <br/>
                <button onClick={() => Snackbar.enqueue({
                    body: 'I am some text on a snack! ' + Math.random(),
                    timeout: false,
                    dismissable: false,
                    action: 'fix',
                    onAction: () => alert('hi'),
                    onClick: () => alert('also hi')
                })}>SNack</button>
                <button onClick={() => window.ipc.send('test', '')}>test</button>
                <button onClick={() => Tasks.pulse(5)}>pulse</button>
            </div>
        );
    }
}