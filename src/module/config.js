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

// A simple JSON based config system

const path = require('path');
const fs = require('fs-extra');
const { app } = require('electron');

const baseDir = app.getPath('userData');
const configDir = path.join(baseDir, 'config');

// Launcher settings
const launcherConfig = path.join(configDir, 'launcher.json');

// Minecraft/game settings
const gameConfig = path.join(configDir, 'minecraft.json');

app.on('ready', async () => {
    await fs.mkdirs(configDir);

    if (!await fs.pathExists(launcherConfig)) {
        await fs.ensureFile(launcherConfig);
        await fs.writeJson(launcherConfig, {

        }, { spaces: 4 });
    }

    if (!await fs.pathExists(gameConfig)) {
        await fs.ensureFile(gameConfig);
        await fs.writeJson(gameConfig, {
            // native, legacy, none (not implemented)
            launcher: 'native',
            // Default resolution for the game.
            resolution: {
                width: 1280,
                height: 720,
            },
            // Default memory assigned to each profile.
            memory: {
                min: 1024,
                max: 4096,
            },
            // Extra java arguments to be added to every profile.
            javaArgs: '',
        }, { spaces: 4 });
    }


});

app.on('quit', () => {

})