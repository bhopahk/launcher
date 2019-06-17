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
const updater = require('./updater');
const fetch = require('node-fetch');
const fs = require('fs-extra');
const path = require('path');
const pathIsInside = require('path-is-inside');

const baseDir = app.getPath('userData');
const reportDir = path.join(baseDir, 'Error Reports');
const mem = Math.floor(require('os').totalmem()/1e6);
let os = { arch: process.arch };
let mainWindow;

exports.MESSAGES = [
    'Uh oh, I did a bad thing!',
    'Oops! Did I buy champagne instead of milk again...',
    'I swear, this didn\'t happen while testing!',
    'Lets just hope nothing went horribly wrong...',
    '\'Oops,\' Jason said meekly. \'Oops?\' Connor shouted. \'You blew up half the town.\'',
    'Listen, this could be something minor. Right?',
    'Well, something did happen, it just was not the intended something.'
];

if (process.platform === 'win32') {
    os.name = 'Windows';
    os.version = require('os').release();
} else if (process.platform === 'win32') {
    os.name = 'macOS';
    os.version = require('os').release();
} else {
    require('getos')((err, sys) => {
        if (err) {
            console.log(err);
            os.name = 'Linux (Generic)';
            os.version = require('os').release();
        } else {
            os.name = sys.dist;
            os.version = `${sys.release} (${sys.codename})`;
        }
    });
}

fs.mkdirs(reportDir);

ipcMain.on('reporter:submit', (_, data) => this.error(data));

ipcMain.on('reporter:register', event => mainWindow = event.sender);

ipcMain.on('reporter:haste', async (event, path) => {
    // Ensure that the path is actually inside the report directory to avoid somebody having a private file uploaded to hastebin...
    if (!pathIsInside(path, reportDir))
        return event.sender.send('reporter:haste', { error: 'privacy protection', errorMessage: 'The path to the report is invalid. Please fetch it manually.' });
    let contents;
    try {
        contents = await fs.readFile(path, 'utf8');
    } catch (er) {
        console.log(er);
        console.log('The above has occurred while creating a crash report.');
        return event.sender.send('reporter:haste', { error: er.name, errorMessage: er.message });
    }
    const url = await this.haste(contents);
    if (url === undefined) {
        console.log('Failed to upload report! (503)');
        event.sender.send('reporter:haste', { error: 'response code 503', errorMessage: 'It would appear hastebin is currently unavailable.' })
    } else {
        console.log(`Uploaded error report @ ${url} (${path}).`);
        event.sender.send('reporter:haste', { url });
    }
});

ipcMain.on('reporter:test', async () => {
    const t = undefined;

    try {
        t.test();
    } catch (e) {
        this.error(e);
    }

});

exports.error = async (err, extras) => {
    // console.log(err.stack);
    const usedMem = mem - Math.floor(require('os').freemem()/1e6);
    const reportText = `Proton Launcher v${updater.CURRENT}\n` +
        `${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}\n` +
        `\n` +
        `${os.name} ${os.version} ${os.arch}\n` +
        `${usedMem}/${mem}mb\n` +
        `\n` +
        `// ${this.MESSAGES[Math.floor(Math.random()*this.MESSAGES.length)]}\n` +
        `\n` +
        `${err.stack}\n`;
    const fileName = `${new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(':', '-').replace(':', '-')}.txt`;
    const filePath = path.join(reportDir, fileName);
    // await fs.ensureFile(filePath);
    await fs.outputFile(filePath, reportText);
    mainWindow.send('reporter:report', filePath);
};

exports.haste = async (text, alt = false) => {
    const BASE_URL = alt ? 'https://sourceb.in/':'https://hastebin.com/';
    const resp = await fetch(`${BASE_URL}${alt ? 'api/bin' : 'documents'}`, {
        method: 'post',
        body: text,
        headers: { 'Content-Type': 'text/plain' }
    });
    if (resp.status === 503 && !alt)
        return this.haste(text, true);
    if (resp.status === 503)
        return;
    return `${BASE_URL}${(await resp.json()).key}.txt`;
};
