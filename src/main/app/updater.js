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
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');

app.on('ready', async () => { //todo allow for configurable update timer

});

this.available = false;
autoUpdater.autoDownload = false;

if (!isDev) {
    this.checkForUpdatesTask = setTimeout(async () => {
        await autoUpdater.checkForUpdates();
    }, 3600000);
    autoUpdater.checkForUpdates();
}

ipcMain.on('updater:check', async event => {
    if (this.mainWindow == null)
        this.mainWindow = event.sender;
    if (isDev) {
        this.mainWindow.send('updater:checking', {});

        await setTimeout(() => {
            this.available = true;
            this.mainWindow.send('updater:checked', {
                version: autoUpdater.currentVersion.version,
                nextVersion: '0.0.0',
                available: this.available,
            });
        }, 3000);
        return;
    }
    clearTimeout(this.checkForUpdatesTask);
    await autoUpdater.checkForUpdates();
    this.checkForUpdatesTask = setTimeout(async () => {
        await autoUpdater.checkForUpdates();
    }, 3600000);
});
ipcMain.on('updater:status', event => {
    if (this.mainWindow == null)
        this.mainWindow = event.sender;
    event.returnValue = {
        version: autoUpdater.currentVersion.version,
        available: this.available,
    };
});
ipcMain.on('updater:update', () => {
    if (isDev) {
        this.available = false;
        this.mainWindow.send('updater:checked', {
            version: autoUpdater.currentVersion.version,
            available: this.available,
        });
    }
    if (this.available && !isDev)
        autoUpdater.quitAndInstall();
});

autoUpdater.on('checking-for-updates', () => {
    console.log('[Updater] Checking for updates!');
    if (this.mainWindow != null)
        this.mainWindow.send('updater:checking', {});
});

autoUpdater.on('update-available', async info => {
    console.log(`[Updater] A new update is available! (v${info.version})`);
    if (!isDev)
        await autoUpdater.downloadUpdate();

    console.log(`[Updater] Downloaded version ${info.version}.`);
    this.available = true;
    if (this.mainWindow != null)
        this.mainWindow.send('updater:checked', {
            version: autoUpdater.currentVersion.version,
            nextVersion: info.version,
            available: this.available,
        });
});

autoUpdater.on('update-not-available', () => {
    console.log(`[Updater] Currently on the latest version.`);
});

autoUpdater.on('error', err => {
    console.log(`[Updater] An error has occurred. It can be viewed below:`);
    console.log(err);
});

autoUpdater.on('download-progress', progress => {
    // mainWindow.webContents.send('message', 'download progress: ');
    // mainWindow.webContents.send('message', progress);
});

exports.CURRENT = autoUpdater.currentVersion.version;
