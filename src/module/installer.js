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
                if (exists)
                    return resolve(false);
                return fs.mkdirs(dir)
                    .then(() => {
                        return fetch(`https://addons-ecs.forgesvc.net/api/minecraft/version/${version}`)
                            .then(json => {
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
        return fs.exists(dir)
            .then(exists => {
                if (exists)
                    return resolve(false);
                return fs.mkdirs(dir)
                    .then(() => {
                        return fetch(`https://addons-ecs.forgesvc.net/api/minecraft/modloader/${version}`)
                            .then(json => {
                                let version = JSON.parse(json.versionJson);
                                version.jar = json.minecraftVersion;
                                return this.installVersion(json.minecraftVersion, libCallback)
                                    .then(count => {
                                        return fs.writeJson(path.join(dir, `${json.name}.json`), version, { spaces: 4 })
                                            .then(() => resolve(count))
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
    return new Promise((resolve => {
        const count = libraries.length;
        let index = 0;
        libraries.forEach(library => { //todo check hash as well as size after downloading to ensure it is the correct file & downloaded successfully.
            let dl = library.natives == null ? library.downloads.artifact : library.downloads.classifiers[aliases[platform]];
            if (dl == null)
                dl = library.downloads.artifact;
            const alt = dl === library.downloads.artifact ? null : library.downloads.artifact;
            return downloadLibraryArtifact(dl)
                .then(() => {
                    return downloadLibraryArtifact(alt) //todo add a failure catch to retry download once and then if it fails twice notify through a callback or something.
                        .then(() => {
                            index++;
                            if (callback)
                                callback({
                                    name: library.name,
                                    index, count,
                                });
                            if (count === index)
                                resolve(count);
                        }).catch(reject);
                }).catch(reject);
        });
    }))
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
