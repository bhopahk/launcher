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

const { BrowserWindow, ipcMain } = require('electron');
const config = require('../config/config');
const profiles = require('../needsHome/profile');

let tasks = {};

config.addEventListener('app/developerMode', (old, next) => {
    const keys = Object.keys(tasks);
    keys.forEach(key => {
        if (next)
            tasks[key].window.show();
        else tasks[key].window.hide();
    });
});

ipcMain.on('worker:task', (event, data) =>
    profiles.sendTaskUpdate(data.id, data.task, data.progress));
ipcMain.on('worker:finish', (event, id) => {
    if (!tasks.hasOwnProperty(id))
        return;
    tasks[id].window.close();
    tasks[id].finish();
    delete tasks[id];
    console.log(`Worker ${id} has finished.`)
});

// Props is an object full of non-function fields, work is a function with a single 'props' parameter
exports.createWorker = (task, props, work) => new Promise(resolve => {
    const id = Math.floor(Math.random() * 10000);
    console.log(`Creating worker... (${id})`);
    const window = new BrowserWindow({
        show: config.getValue('app/developerMode'),
        title: 'Proton Worker',
        frame: false,
        width: 600,
        height: 400,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    tasks[id] = { window: window, finish: () => resolve() };
    window.loadURL(`file://${__dirname}/generic-worker.html`).then(() =>
        window.webContents.send('worker:start', {
            id,
            task,
            props: props,
            work: work.toString(),
        })
    );
});
