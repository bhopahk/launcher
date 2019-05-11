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
            tasks: {
                // 109515215: {
                //     name: 'Sevtech: Ages',
                //     task: 'downloading mods',
                //     progress: .5,
                // },
                // 5152162: {
                //     name: 'All the Mods 3',
                //     task: 'downloading mods',
                //     progress: .5,
                // },
                // 21626126: {
                //     name: 'FTB Beyond',
                //     task: 'Finalizing',
                //     progress: 1,
                // },
            },
        };

        // Tasks ipc api
        window.ipc.on('tasks:create', (event, data) => {
            const tId = Math.floor(Math.random()*90000) + 10000;
            let tasks = JSON.parse(JSON.stringify(this.state.tasks));
            tasks[tId] = {
                name: data.name,
                task: 'initializing',
                progress: 0.0,
            };

            this.setState({ tasks });
            window.ipc.send('tasks:create', tId);
        });

        window.ipc.on('tasks:update', (event, data) => {
            let tasks = JSON.parse(JSON.stringify(this.state.tasks));
            tasks[data.tId].task = data.task;
            tasks[data.tId].progress = data.progress;

            this.setState({ tasks });
        });

        window.ipc.on('tasks:delete', (event, data) => {
            let tasks = JSON.parse(JSON.stringify(this.state.tasks));
            delete tasks[data.tId];

            this.setState({ tasks });
        })
    }

    componentDidMount() {
        this.componentDidUpdate();
    }

    componentDidUpdate() {
        const percentage = 100 * (1 - this.calculateTotalProgress());

        this.iconOverlay.current.style.background = `linear-gradient(#b5b3b3 ${percentage}%, #185cc9 ${percentage}%)`;
        this.iconOverlay.current.style.webkitBackgroundClip = `text`;
    }

    calculateTotalProgress() {
        const tasks = Object.keys(this.state.tasks);
        let sum = 0;
        tasks.forEach(key => sum += this.state.tasks[key].progress);
        if (tasks.length === 0)
            return 0;
        return sum / tasks.length;
    }

    render() {
        return (
            <button id="downloads-button"> {/*arrow-alt-circle-down*/}
                <i ref={this.iconOverlay} className="fas fa-cloud-download-alt"
                   onClick={() => { document.getElementById('downloads-button').classList.toggle('active') }}></i>
                <div className="downloads">
                    <h1>Tasks</h1>
                    <div className="tasks">
                        <a href="https://google.com/">do i open external?</a>
                        {Object.keys(this.state.tasks).map(key => {
                            return (<Task key={key} {...this.state.tasks[key]} />);
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
