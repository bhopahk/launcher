import React from 'react';

import './tasks.css';

export default class Tasks extends React.Component {
    constructor(props) {
        super(props);

        this.iconOverlay = React.createRef();

        this.state = {
            tasks: [
                // {
                //     name: 'Skyfactory 4',
                //     progress: 0.2,
                //     task: 'downloading mods'
                // },
                // {
                //     name: 'Skyfactory 3 Skyfactory 3 Skyfactory 3',
                //     progress: 0.6213123123123,
                //     task: 'downloading mods'
                // }
            ],
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

    renderTasks = (event, tasks) => this.setState({tasks});
    cancelTask = tid => window.ipc.send('task:cancel', tid);

    calculateTotalProgress = () => {
        let sum = 0;
        this.state.tasks.forEach(task => sum += task.progress);
        if (this.state.tasks.length === 0)
            return 0;
        return sum / this.state.tasks.length;
    };

    hide = () => document.getElementById('downloads-button').classList.toggle('active');

    render() {
        return (
            <button id="downloads-button">
                <i ref={this.iconOverlay} className="fas fa-cloud-download-alt"
                   onClick={() => this.hide()}/>
                <div className="downloads">
                    <div className="task-header">
                        <h1>Tasks</h1>
                        <div className="task-progress">
                            <div className="task-progress-complete" style={{
                                width: `calc(${this.calculateTotalProgress() * 100}% - 4px)`
                            }}/>
                            <h2>{Math.round(this.calculateTotalProgress() * 1000) / 10}%</h2>
                            {/*<h2>{props.task}</h2>*/}
                        </div>
                    </div>
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

const Task = props => (
    <div className="task">
        <div className="task-info">
            <h1 title={props.name}>{props.name}</h1>
            {/*<button className="task-cancel"><i className="material-icons icon" onClick={() => window.ipc.send('titlebar:minimize')}>remove</i></button>*/}
        </div>
        <div className="task-progress">
            <div className="task-progress-complete" style={{
                width: `calc(${props.progress * 100}% - 4px)`
            }}/>
            <h2>{props.task}</h2>
        </div>
    </div>
);