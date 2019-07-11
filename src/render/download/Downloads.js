/*
Copyright (c) 2019 Matt Worzala <bhop.me>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import React from 'react';
import './downloads.css';

class Downloads extends React.Component {
    constructor(props) {
        super(props);

        this.iconOverlay = React.createRef();

        this.state = {
            tasks: [],
        };
    }

    componentDidMount() {
        this.componentDidUpdate();
        window.ipc.on('task:render', this.renderTasks)
    }
    componentWillUnmount() {
        window.ipc.removeListener('task:render', this.renderTasks);
    }

    componentDidUpdate() {
        const percentage = 100 * (1 - this.calculateTotalProgress());

        this.iconOverlay.current.style.background = `linear-gradient(#b5b3b3 ${percentage}%, #185cc9 ${percentage}%)`;
        this.iconOverlay.current.style.webkitBackgroundClip = `text`;
    }

    renderTasks = (event, tasks) => this.setState({ tasks });
    cancelTask = tid => window.ipc.send('task:cancel', tid);

    calculateTotalProgress() {
        let sum = 0;
        this.state.tasks.forEach(task => sum += task.progress);
        if (this.state.tasks.length === 0)
            return 0;
        return sum / this.state.tasks.length;
    }

    render() {
        return (
            <button id="downloads-button">
                <i ref={this.iconOverlay} className="fas fa-cloud-download-alt"
                   onClick={() => { document.getElementById('downloads-button').classList.toggle('active') }}></i>
                <div className="downloads">
                    <h1>Tasks</h1>
                    <div className="tasks">
                        {this.state.tasks.map(task => {
                            return (<Task key={task.tid} {...task} />);
                        })}
                    </div>
                </div>
            </button>
        );
    }
}

const Task = (props) => {
    return (
        <div className="task">
            {/*<div className="task-cancel">*/}
            {/*    <i className="fas fa-times"></i>*/}
            {/*</div>*/}
            <h1>{props.name}</h1>
            <div className="task-progress">
                <div className="task-progress-complete" style={{
                    width: `calc(${props.progress * 100}% - 4px)`
                }}></div>
                <h2>{props.task}</h2>
            </div>
        </div>
    );
};

export {
    Downloads,
}
