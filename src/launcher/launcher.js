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

const NativeLauncher = require('../launcher/NativeLauncher');
const LegacyLauncher = require('../launcher/LegacyLauncher');

const fs = require('fs-extra');
const path = require('path');
const profile = require('../module/profile');

const baseDir = require('electron').app.getPath('userData');
const installDir = path.join(baseDir, 'Install');
const isNative = process.platform === 'win32'; //todo this should come from config in the future.

exports.launchProfile = async (profile) => {
    await this.selectProfile(profile.name);
    await updateLastLaunched(profile.name);

    let game;
    if (isNative)
        game = new NativeLauncher();
    else game = new LegacyLauncher();
};

exports.selectProfile = async (profile) => {
    const profileJson = path.join(installDir, 'launcher_profiles.json');

    if (!await fs.pathExists(profileJson))
        return false;

    let profilesJson = await fs.readJson(profileJson);
    profilesJson.profiles[name].lastUsed = new Date().toISOString();
    await fs.writeJson(profileJson, profilesJson, { spaces: 4 });
};

const updateLastLaunched = async (name) => { //todo this should also update stuff like resolution and memory.
    let loaded = await profile.getProfile(name);
    loaded.launched = new Date().getTime();
    await profile.saveProfile(name, loaded);
    await profile.renderProfiles();
};
