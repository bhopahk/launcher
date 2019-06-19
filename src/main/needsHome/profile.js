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

const { app, shell, ipcMain, Notification } = require('electron');
const Database = require('../app/database');
const config = require('../config/config');
const path = require('path');
const fs = require('fs-extra');
const files = require('../util/files');
const fetch = require('node-fetch');


// Start useless requires
const installer = require('./installer');
const sendSync = require('../util/ipcMainSync').sendSync;

//todo need to look around renderer for any places where ipc listeners are registered but not unregistered (is a memory leak)

const baseDirold = app.getPath('userData');
const installDir = path.join(baseDirold, 'Install');
const launcherProfiles = path.join(baseDirold, 'profiles.json');
// End useless requires

// Useful paths
const baseDir = app.getPath('userData');
const instanceDir = config.getValue('minecraft/instanceDir');

// For sending to the window outside of an ipc method
let mainWindow = null;
ipcMain.once('sync', event => mainWindow = event.sender);

// Profile data store.
const profileDb = new Database(path.join(baseDir, 'profiles.db'));
profileDb.index({ fieldName: 'name', required: true });

// IPC listeners
// CRUD operations
ipcMain.on('profile:create', (event, payload) => this.createProfile(payload));
ipcMain.on('profile:list', () => this.renderProfiles());
ipcMain.on('profile:update', () => {}); //todo
ipcMain.on('profile:delete', (event, payload) => this.deleteProfile(payload));

// Screenshots
ipcMain.on('profile:screenshot:list', async (event, payload) => mainWindow.send('profile:screenshot:render', await this.getScreenshots(payload)));
ipcMain.on('profile:screenshot:delete', async (event, payload) => {
    await this.deleteScreenshot(payload.profile, payload.image);
    mainWindow.send('profile:screenshot:render', await this.getScreenshots(payload.profile));
});

// Mods
ipcMain.on('profile:mod:add', () => {});
ipcMain.on('profile:mod:list', () => {});
ipcMain.on('profile:mod:update', () => {});
ipcMain.on('profile:mod:disable', () => {}); //todo this will just be a toggle.
ipcMain.on('profile:mod:delete', () => {});

// Resource Packs
//todo resource pack listing and adding

// Worlds
//todo world listing and adding

/**
 * Creates a custom or curse based profile.
 *
 * When provided a `modpack`(curse project id) and `file`(curse file id), a curse modpack will be generated.
 * When provided a `version` containing (at minimum) `version`, `flavor`, a custom profile will be generated.
 *
 * @since 0.2.2
 *
 * @param {Object} data     JSON data containing either modpack id and file id or version data.
 * @returns {Promise<void>} Completion.
 */
exports.createProfile = async data => {
    let icon;
    let packData = {};
    if (data.modpack !== undefined) {
        const packJson = await (await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${data.modpack}`)).json();
        packData.id = packJson.id;
        packData.name = packJson.name;

        for (let i = 0; i < packJson.attachments.length; i++)
            if (packJson.attachments[i].isDefault)
                icon = packJson.attachments[i].url;
        packData.originalIcon = icon;

        data.name = packData.name
    } else icon = 'https://via.placeholder.com/240';

    const name = await findName(data.name);
    const directory = path.join(instanceDir, name);
    await fs.mkdirs(directory);

    const tId = await sendSync(mainWindow, 'tasks:create', { name });
    mainWindow.send('profile:create:response'); //todo probably change this channel id

    let versionId;
    if (data.modpack === undefined) {
        switch (data.version.flavor) {
            case 'vanilla':
                versionId = await installer.installVanilla(data.version.version, tId);
                break;
            case 'forge':
                versionId = await installer.installForge(data.version.forge, tId);
                break;
            case 'fabric':
                versionId = await installer.installFabric(data.version.mappings, data.version.loader, tId);
                break;
            default:
                mainWindow.send('profile:create:response', {
                    error: 'unknown flavor',
                    errorMessage: 'An unknown error has occurred, please try again.'
                });
                break;
        }
    } else {
        const fileJson = await (await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${data.modpack}/file/${data.file}`)).json();
        packData.version = fileJson.displayName;
        packData.versionId = fileJson.id;

        const versionInfo = await installer.installCurseModpack(tId, name, fileJson.downloadUrl);
        versionId = versionInfo.localVersionId;
        data.version = versionInfo.version;
    }

    const now = new Date().getTime();
    const created = await profileDb.insert({
        name, directory, icon,
        type: data.modpack === undefined ? 'custom' : 'curse',
        packData,
        created: now, played: 0,
        flavor: data.version.flavor,
        minecraftVersion: data.version.version,
        targetVersion: versionId,
        rawVersion: data.version,
        resolution: {
            width: config.getValue('defaults/resolution').split('x')[0],
            height: config.getValue('defaults/resolution').split('x')[1],
        },
        memory: {
            min: '512',
            max: config.getValue('defaults/maxMemory'),
        },
        javaArgs: config.getValue('defaults/javaArgs')
    });
    await exportLauncherProfile(created);
    await this.renderProfiles();

    console.log(`Finished installing '${name}'!`);
    const notification = new Notification({
        title: `Profile installed!`,
        body: `${name} has finished installing!`,
        icon: 'https://github.com/bhopahk/launcher/blob/master/public/icon.png'
    });
    notification.show();
    mainWindow.send('tasks:delete', { tId });
};

/**
 * Get a single profile by name.
 *
 * This will fetch a single target profile from the database, if it does not exist nothing will be returned.
 *
 * @since 0.2.2
 *
 * @param {String} name The name of the target profile.
 * @returns {*|Promise<Object>}
 */
exports.getProfile = name => profileDb.findOne({ name });

/**
 * Fetches all profiles from the database.
 *
 * @since 0.2.2
 *
 * @returns {*|Promise<Array<Object>>}
 */
exports.getProfiles = () => profileDb.find({});

/**
 * Sends profiles to the render process to be shown.
 *
 * This will send an array of profiles, ordered (ascending) by last played.
 * Should be called when there has been an update to one or more profiles, also when the renderer requests them (ie the profiles tab has been opened)
 *
 * @since 0.2.2
 *
 * @returns {Promise<void>} Completion.
 */
exports.renderProfiles = async () => mainWindow.send('profile:render', (await this.getProfiles()).sort((a, b) => a.played < b.played ? 1 : b.played < a.played ? -1 : 0));

/**
 * Updates supplied fields on the target profile.
 *
 * All fields supplied in `updates` will be applied to the profile assuming the profile has them already.
 * Note: The fields `_id` and `packData` may not be updated.
 *
 * @since 0.2.2
 *
 * @param {String} name The name of the profile to update.
 * @param {Object} updates The updates to apply to the profile.
 * @returns {Promise<boolean>} Whether or not the supplied name is valid.
 */
exports.updateProfile = async (name, updates) => {
    if (await profileDb.count({ name: updates.name }) === 1)
        return false;

    let old = await profileDb.findOne({ name });
    if (old === undefined)
        return true;

    Object.keys(old).forEach(key => {
        if (key === '_id' || key === 'packData')
            return;
        if (updates[key])
            old[key] = updates[key]
    });

    await profileDb.update({ name }, old);
    await exportLauncherProfile(old);
    await this.renderProfiles();
    return true;
};

/**
 * Delete an existing (or not) profile.
 *
 * This will delete any existing launcher profile by the name, delete the profile from the profile db,
 * and if `minecraft/deleteFiles` is set to true, the instance directory.
 *
 * @since 0.2.2
 *
 * @param {String} name The name of the profile to erase.
 * @returns {Promise<void>} Completion.
 */
exports.deleteProfile = async name => {
    const target = await profileDb.findOne({ name });
    await deleteLauncherProfile(name);
    await profileDb.remove({ name });
    if (config.getValue('minecraft/deleteFiles') && target !== undefined)
        await fs.remove(target.directory);
    await this.renderProfiles();
};

/**
 * Gets all screenshots for a profile.
 *
 * This will fetch all images and return then as an object in the form of
 * `name`, `path`, `src` where name is the file name, path is the absolute path
 * to the image, and src is the base64 encoding of the image.
 *
 * @since 0.2.2
 *
 * @param {String} profile The name of the profile to fetch screenshots from.
 * @returns {Promise<Array<Object>>} Completion.
 */
exports.getScreenshots = async profile => {
    const dir = path.join((await profileDb.findOne({ name: profile })).directory, 'screenshots');
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

/**
 * Remove an image from a target profile.
 *
 * This will move the image to the user trash can, meaning it can still be recovered afterwards.
 *
 * @since 0.2.2
 *
 * @param {String} profile The profile name.
 * @param {String} image The image file name.
 * @returns {Promise<boolean>} Whether the image was trashed or not.
 */
//todo this could trash any file on the system?
exports.deleteScreenshot = async (profile, image) => {
    const target = path.join((await profileDb.findOne({ name: profile })).directory, 'screenshots', image);
    return shell.moveItemToTrash(target);
};

// Helper functions
/**
 * Find a valid name based for a profile based on a starting value.
 *
 * This will append a number to the end of the profile name if it is in use with the format `NAME (x)`.
 *
 * @since 0.2.2
 *
 * @param {String} base The starting name for the profile.
 * @param {Number} index For internal use only. Recursive value to keep check of name.
 * @returns {Promise<String>} A valid name.
 */
const findName = async (base, index = 0) => {
    if (await fs.pathExists(path.join(instanceDir, base)))
        return findName(`${base.endsWith(` (${index})`) ? base.substring(0, base.length - 3 - `${index}`.length) : base} (${++index})`, index);
    return base;
};

/**
 * Create a Minecraft launcher profile based on a Proton launcher profile.
 *
 * This will convert the profile and write it to `Install/launcher_profiles.json`.
 * A full and valid profile json object must be provided, not just a name.
 * Any existing profile with the same name will be overwritten.
 *
 * @since 0.2.2
 *
 * @param {Object} profile The profile to export.
 * @returns {Promise<void>} Completion.
 */
const exportLauncherProfile = async profile => {
    const profileJson = path.join(installDir, 'launcher_profiles.json');
    if (!await fs.pathExists(profileJson)) {
        await fs.ensureFile(profileJson);
        await fs.writeJson(profileJson, { profiles: {} }, { spaces: 4 });
    }
    let profilesJson = await fs.readJson(profileJson);
    profilesJson.profiles[profile.name] = {
        name: profile.name,
        type: 'custom',
        created: profile.created,
        lastUsed: profile.played,
        lastVersionId: profile.targetVersion,
        resolution: profile.resolution,
        gameDir: profile.directory,
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4BAMAAADLSivhAAAAG1BMVEXMzMyWlpacnJy+vr6jo6OxsbGqqqrFxcW3t7fLh8KjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAnUlEQVRYhe3RvQrCMBiF4VOl1rGCFxDN0FWK4Frp4tjBC9CheyyVrlK8cH+mBopmFHmf7R0OHyESAAAAAOCXTNQuXbyuxvOz6V71tch3djS/iM/KlJbaKi4aN8ggkTaJydRI9uBl2FjNzTzfqt54GTaeW71PRZWXYePeqdRdOhovw8Zl5/LOKsnqYQaOV4v09bGz08UNEgAAAAD+1QORnRwe8Vw6/QAAAABJRU5ErkJggg==',
        javaArgs: `-Xmx${profile.memory.max}m -Xms${profile.memory.min}m -Dminecraft.applet.TargetDirectory="${profile.directory}" -Dfml.ignorePatchDiscrepancies=true -Dfml.ignoreInvalidMinecraftCertificates=true -Duser.language=en -Duser.country=US ${profile.javaArgs}`
    };
    await fs.writeJson(profileJson, profilesJson, { spaces: 4 });
};

/**
 * Delete a profile from the Minecraft launcher.
 *
 * This will simply remove the object entry from `Install/launcher_profiles.json`.
 *
 * @since 0.2.2
 *
 * @param {String} name The name of the profile to delete.
 * @returns {Promise<void>} Completion.
 */
const deleteLauncherProfile = async name => {
    const profileJson = path.join(installDir, 'launcher_profiles.json');
    if (!await fs.pathExists(profileJson))
        return;
    let profilesJson = await fs.readJson(profileJson);
    delete profilesJson.profiles[name];
    await fs.writeJson(profileJson, profilesJson, { spaces: 4 });
};



//todo would not be opposed to removing VVV
exports.sendTaskUpdate = (id, task, progress) => {
    mainWindow.send('tasks:update', {
        tId: id,
        task, progress
    });
};

//todo This is super legacy and needs to be completely redone when accounts are ready / direct launch is ready.
ipcMain.on('profile:launch', async (event, payload) => {
    const profile = await profileDb.findOne({ name: payload });
    require('../launcher/launcher').launchProfile(profile).then(() => {
        console.log('Launched');
    });
});


