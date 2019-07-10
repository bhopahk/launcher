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
const sendTaskUpdate = require('../needsHome/profile').sendTaskUpdate;

const temp = require('path').join(app.getPath('userData'), 'temp');
let tasks = {};

/**
 * Create a new task with the given name.
 *
 * @since 0.2.3
 *
 * @param name The name of the task.
 * @return Number The newly created task id.
 */
exports.createTask = name => {
    const tid = Math.floor(Math.random()*90000) + 10000;
    tasks[tid] = { name, task: 'initializing', progress: 0.0 };
    return tid;
};

exports.runTask = async (tid, task, props) => new Promise((resolve, reject) => {
    if (tasks[tid] === undefined)
        return reject({ error: 'nonexistent', errorMessage: 'A job was executed on a task which does not exist!', tid });
    if (tasks[tid].task !== undefined)
        return reject({ error: 'illegal state', errorMessage: 'Only one job may run at any given time!', tid });

    const child = fork(path.join(__dirname, 'tasks', `${task}.task.js`), [ tid ], { cwd: temp });
    child.once('message', result => {
        result.tid = tid;
        resolve(result);
    });
    child.once('exit', (code, signal) => {
        delete tasks[tid].task;
        if (signal === 'SIGINT')
            resolve({ cancelled: true, tid });
        else if (code !== 0) reject({ error: 'nonzero exit', errorMessage: `A task has exited with nonzero exit code! (${code})`, signal, tid });
    });
});
