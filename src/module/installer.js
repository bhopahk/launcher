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
const fetch = require('./fetch');
const platform = process.platform;

const baseDir = require('electron').app.getPath('userData');
const installDir = path.join(baseDir, 'Install');
const libDir = path.join(installDir, 'libraries');
const instanceDir = path.join(baseDir, 'Instances');

const aliases = {
    win32: 'natives-windows',
    darwin: 'natives-osx',
    linux: 'natives-linux',
    sunos: 'natives-linux',
    openbsd: 'natives-linux',
    android: 'natives-linux',
    aix: 'natives-linux',
};

exports.download = (url, location, http) => {
    let https = http
        ? require('follow-redirects').http
        : require('follow-redirects').https;
    return new Promise((resolve, reject) => {
        if (fs.existsSync(location))
            return resolve(location);
        let target = fs.createWriteStream(location);
        https.get(url, resp => {
            resp.pipe(target);
            target.on('finish', () => {
                target.close();
                resolve(location);
            });
        }).on('error', error => {
            console.log('ERRORROROWAROORORORORO');
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

exports.installBaseGame = (location, platform = 'win32', modern = true) => {

};

exports.installVersion = (version, libCallback) => {
    return new Promise((resolve, reject) => {
        const dir = path.join(installDir, 'versions', version);
        return fs.exists(dir)
            .then(exists => {
                return fs.mkdirs(dir)
                    .then(() => {
                        return fetch(`https://addons-ecs.forgesvc.net/api/minecraft/version/${version}`)
                            .then(json => {
                                if (exists)
                                    return this.installLibraries(fs.readJsonSync(path.join(dir, `${version}.json`)).libraries, libCallback)
                                        .then(libCount => resolve(libCount))
                                        .catch(reject);
                                return this.download(json.jarDownloadUrl, path.join(dir, `${version}.jar`))
                                    .then(() => {
                                        return this.download(json.jsonDownloadUrl, path.join(dir, `${version}.json`))
                                            .then(() => {
                                                return this.installLibraries(fs.readJsonSync(path.join(dir, `${version}.json`)).libraries, libCallback)
                                                    .then(libCount => resolve(libCount))
                                                    .catch(reject);
                                            }).catch(reject);
                                    }).catch(reject);
                            }).catch(reject);
                    }).catch(reject);
            }).catch(reject);
    })
};

exports.installForge = (version, libCallback) => {
    return new Promise((resolve, reject) => {
        const dir = path.join(installDir, 'versions', version);
        return fs.mkdirs(dir)
            .then(() => {
                return fetch(`https://addons-ecs.forgesvc.net/api/minecraft/modloader/${version}`)
                    .then(json => {
                        let version = JSON.parse(json.versionJson);
                        version.jar = json.minecraftVersion;
                        return this.installVersion(json.minecraftVersion, libCallback)
                            .then(count => {
                                this.installLibraries(version.libraries, libCallback)
                                    .then(newCount => {
                                        const jsonPath = path.join(dir, `${json.name}.json`);
                                        if (fs.existsSync(jsonPath))
                                            return resolve(false);
                                        return fs.writeJson(jsonPath, version, { spaces: 4 })
                                            .then(() => resolve(count + newCount))
                                            .catch(reject);
                                    }).catch(reject);
                            }).catch(reject);
                    }).catch(reject);
            }).catch(reject);
    });
};

exports.installFabric = () => {

};

exports.installLibraries = (libraries, callback) => {
    return new Promise((resolve, reject) => {
        let libs = [];
        if (libraries.common !== null) {
            // This is a set of Fabric libraries.
            libs.concat(libraries.common);
            libs.concat(libraries.client);
        } else
            // This is either Forge or Vanilla.
            libs.concat(libraries);

        let index = 0;
        const count = libraries.length;
        libs.forEach(library => {
            if (library.downloads == null) {
                // This is a Forge or Fabric library and needs to be downloaded from Maven.
                if (library.serverreq && !library.clientreq)
                    // This is a forge library and specifically a server lib, so we dont need it.
                    return;

                //todo this
            } else {
                // This is a Vanilla library which provides the download link, but there are some native ones.
                const global = library.downloads.artifact;
                const native = library.natives == null ? null : library.downloads.classifiers[aliases[platform]];

                return new Promise((resolve2) => {
                    if (global == null)
                        return resolve2();
                    return downloadLibraryArtifact(global);
                }).then(() => {
                    return new Promise(resolve2 => {
                        if (native == null)
                            return resolve2();
                        return downloadLibraryArtifact(global);
                    });
                }).catch(reject); //todo catch download fails and try again.
            }

            // Send callback
            index++;
            if (callback)
                callback({
                    name: library.name,
                    index, count,
                });
            if (count === index)
                resolve(count);
        });
    });
};

const downloadLibraryArtifact = (artifact) => {
    return new Promise((resolve, reject) => {
        if (artifact == null)
            return resolve(true);
        const file = path.join(libDir, artifact.path);
        return fs.pathExists(file)
            .then(exists => {
                if (exists)
                    return resolve(true);
                return fs.ensureFile(file)
                    .then(() => {
                        return this.download(artifact.url, file)
                            .then(() => resolve(false))
                            .catch(reject);
                    }).catch(reject);
            }).catch(reject);
    });
};

const downloadMavenArtifact = (artifact) => {

};
