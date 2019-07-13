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

const { app, ipcMain, BrowserWindow } = require('electron');
const Database = require('../app/database');
const mojang = require('../mojang/mojang');
const config = require('../config/config');
const fs = require('fs-extra');
const path = require('path');

const baseDir = app.getPath('userData');

// Accounts data store.
const accounts = new Database(path.join(baseDir, 'accounts.db'));

// Sync accounts
let mainWindow;
ipcMain.on('sync', event => {
    mainWindow = event.sender;
    console.log('Synchronizing Minecraft accounts...');
    const clientToken = config.getValue('clientKey');
    accounts.find({ }).then(accs => accs.forEach(async account => {
        if (await mojang.validateToken(account.token, clientToken))
            return console.debug(`Account@${account.username} has a valid token.`);
        console.debug(`Account@${account.username} has an invalid token, it will be refreshed.`);
        const resp = await mojang.refreshToken(account.token, clientToken, false);
        account.token = resp.accessToken;
        await accounts.update({ _id: account._id }, account);
    }));
});

ipcMain.on('account:inst', () => this.addAccount());
ipcMain.on('account:select', (event, uuid) => this.selectAccount(uuid));
ipcMain.on('account:render', () => this.renderAccounts());
ipcMain.on('account:remove', (event, uuid) => this.removeAccount(uuid));

exports.addAccount = () => {
    const window = new BrowserWindow({
        title: 'Login to Mojang',
        autoHideMenuBar: true,
        width: 250,
        height: 300,
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
        }
    });
    window.loadURL(`file://${__dirname}/login.html`).then(() => ipcMain.on('login:complete', async (event, data) => {
        if (data.clientKey !== config.getValue('clientKey')) {
            config.setValue('clientKey', data.clientKey);
            await config.saveConfig();
        }
        const acc = await this.getAccount(data.uuid);
        if (acc != null) {
            acc.token = data.token;
            acc.username = data.username;
            await accounts.update({ _id: data._id }, acc);
        } else await accounts.insert(data);
        await this.getSelectedAccount();
        await this.renderAccounts();
        window.close();
    }));
};

exports.selectAccount = async uuid => {
    const current = await accounts.findOne({ selected: true });
    if (current != null) {
        current.selected = false;
        await accounts.update({ selected: true }, current);
    }

    const target = await accounts.findOne({ _id: uuid });
    target.selected = true;
    await accounts.update({ _id: uuid }, target);
    await this.getSelectedAccount();
    this.renderAccounts();
};

exports.getSelectedAccount = async () => {
    const current = await accounts.findOne({ selected: true });
    if (current != null)
        return current;
    const first = await accounts.findOne({ });
    if (first != null) {
        first.selected = true;
        await accounts.update({ _id: first._id }, first);
        return first;
    }
};

exports.getAccounts = () => accounts.find({ });

exports.getAccount = (uuid) => accounts.findOne({ uuid });

exports.renderAccounts = async () => mainWindow.send('account:render', await exports.getAccounts());

exports.removeAccount = async uuid => {
    accounts.remove({ _id: uuid });
    await this.getSelectedAccount();
    this.renderAccounts();
};
