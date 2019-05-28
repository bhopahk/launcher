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
const lzma = require('lzma-purejs');
const fetch = require('./fetch/fetch');
const platform = process.platform;

const baseDir = require('electron').app.getPath('userData');
const tempDir = path.join(baseDir, 'temp');
const installDir = path.join(baseDir, 'Install');
const libDir = path.join(installDir, 'libraries');

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

exports.download = (url, location, lastTry) => {
    let https = url.startsWith('https')
        ? require('follow-redirects').https
        : require('follow-redirects').http;
    return new Promise((resolve, reject) => {
        if (fs.existsSync(location))
            return resolve(location);
        else fs.ensureFileSync(location);
        let target = fs.createWriteStream(location);
        https.get(url, resp => {
            resp.pipe(target);
            target.on('finish', () => {
                target.close();
                resolve(location);
            });
        }).on('error', error => {
            if (!lastTry)
                return this.download(url, location, true);
            fs.unlink(target);
            reject(error);
        });
    });
};

exports.unzip = (file) => {
    return new Promise((resolve, reject) => {
        const target = file.substring(0, file.length - 4);
        require('extract-zip')(file, { dir: target }, err => {
            if (err) reject(err);
            else resolve(target);
        });
    });
};

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
        await this.download('http://launcher.mojang.com/mc/launcher/jar/fa896bd4c79d4e9f0d18df43151b549f865a3db6/launcher.jar.lzma', compressedPath);
        fs.writeFileSync(launcherPath, lzma.decompressFile(fs.readFileSync(compressedPath)));
        await fs.remove(compressedPath);
        return true;
    }

    if (platform === 'win32') {
        console.log('Installing native Minecraft launcher.');
        await this.download('https://launcher.mojang.com/download/Minecraft.exe', launcherPath);
        return true;
    }
};

exports.installVersion = async (version, libCallback) => { //todo proper error handling
    const dir = path.join(installDir, 'versions', version);

    await fs.mkdirs(dir);
    const vanilla = await fetch(require('./versionCache').findGameVersion(version).url);

    await this.download(vanilla.downloads.client.url, path.join(dir, `${version}.jar`));
    await this.download(vanilla.assetIndex.url, path.join(dir, `${version}.json`));
    await this.installLibraries(vanilla.libraries, libCallback);
};

exports.installForge = async (version, libCallback) => {
    const dir = path.join(installDir, 'versions', version);

    await fs.mkdirs(dir);
    const forge = await fetch(`https://addons-ecs.forgesvc.net/api/minecraft/modloader/${version}`);
    let versionJson = JSON.parse(forge.versionJson);
    versionJson.jar = forge.minecraftVersion;

    await this.installVersion(forge.minecraftVersion, libCallback);
    await this.installLibraries(versionJson.libraries, libCallback);
    await fs.writeJson(path.join(dir, `${forge.name}.json`), versionJson, { spaces: 4 });
};

exports.installFabric = async (version, mappings, loader, libCallback) => {
    console.log(`INSTALLING FABRIC ${version} / ${mappings} / ${loader}`);
};

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
    await this.download(artifact.url, file);
};

const downloadMavenArtifact = async (artifact) => {
    const baseUrl = artifact.url == null ? 'https://repo1.maven.org/maven2/' : artifact.url;
    const name = artifact.name.split(':');
    const url = `${baseUrl}${name[0].split('.').join('/')}/${name[1]}/${name[2]}/${name[1]}-${name[2]}.jar`;
    const file = path.join(libDir, name[0].split('.').join('/'), name[1], name[2], `${name[1]}-${name[2]}.jar`);

    if (await fs.pathExists(file))
        return;
    await this.download(url, file);
};
