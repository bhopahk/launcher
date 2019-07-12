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

const DiscordRPC = require('discord-rpc');
const isDev = require('electron-is-dev');

const launcherVersion = require('electron-updater').autoUpdater.currentVersion.version;
const clientId = '576737903904817152';

DiscordRPC.register(clientId);
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

rpc.on('ready', () => {
    this.state = {
        title: isDev ? `Development v${launcherVersion}` : 'Idle'
    };

    rpc.on()

    // setActivity();
    // setInterval(setActivity, 15e3);
});

const setActivity = () => {


    return rpc.setActivity({
        details: this.state.title,
        state: this.state.subtitle,
        startTimestamp: this.state.startTime,
        largeImageKey: 'icon-no-text-padding',
        largeImageText: `Proton v${launcherVersion}`,
        // smallImageKey: 'icon-no-text-padding',
        // smallImageText: `Proton v${launcherVersion}`,
        instance: false,
    });
};

// noinspection JSCheckFunctionSignatures
rpc.login({ clientId }).catch(console.error);

exports.setToIdle = () => {
    this.state = { title: 'Idle' };
};
exports.setToPlaying = (data) => {
    this.state = {
        title: `Playing ${data.name} ${data.type === 'custom' ? `(${data.gameVersion})` : ''}`,
        subtitle: data.status,
        startTime: new Date(),
    }
};
