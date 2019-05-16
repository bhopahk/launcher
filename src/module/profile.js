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
const sendSync = require('./ipcMainSync').sendSync;

const test = require('../config/config').getValue('minecraft/instanceDir');
console.log('TEST: ' + test);

const baseDir = app.getPath('userData');
const installDir = path.join(baseDir, 'Install');
const instanceDir = path.join(baseDir, 'Instances');
const launcherProfiles = path.join(baseDir, 'profiles.json');

let mainWindow = null;

fs.pathExists(launcherProfiles).then(async exists => {
    if (exists)
        return;
    await fs.ensureFile(launcherProfiles);
    await fs.writeJson(launcherProfiles, {}, { spaces: 4 });
});

ipcMain.on('profile:custom', installCustomProfile.bind(this));
ipcMain.on('profile:curse', installCurseProfile.bind(this));

ipcMain.on('profiles', async event => {
    if (mainWindow == null)
        mainWindow = event.sender;
    await this.renderProfiles();
});
ipcMain.on('profile:launch', async (event, payload) => {
    const profile = await this.getProfile(payload);
    require('../launcher/launcher').launchProfile(profile).then(() => {
        console.log('Launched');
    });
});

exports.createProfile = async (data, onApproved, overwrite) => {
    const dir = path.join(instanceDir, data.name);

    if (overwrite)
        await fs.remove(dir);
    else if (await this.profileExists(data.name))
        return 2;

    await fs.mkdirs(dir);
    const tId = await onApproved();

    const onLibraryInstall = data => {
        if (tId)
            mainWindow.send('tasks:update', {
                tId,
                task: 'downloading libraries',
                progress: data.index/data.count,
            });
    };

    const profileOptions = {
        name: data.name,
        flavor: data.flavor,
        version: data.version,
        icon: data.icon == null ? defaultFavicon : data.icon,
        directory: dir,
    };

    switch (data.flavor) {
        case 'vanilla':
            await installer.installVersion(data.version, onLibraryInstall);
            break;
        case 'forge':
            await installer.installForge(data.version, onLibraryInstall);
            break;
        case 'fabric':
            console.log('attempted to install fabric, but that is not implemented yet.');
            break;
        default:
            return 1;
    }
    await this.createLauncherProfile(profileOptions);
    if (tId)
        mainWindow.send('tasks:delete', { tId });
    return 0;
};
exports.createLauncherProfile = async (profile) => {
    profile.type = 'custom';
    profile.resolution = { //todo from config
        width: 1280,
        height: 720,
    };
    profile.memory = { //todo from config
        min: '1024',
        max: '4096',
    };
    const now = new Date().getTime();
    profile.created = now;
    profile.modified = now;
    profile.launched = 0;
    profile.javaArgs = ''; //todo from config

    await this.saveProfile(profile.name, profile);
    await this.createGameProfile({
        name: profile.name,
        version: profile.version,
        directory: profile.directory,
        resolution: profile.resolution,
        memory: profile.memory,
        javaArgs: profile.javaArgs,
    });
};
exports.createGameProfile = async (options) => {
    const profileJson = path.join(installDir, 'launcher_profiles.json');

    if (!await fs.pathExists(profileJson)) {
        await fs.ensureFile(profileJson);
        await fs.writeJson(profileJson, { profiles: {} }, { spaces: 4 });
    }

    const profile = {
        name: options.name,
        type: 'custom',
        created: new Date().toISOString(),
        lastUsed: '1970-01-01T00:00:00.000Z',
        lastVersionId: options.version,
        resolution: options.resolution,
        gameDir: options.directory,
        javaArgs: `-Xmx${options.memory.max}m -Xms${options.memory.min}m -Dminecraft.applet.TargetDirectory="${options.directory}" -Dfml.ignorePatchDiscrepancies=true -Dfml.ignoreInvalidMinecraftCertificates=true -Duser.language=en -Duser.country=US ${options.javaArgs}`
    };

    let profilesJson = await fs.readJson(profileJson);
    profilesJson.profiles[options.name] = profile;
    await fs.writeJson(profileJson, profilesJson, { spaces: 4 });
};

exports.getProfile = async (name) => {
    const profiles = await fs.readJson(launcherProfiles);
    return profiles[name];
};
exports.getProfiles = async () => {
    return await fs.readJson(launcherProfiles);
};
exports.createProfile = async () => {
    //todo add creation stuff here and move everything else to installer. This should be usable for all types of profile.
};
exports.profileExists = async (name) => {
    return await this.getProfile(name) !== undefined;
};
exports.saveProfile = async (name, newProfile) => {
    const profiles = await fs.readJson(launcherProfiles);
    profiles[name] = newProfile;
    await fs.writeJson(launcherProfiles, profiles, { spaces: 4 });
};

exports.renderProfiles = async () => {
    const loaded = await this.getProfiles();
    const profiles = [];

    Object.keys(loaded).forEach(key => {
        profiles.push({
            name: loaded[key].name,
            icon: loaded[key].icon,
            version: loaded[key].modpackVersion == null ? loaded[key].version : loaded[key].modpackVersion,
            played: loaded[key].launched,
        });
    });

    mainWindow.send('profiles', profiles);
};

async function installCustomProfile(event, payload) {
    if (mainWindow == null)
        mainWindow = event.sender;
    if (payload.name) {
        console.log(payload);
        return;
    }

    const onSuccess = async () => {
        mainWindow.send('profile:custom', {
            result: 'SUCCESS',
            name: payload.name,
        });
        return await sendSync(mainWindow, 'tasks:create', { name: payload.name });
    };
    switch (payload.action) {
        case 'CREATE':
            this.createProfile(payload, onSuccess).then(code => {
                payload.action = 'OVERWRITE';
                handleResponseCode(code, payload);
            });
            break;
        case 'CANCEL':
            console.log(payload);
            break;
        case 'OVERWRITE':
            this.createBaseProfile(payload, onSuccess, true).then(code => handleResponseCode(code, payload));
            break;
        default:
            break;
    }
}
async function installCurseProfile(event, payload) {
    if (mainWindow == null)
        mainWindow = event.sender;
    switch (payload.action) {
        case 'CREATE':






            // mainWindow.send('profile:custom', {
            //     result: 'SUCCESS',
            //     name: payload.name,
            // });
            // const tId = await sendSync(mainWindow, 'tasks:create', { name: payload.name });
            //
            // payload.packName = payload.name;
            //
            // let code;
            // let i = 0;
            // do {
            //     payload.name = payload.packName + ` ${i === 0 ? '' : i}`;
            //     code = await this.createProfile(payload, () => { return tId; });
            //     i++;
            // } while (code === 2);



            break;
        case 'CANCEL':
            console.log(payload);
            break;
        default:
            break;
    }
}

const handleResponseCode = (code, data) => {
    switch (code) {
        // Successfully created.
        case 0:
            console.log(`Finished installing '${data.name}'!`);

            // Send system notification
            const notification = new Notification({
                title: `Profile installed!`,
                body: `${data.name} has finished installing!`,
                icon: 'https://github.com/bhopahk/launcher/blob/master/public/icon.png',
            });
            notification.show();

            break;
        // Profile already exists.
        case 2:
            mainWindow.send('profile:custom', {
                result: 'ERROR',
                type: 'existing',
                value: 'A profile with that name already exists!',
                callback: data,
            });
            break;
        // Assume error if nothing else.
        default:
            mainWindow.send('profile:custom', {
                result: 'ERROR',
                type: 'arbitrary',
                value: 'An unknown error has occurred, please try again.',
            });
            break;
    }
};
