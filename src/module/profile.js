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
const installer = require('./installer');

const baseDir = app.getPath('userData');
const installDir = path.join(baseDir, 'Install');
const instanceDir = path.join(baseDir, 'Instances');

let mainWindow = null;

app.on('ready', () => {
    ipcMain.on('profile:custom', (event, payload) => {
        if (mainWindow == null)
            mainWindow = event.sender;
        const onSuccess = () => {
            mainWindow.send('profile:custom', {
                result: 'SUCCESS',
                name: payload.name,
            });
        };
        switch (payload.action) {
            case 'CREATE':
                this.createBaseProfile(payload, onSuccess).then(code => {
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
    });
});

exports.createBaseProfile = async (data, onApproved, overwrite) => {
    const dir = path.join(instanceDir, data.name);

    if (overwrite) {
        await fs.remove(dir);
    } else if (await fs.pathExists(dir))
        return 2; //todo check the profile data file instead

    await fs.mkdirs(dir);
    onApproved();

    const onLibraryInstall = data => {
        console.log(`Library Installed: ${data.name} ~ ${data.index}/${data.count}`);
    };

    const profileOptions = {
        name: data.name,
        version: data.version,
        directory: dir,
    };

    switch (data.flavor) {
        case 'vanilla':
            await installer.installVersion(data.version, onLibraryInstall);
            await this.createGameProfile(profileOptions);
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

    return 0;
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
        resolution: {
            width: 1024,
            height: 768 //todo these should come from a default, so should memory.
        },
        gameDir: options.directory,
        javaArgs: `-Xmx${'4096'}m -Xms${'1024'}m -Dminecraft.applet.TargetDirectory="${options.directory}" -Dfml.ignorePatchDiscrepancies=true -Dfml.ignoreInvalidMinecraftCertificates=true -Duser.language=en -Duser.country=US`
    };

    let profilesJson = await fs.readJson(profileJson);
    profilesJson.profiles[options.name] = profile;
    await fs.writeJson(profileJson, profilesJson, { spaces: 4 });
};

const handleResponseCode = (code, data) => {
    switch (code) {
        // Successfully created.
        case 0:
            //todo send notification
            console.log('FINISHED INSTALLING PROFILE, THIS SHOULD SEND A SYSTEM NOTIFICATION.');

            require('../launcher/launcher').launchProfile({
                name: data.name,
            }).then(() => {
                console.log('Launched');
            });
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
