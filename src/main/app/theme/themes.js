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
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config/config');

const baseDir = app.getPath('userData');
const themeDir = path.join(baseDir, 'themes');
let mainWindow;

ipcMain.on('sync', async event => {
    if (!mainWindow)
        mainWindow = event.sender;
    await fs.mkdirs(themeDir);
    const deft = path.join(themeDir, 'default.css');
    if (!await fs.pathExists(deft))
        await fs.copy(path.join(__dirname, 'default.css'), deft);
    mainWindow.send('theme:change', await this.getTheme())
});
ipcMain.on('theme:reload', async () => {
    console.debug('Reloading Theme');
    mainWindow.send('theme:change', await this.getTheme())
});

exports.getTheme = async () => {
    const name = (await config.getValue('personalization/theme')).value;
    console.log(`Loading Theme@${name}...`);
    const theme = path.join(themeDir, name + '.css');
    if (await fs.pathExists(theme))
        return fs.readFile(theme);
    return fs.readFile(path.join(themeDir, 'default.css'));
};
