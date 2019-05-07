require('../src/main');

// const { app, BrowserWindow, shell, ipcMain, Tray, Menu } = require('electron');
// const { autoUpdater } = require('electron-updater');
//
// const path = require('path');
// const isDev = require('electron-is-dev');
// const __srcdir = path.join(app.getAppPath(), 'src');
//
// let mainWindow;
// let tray;
//
// const createWindow = () => {
//     mainWindow = new BrowserWindow({
//         width: 1280,
//         height: 720,
//         minWidth: 950,
//         minHeight: 550,
//         frame: false,
//         // backgroundColor: '#111111',
//         transparent: true,
//         // vibrancy: 'dark',
//         icon: __dirname + '/icon.png',
//         webPreferences: {
//             nodeIntegration: false,
//             contextIsolation: false, //todo ideally this would be enabled for extra security.
//             preload: path.join(__dirname, 'preload.js')
//         }
//     });
//     // require('electron-vibrancy').SetVibrancy(mainWindow, 9);
//
//     // SetVibrancy(window, 0);
//
//     // mainWindow.setOpacity(0.5);
//
//     mainWindow.loadURL(
//         isDev
//             ? 'http://localhost:3000'
//             : `file://${path.join(__dirname, '../build/index.html')}`,
//     );
//     // mainWindow.webContents.openDevTools();
//
//     if (isDev) {
//         const {
//             default: installExtension,
//             REACT_DEVELOPER_TOOLS,
//         } = require('electron-devtools-installer');
//         installExtension(REACT_DEVELOPER_TOOLS)
//             .then(name => console.log(`Added Extension: ${name}`))
//             .catch(err => console.log('An error occurred: ', err));
//     }
//
//     mainWindow.once('ready-to-show', () => {
//         mainWindow.show();
//     });
// };
//
// const createTrayMenu = () => {
//     tray = new Tray(path.join(__srcdir, 'static/LauncherNoText.png'));
//     tray.setContextMenu(Menu.buildFromTemplate([
//         { label: 'Item1', type: 'normal' },
//         { label: 'Item1', type: 'normal' },
//         { type: 'separator' },
//         { label: 'Item3', type: 'normal' }
//     ]));
//     tray.setToolTip('I am a tooltip');
//     tray.addListener('click', () => {
//         console.log('tray icon clicked');
//         mainWindow.focus();
//     });
// };
//
// const createContextMenu = () => {
//     app.setUserTasks([
//         {
//             program: process.execPath,
//             arguments: '--new-window',
//             iconPath: __dirname + '/icon.png',
//             iconIndex: 0,
//             title: 'New Window',
//             description: 'Create a new window'
//         },
//         {
//             program: process.execPath,
//             arguments: '--new-window',
//             iconPath: __dirname + '/icon.png',
//             iconIndex: 0,
//             title: 'Test 2',
//             description: 'I am a test option!'
//         }
//     ])
// };
//
// const registerUriListeners = () => {
//     const locked = app.requestSingleInstanceLock();
//     if (!locked)
//         app.quit();
//     app.on('second-instance', (event, argv, cwd) => {
//
//         mainWindow.show();
//     })
// };
//
// app.on('ready', () => {
//     setTimeout(() => {
//         if (process.platform === 'win32')
//             app.setAppUserModelId(isDev ? 'launcher' : 'launcher-dev');
//
//         createWindow();
//
//         // require('../src/module/installer').download('https://launcher.mojang.com/download/Minecraft.exe', 'C:\\dev\\RandomOutput\\Minecraft.exe')
//         //     .then(loc => {
//         //         console.log('FINISHED DOWNLOAD!!');
//         //         console.log(loc);
//         //     });
//         // require('../src/module/installer').unzip('C:\\dev\\RandomOutput\\All+the+Mods+3-v5.12.1.zip')
//         //     .then(loc => {
//         //         console.log('FINISHED UNZIP');
//         //         console.log(loc);
//         //     });
//         // console.log('THIS SHOULD BE BEFORE UNZIP!');
//         // const fetch = require('../src/module/fetch');
//         // fetch();
//         // fetch();
//         require('../src/module/installer').installVersion();
//
//         // createTrayMenu();
//         if (process.platform === 'win32')
//             createContextMenu();
//
//         registerUriListeners();
//
//         if (!isDev) {
//             autoUpdater.autoDownload = true; //todo set allowPrerelease to true if they enable dev builds in settings.
//             autoUpdater.checkForUpdates();
//         }
//     }, 100);
// });
//
// app.on('window-all-closed', () => {
//     app.quit();
// });
//
// app.on('activate', () => {
//     if (mainWindow === null) {
//         createWindow();
//     }
// });
//
// app.on('open-url', (event, data) => {
//     event.preventDefault();
//     shell.openExternal(data);
// });
//
// ipcMain.on('titlebar', (event, arg) => {
//     let window = BrowserWindow.fromWebContents(event.sender);
//     switch (arg.action) {
//         case 'QUIT':
//             if (window === mainWindow)
//                 window.hide();
//             else window.close();
//             break;
//         case 'MAXIMIZE':
//             if (window.isMaximized())
//                 window.unmaximize();
//             else window.maximize();
//             break;
//         case 'MINIMIZE':
//             window.minimize();
//             break;
//     }
// });
//
// ipcMain.on('open-external', (event, arg) => {
//     shell.openExternal(arg);
// });
//
// ipcMain.on('argv', event => {
//     event.sender.send('argv', process.argv);
//     event.sender.send('argv', app.getAppPath());
//     event.sender.send('argv', path.join(require('electron').app.getPath('userData'), 'Install'));
// });
//
// // Auto Update
// autoUpdater.on('checking-for-updates', () => {
//     mainWindow.webContents.send('message', 'checking for updates!');
// });
//
// autoUpdater.on('update-available', info => {
//     mainWindow.webContents.send('message', 'update available!');
//     mainWindow.webContents.send('message', info);
//     autoUpdater.downloadUpdate();
// });
//
// autoUpdater.on('update-not-available', info => {
//     mainWindow.webContents.send('message', 'no update');
//     mainWindow.webContents.send('message', info);
// });
//
// autoUpdater.on('error', err => {
//     mainWindow.webContents.send('message', err);
// });
//
// autoUpdater.on('download-progress', progress => {
//     mainWindow.webContents.send('message', 'download progress: ' + progress);
// });
//
// autoUpdater.on('update-download', info => {
//     mainWindow.webContents.send('message', 'downloaded update');
//     mainWindow.webContents.send('message', info);
//
//     autoUpdater.quitAndInstall();
// });
