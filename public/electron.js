const { app, BrowserWindow, shell, ipcMain, Tray, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');

const path = require('path');
const isDev = require('electron-is-dev');
const __srcdir = path.join(__dirname, '../', 'src');

let mainWindow;
let tray;

process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
});

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 880,
        minHeight: 550,
        frame: false,
        backgroundColor: '#111111',
        icon: __srcdir + '/static/LauncherNoText.png',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: false, //todo ideally this would be enabled for extra security.
            preload: path.join( __dirname, 'preload.js')
        }
    });

    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../build/index.html')}`,
    );
    mainWindow.webContents.openDevTools();

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
    tray = new Tray(path.join(__srcdir, 'static/LauncherNoText.png'));
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Item1', type: 'normal' },
        { label: 'Item1', type: 'normal' },
        { type: 'separator' },
        { label: 'Item3', type: 'normal' }
    ]));
    tray.setToolTip('I am a tooltip');
    tray.addListener('click', () => {
        console.log('tray icon clicked');
        mainWindow.focus();
    });
};

const createContextMenu = () => {
    app.setUserTasks([
        {
            program: process.execPath,
            arguments: '--new-window',
            iconPath: path.join(__srcdir, 'static/LauncherNoText.png'),
            iconIndex: 0,
            title: 'New Window',
            description: 'Create a new window'
        },
        {
            program: process.execPath,
            arguments: '--new-window',
            iconPath: path.join(__srcdir, 'static/LauncherNoText.png'),
            iconIndex: 0,
            title: 'Test 2',
            description: 'I am a test option!'
        }
    ])
};

app.on('ready', () => {
    if (process.platform === 'win32')
        app.setAppUserModelId('launcher');

    createWindow();
    // createTrayMenu();
    // if (process.platform === 'win32')
        // createContextMenu();

    if (!isDev) {
        autoUpdater.autoDownload = true; //todo set allowPrerelease to true if they enable dev builds in settings.
        autoUpdater.checkForUpdates();
    }

});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('titlebar', (event, arg) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    switch (arg.action) {
        case 'QUIT':
            window.close();
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
    shell.openExternal(arg);
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
