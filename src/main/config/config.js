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

// A simple JSON based config system. Subject to change in the future if needed.

const { app, ipcMain } = require('electron');
const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const Database = require('../util/database');

const baseDir = app.getPath('userData');
const config = new Database(path.join(baseDir, 'config.db'));

// For sending to the window outside of an ipc method
let mainWindow = null;
ipcMain.once('sync', event => mainWindow = event.sender);

let listeners = {};

app.on('ready', async () => {
    ipcMain.on('config:get', async (event, args) => event.returnValue = await this.getValue(args));
    ipcMain.on('config:set', async (event, args) => await this.setValue(args.path, args.value));

    const defaults = await fs.readJson(path.join(__dirname, 'default.json'));
    Object.keys(defaults).forEach(async key => {
        const current = await config.findOne({ _id: key });
        if (current != null)
            return;
        defaults[key]._id = key;
        switch (key) {
            case 'app/instanceDir':
                defaults[key].value = path.join(baseDir, 'Instances');
                break;
            case 'clientKey':
                defaults[key].value = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                break;
            default:
                break;
        }
        await config.insert(defaults[key]);
    });
});

exports.getValue = async (target) => {
    const entry = await config.findOne({ _id: target });
    if (!entry)
        return null;
    return entry;
};

exports.setValue = async (target, value) => {
    const entry = await config.findOne({ _id: target });
    if (entry.restart === true)
        mainWindow.send('launcher:restart');
    entry.value = value;
    await config.update({ _id: target }, entry);
};
exports.addEventListener = (target, callback) => {
    if (!listeners.hasOwnProperty(target))
        listeners[target] = [];
    listeners[target].push(callback);
};
