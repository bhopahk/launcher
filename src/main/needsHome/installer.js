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

const fs = require('fs-extra');
const path = require('path');
const files = require('../util/files');
const lzma = require('lzma-purejs');
const fetch = require('node-fetch');
const cache = require('../game/versionCache');
const config = require('../config/config');
const { BrowserWindow, ipcMain } = require('electron');
const platform = process.platform;
const workers = require('../worker/workers');

const baseDir = require('electron').app.getPath('userData');
const tempDir = path.join(baseDir, 'temp');
const installDir = path.join(baseDir, 'Install');
const libDir = path.join(installDir, 'libraries');

const FABRIC_LOADER = 'https://maven.fabricmc.net/net/fabricmc/fabric-loader/';

const aliases = {
    win32: 'natives-windows',
    darwin: 'natives-osx',
    linux: 'natives-linux',
    sunos: 'natives-linux',
    openbsd: 'natives-linux',
    android: 'natives-linux',
    aix: 'natives-linux',
};

fs.mkdirs(tempDir);

const sendTaskUpdate = (id, task, progress) => require('./profile').sendTaskUpdate(id, task, progress);

exports.installBaseGame = async (platform = 'win32', modern = true) => {
    const launcherPath = path.join(installDir, `minecraft.${platform === 'win32' ? 'exe' : 'jar'}`);
    if (await fs.pathExists(launcherPath))
        return false;

    if (platform !== 'win32' && modern) {
        console.log('Cannot install native minecraft launcher for any os other than windows!');
        return false;
    }

    if (!modern) {
        console.log('Installing legacy Minecraft launcher.');
        const compressedPath = path.join(tempDir, 'launcher.jar.lzma');
        await files.download('http://launcher.mojang.com/mc/launcher/jar/fa896bd4c79d4e9f0d18df43151b549f865a3db6/launcher.jar.lzma', compressedPath);
        fs.writeFileSync(launcherPath, lzma.decompressFile(fs.readFileSync(compressedPath)));
        await fs.remove(compressedPath);
        return true;
    }

    if (platform === 'win32') {
        console.log('Installing native Minecraft launcher.');
        await files.download('https://launcher.mojang.com/download/Minecraft.exe', launcherPath);
        return true;
    }
};

exports.installVanilla = async (version, task) => {
    const dir = path.join(installDir, 'versions', version);

    // Create version directory and find the version json
    console.log(`Installing (or validating) Minecraft ${version}`);
    fs.mkdirs(dir);
    const vanilla = await (await fetch(cache.findGameVersion(version).url)).json();

    // Write version json
    sendTaskUpdate(task, 'writing profile settings', 1/3);
    const jsonLoc = path.join(dir, `${version}.json`);
    if (!await fs.pathExists(jsonLoc))
        await files.download(cache.findGameVersion(version).url, jsonLoc);
    // Download client jar
    sendTaskUpdate(task, 'writing profile settings', 2/3);
    const clientJar = path.join(dir, `${version}.jar`);
    if (!await fs.pathExists(clientJar) || (await files.fileChecksum(clientJar, 'sha1')) !== vanilla.downloads.client.sha1)
        await files.download(vanilla.downloads.client.url, clientJar);
    // Download asset index
    sendTaskUpdate(task, 'writing profile settings', 3/3);
    const assetIndex = path.join(installDir, 'assets', 'indexes', `${vanilla.assetIndex.id}.json`);
    if (!await fs.pathExists(assetIndex) || (await files.fileChecksum(assetIndex, 'sha1')) !== vanilla.assetIndex.sha1)
        await files.download(vanilla.assetIndex.url, assetIndex);
    console.log(await files.fileChecksum(assetIndex, 'sha1'));

    // Download assets
    await validateGameAssets(task, (await fs.readJson(assetIndex)).objects);
    await downloadAssets((await fs.readJson(assetIndex)).objects, task);

    // Download logger config
    const logConfig = path.join(installDir, 'assets', 'log_configs', vanilla.logging.client.file.id);
    if (!await fs.pathExists(logConfig) || (await files.fileChecksum(logConfig, 'sha1')) !== vanilla.logging.client.file.sha1)
        await files.download(vanilla.logging.client.file.url, assetIndex);

    // Download libraries
    await downloadVanillaLibraries(vanilla.libraries, task);
};

exports.installForge = async (version, task) => {
    const forge = await (await fetch(`https://addons-ecs.forgesvc.net/api/v2/minecraft/modloader/${version}`)).json();
    const afterOneFourteen = parseInt(forge.minecraftVersion.split('.')[1]) >= 14;

    // Create version directory and fetch version info.
    const realName = afterOneFourteen ? `${forge.minecraftVersion}-${forge.name}` : version;
    const dir = path.join(installDir, 'versions', realName);
    await fs.mkdirs(dir);
    let versionJson = JSON.parse(forge.versionJson);
    versionJson.id = realName;

    await this.installVanilla(forge.minecraftVersion, task);

    if (afterOneFourteen) {
        delete versionJson.jar;
        delete versionJson.minimumLauncherVersion;
        versionJson.logging = {};

        // Write version json
        sendTaskUpdate(task, 'writing version settings', 1/2);
        const versionJsonPath = path.join(dir, `${realName}.json`);
        if (!await fs.pathExists(versionJsonPath))
            await fs.writeJson(versionJsonPath, versionJson);


        sendTaskUpdate(task, 'writing profile settings', 2/2);
        const clientJar = path.join(dir, `${realName}.jar`);
        if (!await fs.pathExists(clientJar))
            await fs.copy(path.join(installDir, 'versions', forge.minecraftVersion, `${forge.minecraftVersion}.jar`), clientJar);

        await downloadVanillaLibraries(versionJson.libraries, task);
        //https://files.minecraftforge.net/maven/net/minecraftforge/forge/1.14.2-26.0.12/forge-1.14.2-26.0.12-universal.jar

        // Now for the extra stuff that the installer does.
        const installerJson = JSON.parse(forge.installProfileJson);

        await downloadVanillaLibraries(installerJson.libraries, task);
        const clientDataPathSource = path.join(libDir, 'net', 'minecraftforge', 'forge', `${forge.minecraftVersion}-${forge.forgeVersion}`, `forge-${forge.minecraftVersion}-${forge.forgeVersion}-clientdata.lzma`);
        const clientDataPathTarget = path.join(installDir, '../', 'temp', 'data', 'client.lzma');
        await fs.copy(clientDataPathSource, clientDataPathTarget);
        await fs.remove(clientDataPathSource);

        await forgeProcessors(installerJson.processors, installerJson.data, forge.minecraftVersion, task);
        await fs.remove(clientDataPathTarget);
    } else {
        versionJson.jar = forge.minecraftVersion;

        // Install matching vanilla version
        await this.installVanilla(forge.minecraftVersion, task);

        // Write version json
        sendTaskUpdate(task, 'writing version settings', 1);
        const versionJsonPath = path.join(dir, `${realName}.json`);
        if (!await fs.pathExists(versionJsonPath))
            await fs.writeJson(versionJsonPath, versionJson);

        await downloadForgeLibraries(versionJson.libraries, task);
    }
};

//todo needs face lift
exports.installFabric = async (version, mappings, loader, libCallback) => {
    const name = `fabric-${loader}-${mappings}`;
    const dir = path.join(installDir, 'versions', name);

    await fs.mkdirs(dir);

    const url = `${FABRIC_LOADER}/${loader}/fabric-loader-${loader}.json`;
    console.log(url);
    const versionJson = await (await fetch(url)).json();
    versionJson.id = name;
    versionJson.inheritsFrom = version;
    await this.installVersion(version, libCallback);
    await this.installLibraries(versionJson.libraries, libCallback);
    await fs.ensureFile(path.join(dir, `${name}.jar`));
    await fs.writeJson(path.join(dir, `${name}.json`), versionJson, { spaces: 4 });
};

//todo decide the fate of this, probably removed.
exports.installLibraries = async (libraries, callback) => {
    let libs = [];
    if (libraries.common !== undefined) {
        // This is a set of Fabric libraries.
        libs = libs.concat(libraries.common);
        libs = libs.concat(libraries.client);
    } else
        // This is either Forge or Vanilla.
        libs = libs.concat(libraries);

    const count = libs.length;
    for (let i = 0; i < libs.length; i++) {
        const library = libs[i];
        const sendCallback = () => {
            if (callback) callback({
                    name: library.name,
                    index: i + 1,
                    count,
                });
        };
        if (library.downloads == null) {
            // This is a Forge or Fabric library and needs to be downloaded from Maven.
            if (library.serverreq && !library.clientreq) {
                // This is a forge library and specifically a server lib, so we dont need it.
                sendCallback();
                continue;
            }

            await downloadMavenArtifact(library);
            sendCallback();
        } else {
            // This is a Vanilla library which provides the download link, but there are some native ones.
            const global = library.downloads.artifact;
            const native = library.natives == null ? null : library.downloads.classifiers[aliases[platform]];

            if (global !== undefined) {
                await downloadLibraryArtifact(global);
                sendCallback();
            }
            if (native !== undefined) {
                await downloadLibraryArtifact(native);
                sendCallback();
            }
            //todo catch download fails and try again.
        }
    }
};

//todo decide the fate of this, probably removed.
const downloadLibraryArtifact = async (artifact) => {
    if (artifact == null)
        return;
    let filePath = artifact.path;
    if (filePath === undefined) {
        let tmp = artifact.url.replace('https://libraries.minecraft.net/', '');
        filePath = tmp.substring(0, tmp.lastIndexOf('/'));
    }
    const file = path.join(libDir, filePath);
    if (await fs.pathExists(file))
        return;
    await files.download(artifact.url, file);
};

//todo decide the fate of this, probably removed
const downloadMavenArtifact = async (artifact) => {
    const baseUrl = artifact.url == null ? 'https://repo1.maven.org/maven2/' : artifact.url;
    const name = artifact.name.split(':');
    const url = `${baseUrl}${name[0].split('.').join('/')}/${name[1]}/${name[2]}/${name[1]}-${name[2]}.jar`;
    const file = path.join(libDir, name[0].split('.').join('/'), name[1], name[2], `${name[1]}-${name[2]}.jar`);

    if (await fs.pathExists(file))
        return;
    await files.download(url, file);
};

// Helper Functions

const validateGameAssets = (task, objects) => {
    return workers.createWorker(task, { objects, installDir }, async props => {
        const path = require('path');
        const fs = require('fs-extra');
        const files = require('../util/files');

        const keys = Object.keys(props.objects);
        const objectDir = path.join(props.installDir, 'assets', 'objects');
        let complete = 0, total = keys.length;

        for (let i = 0; i < keys.length; i++) {
            const object = props.objects[keys[i]];
            console.log(`Processing ${keys[i]}`);
            const file = path.join(objectDir, object.hash.substring(0, 2), object.hash.substring(2));
            if (!(await fs.pathExists(file) && (await files.fileChecksum(file, 'sha1')) === object.hash)) {
                console.log(`Downloading ${keys[i]}`);
                await files.download(`https://resources.download.minecraft.net/${object.hash.substring(0, 2)}/${object.hash}`, file);
            } else console.log(`Found valid version of ${keys[i]} with matching checksum.`);
            props.updateTask('validating game assets', ++complete/total);
        }
        props.complete();
    });
};

const validateTypeOneLibraries = (task, taskName, libraries) => {
    return workers.createWorker(task, { libraries, taskName }, async props => {

    });
};

const validateTypeTwoLibraries = (task, taskName, libraries) => {
    return workers.createWorker(task, { libraries, taskName }, async props => {

    });
};

const downloadVanillaLibraries = (libraries, task) => {
    return new Promise(resolve => {
        console.log('Creating worker...');
        const workerWindow = new BrowserWindow({ show: config.getValue('app/developerMode'), title: 'Proton Worker', webPreferences: { nodeIntegration: true } });
        ipcMain.once('workers:libraries:vanilla', () => {
            workerWindow.close();
            resolve();
        });
        ipcMain.on('workers:libraries:vanilla:task', (event, data) => {
            sendTaskUpdate(task, data.task, data.progress);
        });
        workerWindow.loadURL(`file://${__dirname}/worker/libraries-vanilla.html`).then(() => {
            workerWindow.webContents.send('workers:libraries:vanilla', {
                libraries,
                installDir
            });
        });
    });
};

const downloadForgeLibraries = (libraries, task) => {
    return new Promise(resolve => {
        console.log('Creating worker...');
        const workerWindow = new BrowserWindow({ show: config.getValue('app/developerMode'), title: 'Proton Worker', webPreferences: { nodeIntegration: true } });
        ipcMain.once('workers:libraries:forge', () => {
            workerWindow.close();
            resolve(); //todo these need to be unregistered, they are a memory leak.
        });
        ipcMain.on('workers:libraries:forge:task', (event, data) => {
            sendTaskUpdate(task, data.task, data.progress);
        });
        workerWindow.loadURL(`file://${__dirname}/worker/libraries-forge.html`).then(() => {
            workerWindow.webContents.send('workers:libraries:forge', {
                libraries,
                installDir
            });
        });
    });
};

const forgeProcessors = (processors, vars, mcVersion, task) => {
    return new Promise(resolve => {
        console.log('Creating worker (fp)...');
        const workerWindow = new BrowserWindow({ show: config.getValue('app/developerMode'), title: 'Proton Worker', webPreferences: { nodeIntegration: true } });
        ipcMain.once('workers:forge:processors', () => {
            workerWindow.close();
            resolve();
        });
        ipcMain.on('workers:forge:processors:task', (event, data) => {
            sendTaskUpdate(task, data.task, data.progress);
        });
        workerWindow.loadURL(`file://${__dirname}/worker/forge-processors.html`).then(() => {
            workerWindow.webContents.send('workers:forge:processors', {
                processors,
                vars,
                mcVersion,
                installDir
            });
        });
    });
};
