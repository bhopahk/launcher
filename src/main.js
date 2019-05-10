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

const { app, BrowserWindow, shell, ipcMain, Tray, Menu, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');

const path = require('path');
const isDev = require('electron-is-dev');

require('./module/profile');

let mainWindow;
let tray;

if (process.platform === 'win32')
    app.setAppUserModelId(isDev ? process.execPath : 'me.bhop.proton');

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 950,
        minHeight: 550,
        frame: false,
        transparent: true,
        icon: app.getAppPath() + '/public/icon.png',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: false, //todo ideally this would be enabled for extra security.
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../build/index.html')}`,
    );

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
};

const createTrayMenu = () => {
    tray = new Tray(path.join(app.getAppPath() + '/public/icon.png'));
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Item1', type: 'normal' },
        { label: 'Item1', type: 'normal' },
        { type: 'separator' },
        { label: 'Item3', type: 'normal' }
    ]));
    tray.setToolTip('Launcher');
    tray.addListener('click', () => mainWindow.focus());
};
const createContextMenu = () => {
    app.setUserTasks([
        {
            program: process.execPath,
            arguments: '--new-window',
            iconPath: __dirname + '/icon.png',
            iconIndex: 0,
            title: 'New Window',
            description: 'Create a new window'
        },
        {
            program: process.execPath,
            arguments: '--new-window',
            iconPath: __dirname + '/icon.png',
            iconIndex: 0,
            title: 'Test 2',
            description: 'I am a test option!'
        }
    ])
};
const registerUriListeners = () => {
    const locked = app.requestSingleInstanceLock();
    if (!locked)
        app.quit();
    app.on('second-instance', (event, argv, cwd) => {

        mainWindow.show();
    })
};

app.on('ready', () => {
    setTimeout(() => {
        require('./module/installer').installBaseGame(process.platform).then(() => {
            console.log(`Installed native launcher for ${process.platform}`);
        });

        createWindow();

        createTrayMenu();
        if (process.platform === 'win32')
            createContextMenu();
        registerUriListeners();


        if (!isDev) {
            autoUpdater.autoDownload = true; //todo set allowPrerelease to true if they enable dev builds in settings.
            autoUpdater.checkForUpdates()
                .then(a => console.log('CHECKED FOR UPDATES // ' + a));
        }
    }, 100);
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('open-url', async (event, data) => {
    event.preventDefault();
    await shell.openExternal(data);
});

ipcMain.on('titlebar', (event, arg) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    switch (arg.action) {
        case 'QUIT':
            if (window === mainWindow)
                window.hide();
            else window.close();
            break;
        case 'MAXIMIZE':
            if (window.isMaximized())
                window.unmaximize();
            else window.maximize();
            break;
        case 'MINIMIZE':
            window.minimize();
            break;
    }
});

ipcMain.on('open-external', (event, arg) => {
    let nt = new Notification({
        title: 'Hello, World',
        body: "Hello, Body",
    });
    nt.show();

    shell.openExternal(arg);
});

ipcMain.on('argv', event => {
    event.sender.send('argv', process.argv);
    event.sender.send('argv', app.getAppPath());
    event.sender.send('argv', path.join(require('electron').app.getPath('userData'), 'Install'));
});

// Auto Update
autoUpdater.on('checking-for-updates', () => {
    mainWindow.webContents.send('message', 'checking for updates!');
});

autoUpdater.on('update-available', info => {
    mainWindow.webContents.send('message', 'update available!');
    mainWindow.webContents.send('message', info);
    autoUpdater.downloadUpdate();
});

autoUpdater.on('update-not-available', info => {
    mainWindow.webContents.send('message', 'no update');
    mainWindow.webContents.send('message', info);
});

autoUpdater.on('error', err => {
    mainWindow.webContents.send('message', err);
});

autoUpdater.on('download-progress', progress => {
    mainWindow.webContents.send('message', 'download progress: ' + progress);
});

autoUpdater.on('update-download', info => {
    mainWindow.webContents.send('message', 'downloaded update');
    mainWindow.webContents.send('message', info);

    autoUpdater.quitAndInstall();
});
