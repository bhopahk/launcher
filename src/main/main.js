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

const { app, BrowserWindow, shell, clipboard, ipcMain, Tray, Menu, MenuItem } = require('electron');
const log = require('electron-log');

const path = require('path');
const isDev = require('electron-is-dev');

const config = require('./config/config');

let mainWindow;
let tray;
let trayMenu;

// Fix to https://github.com/electron/electron/issues/13186
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

// electron log config
log.transports.console.format = '[{h}:{i}:{s} {level}] {text}';
log.transports.file.format = '[{m}/{d}/{y} {h}:{i}:{s} {level}] {text}';
log.transports.file.maxSize = 10 * 1024 * 1024;
const logPath = path.join(app.getPath('userData'), `/launcher_log${isDev ? '_dev' : ''}.log`);
log.transports.file.file = logPath;
// Use electron log for console.log calls.
console.log = log.info;

if (process.platform === 'win32')
    app.setAppUserModelId(isDev ? process.execPath : 'me.bhop.proton');

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 950,
        minHeight: 550,
        frame: false,
        transparent: process.platform === 'win32' || process.platform === 'darwin',
        icon: app.getAppPath() + '/public/icon.png',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../../build/index.html')}`,
    ).then(async () => {
        if ((await config.getValue('app/vibrancy')).value && (process.platform === 'win32' || process.platform === 'darwin'))
            require('electron-vibrancy').SetVibrancy(mainWindow, 2);
    });

    if (isDev) {
        const {
            default: installExtension,
            REACT_DEVELOPER_TOOLS,
        } = require('electron-devtools-installer');
        installExtension(REACT_DEVELOPER_TOOLS)
            .then(name => console.log(`Added Extension: ${name}`))
            .catch(err => console.log('An error occurred: ', err));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    let moveTimeout = null;
    mainWindow.on('move', () => {
        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
            mainWindow.setSize(mainWindow.getSize()[0] + 1, mainWindow.getSize()[1] + 1);
            mainWindow.setSize(mainWindow.getSize()[0] - 1, mainWindow.getSize()[1] - 1);
        }, 50);
    });

    // Send warning about pasting into devtools.
    mainWindow.webContents.on('devtools-opened', () => mainWindow.send('launcher:devtools'));

    exports.window = mainWindow;
};

app.on('ready',  async () => {
    console.log('------------------------------------------');
    console.log('         Starting Proton Launcher         ');
    console.log('------------------------------------------');

    // Setup console debug
    const debug = (await config.getValue('app/developerMode')).value;
    console.debug = message => { if (debug) log.debug(message); };

    require('./app/protocol');
    require('./util/reporter');
    const updater = require('./app/updater');
    // noinspection JSUndefinedPropertyAssignment
    global.__launcher_version = updater.CURRENT;
    require('./task/taskmaster');
    const profiles = require('./app/profile');
    require('./config/java');
    require('./mojang/accounts');
    require('./game/cache/versions');
    require('./game/cache/curse');
    require('./app/rpc');
    require('./app/theme/themes');

    createWindow();

    tray = new Tray(path.join(app.getAppPath() + '/public/icon.png'));
    tray.setToolTip('Proton Launcher');
    tray.addListener('click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: `Proton Launcher v${__launcher_version}`, type: 'normal', click: () => clipboard.writeText(`Proton v${__launcher_version}`) },
        { label: 'Check for Updates NI', type: 'normal' },
        { label: 'Send Feedback', type: 'normal', click: () => shell.openExternal('https://github.com/bhopahk/launcher/issues/new/choose') },
        { label: 'Show Log', type: 'normal', click: () => shell.showItemInFolder(logPath) },
        { type: 'separator' },
        { label: 'Quick Launch', enabled: false }
    ]));

    profiles.onRender(profiles => {
        const newTray = Menu.buildFromTemplate([
            { label: `Proton Launcher v${__launcher_version}`, type: 'normal', click: () => clipboard.writeText(`Proton v${__launcher_version}`) },
            { label: 'Check for Updates NI', type: 'normal' },
            { label: 'Send Feedback', type: 'normal', click: () => shell.openExternal('https://github.com/bhopahk/launcher/issues/new/choose') },
            { label: 'Show Log', type: 'normal', click: () => shell.showItemInFolder(logPath) },
            { type: 'separator' },
            { label: 'Quick Launch', enabled: false }
        ]);
        profiles.slice(0, 5).forEach(profile => newTray.append(new MenuItem({ label: profile.name, type: 'normal', click: () => require('./game/launcher').launchProfile(profile) })));
        tray.setContextMenu(newTray);
    });

    app.on('second-instance', () => mainWindow.show());
});

// macOS specific closing stuff.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
    else mainWindow = null;
});
app.on('activate', () => {
    if (mainWindow === null)
        createWindow();
});

/**
 * Restart the launcher.
 * This will exit the process and relaunch it.
 *
 * @since 0.2.20
 */
exports.restart = () => {
    app.relaunch({ args: process.argv.slice(1) });
    app.exit(0)
};

exports.hide = () => {
    mainWindow.hide();
};

exports.show = () => {
    mainWindow.show();
    mainWindow.focus();
};

/**
 * Sends a snackbar message to the main process.
 *
 * @since 0.1.5
 *
 * @param {Object} data The snackbar entry to send. It cannot contain a listener at this time.
 * @return {*} Completion
 */
exports.sendSnack = data => mainWindow.send('snack:send', data);

// Title bar listeners
let maximized = false;
ipcMain.on('titlebar:quit', () => mainWindow.close());
ipcMain.on('titlebar:maximize', () => {
    if (maximized)
        mainWindow.unmaximize();
    else mainWindow.maximize();
    maximized = !maximized;
});
ipcMain.on('titlebar:minimize', () => mainWindow.minimize());

// Opener listeners (filesystem and url)
ipcMain.on('open:url', (_, link) => shell.openExternal(link));
ipcMain.on('open:folder', (_, folder) => shell.openItem(folder));
ipcMain.on('open:file', (_, file) => shell.showItemInFolder(file));

// Util listeners
ipcMain.on('launcher:is_dev', event => event.returnValue = isDev);
ipcMain.on('launcher:restart', () => this.relaunch());

ipcMain.on('sync', async event => {
    event.returnValue = {
        vibrancy: await config.getValue('app/vibrancy')
    };
});
