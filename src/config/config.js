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
const fs = require('fs-extra');
const path = require('path');

const baseDir = app.getPath('userData');
const configFile = path.join(baseDir, 'launcher_config.json');

let saveTask = null;
let listeners = {};

app.on('ready', async () => {
    await this.loadConfig();

    ipcMain.on('config:get', (event, args) => event.returnValue = this.getValue(args));
    ipcMain.on('config:set', (event, args) => this.setValue(args.path, args.value));
});

app.on('quit', () => {
    clearTimeout(saveTask);
    // noinspection JSIgnoredPromiseFromCall
    this.saveConfig();
});

exports.getValue = (target) => {
    let path = target.split('/');
    let value = this.config;
    try {
        for (let i = 0; i < path.length; i++)
            value = value[path[i]];
        return value;
    } catch (e) {
        return null;
    }
};

exports.setValue = (target, value) => {
    const oldValue = this.getValue(target);

    let cancelled = false;
    if (listeners.hasOwnProperty(target)) {
        const callbacks = listeners[target];
        for (let i = 0; i < callbacks.length; i++) {
            const result = callbacks[i](oldValue, value);
            if (result)
                cancelled = result;
        }
    }
    if (cancelled)
        return;

    console.log(`'${target}' has been changed from '${oldValue}' to '${value}'`);
    let path = target.split('/');
    let current = this.config;
    try {
        for (let i = 0; i < path.length; i++) {
            if (i === path.length - 1)
                current[path[i]] = value;
            else current = current[path[i]];
        }
    } catch (e) { }
    clearTimeout(saveTask);
    saveTask = setTimeout(this.saveConfig, 60000);
};

exports.saveConfig = async () => {
    console.log('Saving config...');
    await fs.writeJson(configFile, this.config, { spaces: 4 });
};

exports.loadConfig = async () => {
    console.log('Loading config...');
    if (!await fs.pathExists(configFile))
        await fs.copy(path.join(__dirname, 'default.json'), configFile);
    this.config = await fs.readJson(configFile);
};

exports.addEventListener = (target, callback) => {
    if (!listeners.hasOwnProperty(target))
        listeners[target] = [];
    listeners.push(callback);
};
