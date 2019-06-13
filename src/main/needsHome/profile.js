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

//todo create a default image. This is ok for non-commercial use, but needs attribution.
// http://iconbug.com/detail/icon/8235/minecraft-dirt/
// Creative Commons Attribution Noncommercial 3.0 Unported License.
const defaultFavicon = 'http://iconbug.com/data/10/512/a024a1ed8a16e9ff5667bd97127d7a8a.png';

const { app, ipcMain, Notification } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const installer = require('./installer');
const files = require('../util/files');
const config = require('../config/config');
const fetch = require('node-fetch');
const sendSync = require('../util/ipcMainSync').sendSync;

const baseDir = app.getPath('userData');
const installDir = path.join(baseDir, 'Install');
const instanceDir = config.getValue('minecraft/instanceDir');
const launcherProfiles = path.join(baseDir, 'profiles.json');
let mainWindow = null;

fs.pathExists(launcherProfiles).then(async exists => {
    if (exists)
        return;
    await fs.ensureFile(launcherProfiles);
    await fs.writeJson(launcherProfiles, {}, { spaces: 4 });
});

// IPC Listeners
// Render Profiles todo need to look around renderer for any places where ipc listeners are registered but not unregistered (is a memory leak)
ipcMain.on('profiles', async event => {
    if (mainWindow == null)
        mainWindow = event.sender;
    await this.renderProfiles();
});

// Create custom profile
ipcMain.on('profile:create:custom', async (event, payload) => {
    if (mainWindow == null)
        mainWindow = event.sender;
    const tId = await sendSync(mainWindow, 'tasks:create', { name: payload.name });
    // Send response to disable the loading animation.
    mainWindow.send('profile:create:response');

    let versionId;
    try {
        switch (payload.version.flavor) {
            case 'vanilla':
                versionId = await installer.installVanilla(payload.version.version, tId);
                break;
            case 'forge':
                versionId = await installer.installForge(payload.version.forge, tId);
                break;
            case 'fabric':
                versionId = await installer.installFabric(payload.version.mappings, payload.version.loader, tId);
                break;
            default:
                mainWindow.send('profile:create:response', {
                    error: 'unknown flavor',
                    errorMessage: 'An unknown error has occurred, please try again.'
                });
                break;
        }
    } catch (err) {
        mainWindow.send('profile:create:response', {
            error: 'error creating',
            errorRaw: err,
            errorMessage: `An error has occurred while creating ${payload.name}.`
        });
        return;
    }

    await this.createProfile(payload.name, 'https://via.placeholder.com/240', payload.version, versionId, undefined);
    await fs.mkdirs(path.join(instanceDir, payload.name));

    console.log(`Finished installing '${payload.name}'!`);
    const notification = new Notification({
        title: `Profile installed!`,
        body: `${payload.name} has finished installing!`,
        icon: 'https://github.com/bhopahk/launcher/blob/master/public/icon.png',
    });
    notification.show();
    mainWindow.send('tasks:delete', { tId });
});
// Create curse modpack profile
ipcMain.on('profile:create:curse', async (event, payload) => {
    if (mainWindow == null)
        mainWindow = event.sender;
    let packData = {};
    const packJson = await (await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${payload.modpack}`)).json();
    packData.id = packJson.id;
    packData.name = packJson.name;

    // Find default icon
    let icon;
    for (let i = 0; i < packJson.attachments.length; i++)
        if (packJson.attachments[i].isDefault)
            icon = packJson.attachments[i].url;
    packData.originalIcon = icon;

    // Create valid profile name
    const findName = async (base, index = 0) => {
        if (await fs.pathExists(path.join(instanceDir, base)))
            return findName(`${base.endsWith(` (${index})`) ? base.substring(0, base.length - 3 - `${index}`.length) : base} (${++index})`, index);
        return base;
    };
    const name = await findName(packJson.name);
    await fs.mkdirs(path.join(instanceDir, name));

    const tId = await sendSync(mainWindow, 'tasks:create', { name });
    // Send response to disable the loading animation.
    mainWindow.send('profile:create:response');

    const fileJson = await (await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${payload.modpack}/file/${payload.file}`)).json();
    packData.version = fileJson.displayName;
    packData.versionId = fileJson.id;

    const versionInfo = await installer.installCurseModpack(tId, name, fileJson.downloadUrl);
    await this.createProfile(name, icon, versionInfo.version, versionInfo.localVersionId, packData);

    console.log(`Finished installing '${name}'!`);
    const notification = new Notification({
        title: `Profile installed!`,
        body: `${name} has finished installing!`,
        icon: 'https://github.com/bhopahk/launcher/blob/master/public/icon.png',
    });
    notification.show();
    mainWindow.send('tasks:delete', { tId });
});

// Get profile screenshots
ipcMain.on('profile:screenshots', async (event, payload) => {
    if (mainWindow == null)
        mainWindow = event.sender;
    const images = await this.getProfileScreenshots(payload);
    mainWindow.send('profile:screenshots', images);
});
// Delete a profile screenshot
ipcMain.on('profile:screenshots:delete', async (event, payload) => {
    if (mainWindow == null)
        mainWindow = event.sender;
    await this.deleteProfileScreenshot(payload.profile, payload.image);
    mainWindow.send('profile:screenshots', await this.getProfileScreenshots(payload.profile));
});

// Launch Profile todo this whole system needs a reboot
ipcMain.on('profile:launch', async (event, payload) => {
    const profile = await this.getProfile(payload);
    require('../launcher/launcher').launchProfile(profile).then(() => {
        console.log('Launched');
    });
});

// Exports
exports.createProfile = async (name, icon, version, target, packData) => {
    let profile = {};
    profile.name = name;
    profile.directory = path.join(instanceDir, name);
    profile.icon = await files.downloadImage(icon);
    profile.type = packData === undefined ? 'custom' : 'curse';
    profile.packData = packData;
    profile.created = new Date().getTime();
    profile.played = profile.created;
    profile.minecraftVersion = version.version;
    profile.flavor = version.flavor;
    delete version.flavor;
    profile.flavorVersion = version;
    profile.targetVersion = target;
    const res = config.getValue('defaults/resolution').split('x');
    profile.resolution = {
        width: res[0],
        height: res[1],
    };
    profile.memory = {
        min: '512',
        max: config.getValue('defaults/maxMemory'),
    };
    profile.javaArgs = config.getValue('defaults/javaArgs');
    await this.saveProfile(name, profile);
    await this.exportProfileToGame(profile);
};
exports.exportProfileToGame = async launcherProfile => {
    const profile = {
        name: launcherProfile.name,
        type: 'custom',
        created: launcherProfile.created,
        lastUsed: launcherProfile.played,
        lastVersionId: launcherProfile.targetVersion,
        resolution: launcherProfile.resolution,
        gameDir: launcherProfile.directory,
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4BAMAAADLSivhAAAAG1BMVEXMzMyWlpacnJy+vr6jo6OxsbGqqqrFxcW3t7fLh8KjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAnUlEQVRYhe3RvQrCMBiF4VOl1rGCFxDN0FWK4Frp4tjBC9CheyyVrlK8cH+mBopmFHmf7R0OHyESAAAAAOCXTNQuXbyuxvOz6V71tch3djS/iM/KlJbaKi4aN8ggkTaJydRI9uBl2FjNzTzfqt54GTaeW71PRZWXYePeqdRdOhovw8Zl5/LOKsnqYQaOV4v09bGz08UNEgAAAAD+1QORnRwe8Vw6/QAAAABJRU5ErkJggg==',
        javaArgs: `-Xmx${launcherProfile.memory.max}m -Xms${launcherProfile.memory.min}m -Dminecraft.applet.TargetDirectory="${launcherProfile.directory}" -Dfml.ignorePatchDiscrepancies=true -Dfml.ignoreInvalidMinecraftCertificates=true -Duser.language=en -Duser.country=US ${launcherProfile.javaArgs}`
    };
    const profileJson = path.join(installDir, 'launcher_profiles.json');
    if (!await fs.pathExists(profileJson)) {
        await fs.ensureFile(profileJson);
        await fs.writeJson(profileJson, { profiles: {} }, { spaces: 4 });
    }
    let profilesJson = await fs.readJson(profileJson);
    profilesJson.profiles[profile.name] = profile;
    await fs.writeJson(profileJson, profilesJson, { spaces: 4 });
};

exports.getProfile = async (name) => {
    const profiles = await fs.readJson(launcherProfiles);
    return profiles[name];
};
exports.getProfiles = async () => {
    return await fs.readJson(launcherProfiles);
};
exports.getProfileScreenshots = async (name) => {
    const dir = path.join((await this.getProfile(name)).directory, 'screenshots');
    if (!await fs.pathExists(dir))
        return [];
    const screenshots = await fs.readdir(dir);
    let images = [];
    for (let i = 0; i < screenshots.length; i++) {
        const processed = await files.loadImage(path.join(dir, screenshots[i]));
        if (!processed.error)
            images.push(processed);
    }
    return images;
};
exports.deleteProfileScreenshot = async (name, image) => {
    const target = path.join((await this.getProfile(name)).directory, 'screenshots', image);
    return require('electron').shell.moveItemToTrash(target);
};

exports.profileExists = async (name) => {
    return await this.getProfile(name) !== undefined;
};
exports.saveProfile = async (name, newProfile) => {
    const profiles = await fs.readJson(launcherProfiles);
    profiles[name] = newProfile;
    await fs.writeJson(launcherProfiles, profiles, { spaces: 4 });
};
exports.deleteProfile = async (name) => {
    const profiles = await fs.readJson(launcherProfiles);
    delete profiles[name];
    await fs.writeJson(launcherProfiles, profiles, { spaces: 4 });
};

exports.renderProfiles = async () => {
    const loaded = await this.getProfiles();
    const profiles = [];

    Object.keys(loaded).forEach(key => profiles.push(loaded[key]));
    mainWindow.send('profiles', profiles.sort((a, b) => a.played < b.played ? 1 : b.played < a.played ? -1 : 0));
};

// Helper functions
exports.sendTaskUpdate = (id, task, progress) => {
    mainWindow.send('tasks:update', {
        tId: id,
        task, progress
    });
};
