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

/**
 * Profile handler, manages interaction to and from profiles.
 */

const { app, shell, ipcMain, Notification } = require('electron');
const Database = require('../app/database');
const installer = require('./installer');
const config = require('../config/config');
const path = require('path');
const fs = require('fs-extra');
const files = require('../util/files');
const StreamZip = require('node-stream-zip');
const fetch = require('node-fetch');
const sendSync = require('../util/ipcMainSync').sendSync; //todo maybe make a main process api for tasks.

// Useful paths
const baseDir = app.getPath('userData');
const instanceDir = config.getValue('minecraft/instanceDir');

// For sending to the window outside of an ipc method
let mainWindow = null;
ipcMain.once('sync', event => mainWindow = event.sender);

// Profile data store.
const profileDb = new Database(path.join(baseDir, 'profiles.db'));
profileDb.index({ fieldName: 'name', unique: true });

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
ipcMain.on('profile:mod:add', async (event, payload) => {
    console.log('adding');
    const resp = await this.addMod(payload.profile, payload.data);
    console.log(resp);
    mainWindow.send('profile:mod:add', resp);
    // Re render the mods.
    this.renderMods(payload.profile);
});
ipcMain.on('profile:mod:list', (event, payload) => this.renderMods(payload));
ipcMain.on('profile:mod:update', () => {}); //todo this will probably be changed to `setVersion` or something
ipcMain.on('profile:mod:disable', (event, payload) => this.disableMod(payload.profile, payload.mod, payload.restrict)); //todo this will just be a toggle.
ipcMain.on('profile:mod:delete', async (event, payload) => {
    mainWindow.send('profile:mod:delete', await this.deleteMod(payload.profile, payload.mod));
    this.renderMods(payload.profile);
});

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
        name, directory,
        icon: await files.downloadImage(icon),
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
        javaArgs: config.getValue('defaults/javaArgs'),
        mods: {},
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

/**
 * Add a mod to a profile
 *
 * This adds either a Curse mod or a mod from a file to the target profile.
 * If `data` contains a `mod` and `file` field, a curse mod will be downloaded.
 * If `data` contains a `path` field, a local file will be copied.
 * In either case the mod will be checked for validity.
 * Note: The profile must not be vanilla or an error will be returned.
 *
 * @since 0.2.2
 *
 * @param {String} profile The profile name to add to.
 * @param {Object} data The mod to add.
 * @returns {Promise<Object>} The added mod, or an object with `error` and `errorMessage` if there was an issue.
 */
exports.addMod = async (profile, data) => {
    const target = await this.getProfile(profile);
    if (target.flavor !== 'forge' && target.flavor !== 'fabric')
        return { error: 'vanilla', errorMessage: 'The target profile is not modded!' };
    if (data.mod && data.file) {
        const fileJson = await (await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${data.mod}/file/${data.file}`)).json();
        data.path = path.join(target.directory, 'mods', fileJson.fileName);
        await files.download(fileJson.downloadUrl, data.path);
    } else await fs.copy(data.path, path.join(target.directory, 'mods', path.basename(data.path)));

    const modInfo = await loadModInfo(data.path, target.directory);
    if (modInfo.error || target.flavor !== modInfo.flavor) {
        await fs.remove(data.path);
        return modInfo.error ? modInfo : { error: 'not matching', errorMessage: 'Forge mods may only be used with forge and fabric with fabric.' };
    }

    delete modInfo.flavor;
    target.mods[uniqueId(15)] = modInfo;
    await profileDb.update({ name: target.name }, { $set: { mods: target.mods } });
    return modInfo;
};

/**
 * Get all mods and their info from a profile.
 *
 * This will fetch all mods and update the database entries for them. It has the potential to take a long time.
 *
 * @since 0.2.2
 *
 * @param {String} profile The profile name to query.
 * @returns {Promise<Array<Object>>} A
 */
exports.getMods = async profile => {
    const target = await this.getProfile(profile);
    let mods = Object.keys(target.mods).map(key => {
        let mod = target.mods[key];
        mod._id = key;
        return mod;
    });
    return mods.sort((a, b) => a.name.localeCompare(b.name)); //a.name < b.name ? -1 : a.name > b.name ? 1 : 0
};

/**
 * Render loaded mods for a profile.
 *
 * @since 0.2.2
 *
 * @param {String} profile The profile which should have its mods rendered.
 * @returns {Promise<Array<Object>>} Completion
 */
exports.renderMods = profile => this.getMods(profile).then(mods => mainWindow.send('profile:mod:list', mods));

/**
 * Update a curse mod to a new version.
 *
 * This will return an error if the update fails or the mod is not a registered curse mod or it has no update.
 * profile#updateMod can be used to check if an update is available.
 *
 * @since 0.2.2
 *
 * @param {String} profile
 * @param {String} mod The unique id of the target mod.
 * @returns {Promise<void|Object>} Void if successful, otherwise error.
 */
exports.updateMod = async (profile, mod) => {

};

/**
 * Gets whether or not a mod can be updated.
 *
 * This will be done automatically for all of the known mods (in the background) when they are fetched.
 *
 * @since 0.2.2
 *
 * @param {String} profile The profile name of the target mod.
 * @param {String} mod The unique id of the target mod.
 * @returns {Promise<boolean>}
 */
exports.isUpdatable = async (profile, mod) => {

};

/**
 * Toggle whether a mod will be used without removing it.
 *
 * This will simply toggle the extension of the file from `jar` to `dis`.
 * If a restriction is applied, it will be a setter instead of a toggle.
 * `true` = enable it, `false` = disable it
 *
 * @since 0.2.2
 *
 * @param {String} profile The profile name of the target mod.
 * @param {String} mod The unique id of the target mod.
 * @param {boolean} (restrict) Optional restriction to force the status to be the value of `restrict`
 * @returns {Promise<boolean|Object>} The new enabled status of the mod, or an error.
 */
exports.disableMod = async (profile, mod, restrict = undefined) => {
    const target = await this.getProfile(profile);
    if (target == null)
        return { error: 'nonexistent profile', errorMessage: 'The target profile does not exist!' };
    const modInfo = target.mods[mod], modPath = modInfo.path;
    if (restrict === true && modInfo.enabled === true)
        modInfo.enabled = false;
    if (restrict === false && modInfo.enabled === false)
        modInfo.enabled = true;

    const from = modPath + (modInfo.enabled ? '.jar' : '.dis');
    const to = modPath + (modInfo.enabled ? '.dis' : '.jar');
    await fs.rename(from, to);
    await fs.remove(from);

    let update = {};
    update[`mods.${mod}.enabled`] = !modInfo.enabled;
    await profileDb.update({ name: profile }, { $set: update });
    return !modInfo.enabled;
};

/**
 * Delete a mod.
 *
 * @since 0.2.2
 *
 * @param {String} profile The profile name of the target mod.
 * @param {String} mod The unique id of the target mod.
 * @returns {Promise<void|Object>} Undefined if successful, object if error.
 */
exports.deleteMod = async (profile, mod) => {
    const target = await this.getProfile(profile);
    if (target == null)
        return { error: 'nonexistent profile', errorMessage: 'The target profile does not exist!' };
    const modInfo = target.mods[mod];
    if (modInfo === undefined)
        return { error: 'nonexistent mod', errorMessage: 'The target mod does not exist!' };

    const path = modInfo.path + (modInfo.enabled ? '.jar' : '.dis');
    await fs.remove(path);

    const query = {};
    query[`mods.${mod}`] = true;
    profileDb.update({ name: profile }, { $unset: query });
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
    const profileJson = path.join(baseDir, 'Install', 'launcher_profiles.json');
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
    const profileJson = path.join(baseDir, 'Install', 'launcher_profiles.json');
    if (!await fs.pathExists(profileJson))
        return;
    let profilesJson = await fs.readJson(profileJson);
    delete profilesJson.profiles[name];
    await fs.writeJson(profileJson, profilesJson, { spaces: 4 });
};

/**
 * Fetches mod info for a fabric or forge mod.
 *
 * This uses the `mcmod.info` (forge) or `fabric.mod.json` (fabric).
 *
 * @since 0.2.2
 *
 * @param {String} file The path to the mod
 * @param {String} profileDirectory The enclosing profile's instance directory.
 * @returns {Promise<Object>} Mod info
 */
const loadModInfo = (file, profileDirectory) => new Promise(async resolve => {
    if (!file.endsWith('jar') && !file.endsWith('dis'))
        return { error: 'not jar', errorMessage: 'The supplied file did not end with jar or dis.' };
    let info = {};
    const archive = new StreamZip({ file: file, storeEntries: true });
    archive.on('ready', () => {
        for (const entry of Object.values(archive.entries())) {
            if (entry.name !== 'mcmod.info' && entry.name !== 'fabric.mod.json')
                continue;
            const base64IconSafe = iconFile => new Promise(resolve => {
                if (iconFile === undefined)
                    return resolve('');
                archive.stream(iconFile, (err, stream) => {
                    if (stream === undefined)
                        return resolve('');
                    let body = 'data:image/png;base64,';
                    stream.setEncoding('base64');
                    stream.on('data', data => body += data);
                    stream.on('end', () => resolve(body));
                })
            });
            let body = '';
            archive.stream(entry.name, (err, stream) => {
                stream.setEncoding('utf8');
                stream.on('data', data => body += data);
                stream.on('end', async () => {
                    const mod = JSON.parse(body.replace(/\n/g, ''));
                    if (entry.name === 'mcmod.info') {
                        const convert = async json => { return {
                            id: json.modid,
                            name: json.name,
                            authors: json.authorList,
                            description: json.description.trim(),
                            version: json.version,
                            flavor: 'forge',
                            minecraftVersion: json.mcversion,
                            icon: await base64IconSafe(json.logoFile),
                            url: json.url,
                        }};
                        info = await convert(mod[0]);
                        mod.shift();
                        info.extras = mod.map(async () => await convert());
                    } else {
                        info = {
                            id: mod.id,
                            name: mod.name,
                            authors: mod.authors,
                            description: mod.description,
                            version: mod.version,
                            flavor: 'fabric',
                            icon: await base64IconSafe(mod.icon),
                            url: mod.contact ? mod.contact.homepage : '',
                        }
                    }
                    info.path = path.join(profileDirectory, 'mods', path.basename(file, file.endsWith('dis') ? '.dis' : '.jar'));
                    info.enabled = true;
                    archive.close(() => resolve(info));
                });
            });
            break;
        }
    });
});

/**
 * Generate a fairly unique id with a given length.
 *
 * This will use pseudo randomness and generate a string of given length.
 * Credits: https://stackoverflow.com/a/1349426/9842323
 *
 * @since 0.2.2
 *
 * @param {number} length The number of characters in the id.
 * @returns {String} The id.
 */
const uniqueId = length => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', cLen = characters.length;
    for (let i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * cLen));
    return result;
};

//todo would not be opposed to removing VVV -- should make some sort of task manager object for the main process. This should take over the one in the render process.
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
