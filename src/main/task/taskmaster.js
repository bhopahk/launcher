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

const { app, ipcMain } = require('electron');
const path = require('path');
const fork = require('child_process').fork;
const config = require('../config/config');

const baseDir = app.getPath('userData');
const temp = path.join(baseDir, 'temp');
let tasks = {};

let mainWindow = null;
ipcMain.on('sync', event => mainWindow = event.sender);
ipcMain.on('task:cancel', (event, tid) => this.endTask(tid, true));

/**
 * Create a new task with the given name.
 *
 * @since 0.2.3
 *
 * @param {String} name The name of the task.
 * @return {Number} The newly created task id.
 */
exports.createTask = name => {
    const tid = Math.floor(Math.random()*90000) + 10000;
    tasks[tid] = { name, task: 'initializing', progress: 0.0 };
    this.renderTasks();
    return tid;
};

/**
 * Fetch an active task by it's name.
 *
 * @since 0.2.3
 *
 * @param {String} name The name of the task to locate.
 * @return {Number|null} The corresponding task id, or undefined
 */
exports.getTaskByName = name => Object.keys(tasks).filter(key => tasks[key].name === name)[0];

/**
 * Ends a currently running task.
 *
 * If the task is currently running a job, this will wait until the job is complete before deleting the task.
 * If `cancel` is enabled, any running task will be killed.
 *
 * @param {Number} tid The task to end.
 * @param {Boolean} cancel Cancel a job if running.
 * @return {Promise<Object>} Empty object on success, error on failure.
 */
exports.endTask = (tid, cancel) => new Promise((resolve, reject) => {
    console.debug(`Task@${tid} is performing ${cancel ? 'active' : 'passive'} shutdown.`);
    if (tasks[tid] === undefined)
        return reject({ error: 'nonexistent', errorMessage: 'Cannot end a task which does not exist!' });
    const cleanup = () => {
        delete tasks[tid];
        this.renderTasks();
        console.debug(`Task@${tid} has been cleaned up.`);
        resolve({ });
    };
    if (tasks[tid].job !== undefined) {
        if (!cancel)
            tasks[tid].listen.push(cleanup);
        else {
            tasks[tid].job.kill('SIGINT');
            cleanup();
        }
    } else cleanup();
});

/**
 * Wait on completion of a different running job on another task.
 *
 * @param {Number} tid The task to wait on
 * @return {Promise<Object|void>} The result of the task, or null if it did not complete due to an error or cancellation.
 */
exports.waitOn = tid => new Promise(resolve => {
    if (tasks[tid] === undefined || tasks[tid].listen === undefined)
        return resolve();
    tasks[tid].listen.push(resolve);
});

/**
 * Update a task's current task or progress
 *
 * @param {Number} tid The task to update
 * @param {String} task The current task to set as.
 * @param {Number} progress a percentage represented by 0.0-1.0
 */
exports.updateTask = (tid, task, progress) => {
    if (!tasks[tid])
        throw "Cannot update nonexistent task!";
    if (task != null)
        tasks[tid].task = task;
    if (progress != null)
        tasks[tid].progress = progress;

    console.debug(`Task@${tid} has been updated to ${task ? task : '~'} with progress of ${progress ? progress : '~'}.`);
    this.renderTasks()
};

/**
 * Sends the current task state to the render process.
 *
 * @since 0.2.3
 */
exports.renderTasks = () => {
    let sum = 0, values = Object.values(tasks);
    values.forEach(task => sum += task.progress);
    const progress = values.length === 0 ? 0 : sum / values.length;

    require('../main').window.setProgressBar(progress);
    mainWindow.send('task:render', Object.keys(tasks).map(key => { return { tid: key, name: tasks[key].name, task: tasks[key].task, progress: tasks[key].progress } }))
};

/**
 * Executes a job in a new process.
 *
 * Only one job may be executing for a single task at a time.
 * All jobs must be in `{PROJECT_DIR}/src/main/task/jobs` and must be named as `{JOB_NAME}.job.js`.
 * Jobs will receive a single message from the main process where the data is the `props` provided to the run command.
 * Jobs may send any number of {Object} messages back to the main process, to exit, the variable `exit` should be truthy,
 *      to update the task or progress, send an object with a `task` and/or `progress` properties.
 * A cancelled task will return an object where `cancelled = true`.
 * All jobs will have the task id (`TASK_ID`) and project base directory (`BASE_DIR`) available as environment variables.
 *
 * @since 0.2.3
 *
 * @param {Number} tid the task to run the job against.
 * @param {String} job the name of the job file {JOB_NAME}.
 * @param {Object} props extra variables to be passed in the start message. All must be JSON serializable.
 * @return {Promise<Object>} Completion, with either an error, a response, or a cancellation. All resolutions will contain the task id in the returned object.
 */
exports.runJob = async (tid, job, props = {}) => new Promise((resolve, reject) => {
    if (tasks[tid] === undefined)
        return reject({ error: 'nonexistent', errorMessage: 'A job was executed on a task which does not exist!', tid });
    if (tasks[tid].job !== undefined)
        return reject({ error: 'illegal state', errorMessage: 'Only one job may run at any given time!', tid });

    console.debug(`Task@${tid} is starting a new job - ${job}.`);
    const child = fork(path.join(__dirname, 'jobs', `${job}.job.js`), [ ], { cwd: temp, env: {
            TASK_ID: tid,
            BASE_DIR: baseDir,
            DEBUG: config.getValue('app/developerMode'),
            IS_DEV: require('electron-is-dev'),
            DO_PARALLEL: config.getValue('app/parallelDownloads') }});
    tasks[tid].job = child;
    tasks[tid].listen = [];
    child.on('message', message => {
        if (message.exit) {
            message.tid = tid;
            delete message.exit;
            tasks[tid].listen.forEach(func => func(message));
            delete tasks[tid].job;
            delete tasks[tid].listen;
            return resolve(message);
        } else {
            try {
                this.updateTask(tid, message.task, message.progress);
            } catch (e) { }
        }
    });
    child.once('exit', (code, signal) => {
        tasks[tid].listen.forEach(func => func());
        delete tasks[tid].job;
        delete tasks[tid].listen;
        if (signal === 'SIGINT')
            resolve({ cancelled: true, tid });
        else if (code !== 0) reject({ error: 'nonzero exit', errorMessage: `A task has exited with nonzero exit code! (${code})`, signal, tid });
    });
    child.send(props);
});
