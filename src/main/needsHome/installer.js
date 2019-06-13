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
const fabric = require('../util/fabric');
const workers = require('../worker/workers');

const baseDir = require('electron').app.getPath('userData');
const tempDir = path.join(baseDir, 'temp');
const installDir = path.join(baseDir, 'Install');
const libDir = path.join(installDir, 'libraries');
const instanceDir = config.getValue('minecraft/instanceDir');

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

    // Download assets
    await validateGameAssets(task, (await fs.readJson(assetIndex)).objects);

    // Download logger config
    const logConfig = path.join(installDir, 'assets', 'log_configs', vanilla.logging.client.file.id);
    if (!await fs.pathExists(logConfig) || (await files.fileChecksum(logConfig, 'sha1')) !== vanilla.logging.client.file.sha1)
        await files.download(vanilla.logging.client.file.url, assetIndex);

    // Download libraries
    await validateTypeOneLibraries(task, 'validating vanilla libraries', vanilla.libraries);

    return version;
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
        // Extra tasks - todo check if older versions have this as well.
        const installerJson = JSON.parse(forge.installProfileJson);

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

        const libraries = versionJson.libraries.concat(installerJson.libraries);
        await validateTypeOneLibraries(task, 'validating forge versions', libraries);

        const clientDataPathSource = path.join(libDir, 'net', 'minecraftforge', 'forge', `${forge.minecraftVersion}-${forge.forgeVersion}`, `forge-${forge.minecraftVersion}-${forge.forgeVersion}-clientdata.lzma`);
        const clientDataPathTarget = path.join(installDir, '../', 'temp', 'data', 'client.lzma');
        await fs.copy(clientDataPathSource, clientDataPathTarget);
        await fs.remove(clientDataPathSource);

        await runForgeProcessors(task, installerJson.processors, installerJson.data, forge.minecraftVersion);
        // await forgeProcessors(installerJson.processors, installerJson.data, forge.minecraftVersion, task);
        await fs.remove(clientDataPathTarget);
    } else {
        versionJson.jar = forge.minecraftVersion;

        // Write version json
        sendTaskUpdate(task, 'writing version settings', 1);
        const versionJsonPath = path.join(dir, `${realName}.json`);
        if (!await fs.pathExists(versionJsonPath))
            await fs.writeJson(versionJsonPath, versionJson);

        await validateTypeTwoLibraries(task, 'validating forge libraries', versionJson.libraries);
    }

    return realName;
};

exports.installFabric = async (mappings, loader, task) => {
    const version = fabric.fabricify(mappings);
    const versionName = `${fabric.LOADER_NAME}-${loader}-${version.version}`;
    const versionDir = path.join(installDir, 'versions', versionName);

    // Install corresponding vanilla version.
    await this.installVanilla(version.minecraftVersion, task);

    let versionJson = await fabric.getLaunchMeta(loader);
    versionJson.id = versionName;
    versionJson.inheritsFrom = version.minecraftVersion;

    versionJson.libraries.push({ name: `${fabric.PACKAGE_NAME.replace('/', '.')}:${fabric.MAPPINGS_NAME}:${version.version}`, url: fabric.MAVEN_SERVER_URL });
    versionJson.libraries.push({ name: `${fabric.PACKAGE_NAME.replace('/', '.')}:${fabric.LOADER_NAME}:${loader}`, url: fabric.MAVEN_SERVER_URL });

    const versionJsonPath = path.join(versionDir, `${versionName}.json`);
    const versionJarPath = path.join(versionDir, `${versionName}.jar`);

    // Empty jar to trick the launcher into thinking this is a valid version.
    await fs.ensureFile(versionJarPath);
    await fs.writeJson(versionJsonPath, versionJson);

    await validateTypeTwoLibraries(task, 'validating fabric libraries', versionJson.libraries);

    return versionName;
};

exports.installCurseModpack = async (task, name, fileUrl) => {
    const profileDir = path.join(instanceDir, name);
    const readDir = path => new Promise((resolve, reject) => { fs.readdir(path, (err, items) => { if (err) reject(err); else resolve(items); }); });

    const zipLoc = path.join(tempDir, `${name}.zip`);
    sendTaskUpdate(task, 'preparing', 0/2);
    await files.download(fileUrl, zipLoc);
    sendTaskUpdate(task, 'preparing', 1/2);
    const dir = await files.unzip(zipLoc);
    const manifest = await fs.readJson(path.join(dir, 'manifest.json'));
    sendTaskUpdate(task, 'preparing', 2/2);

    // Copy overrides
    const overridesDir = path.join(dir, manifest.overrides);
    const overrides = await readDir(overridesDir);
    await curseCopyOverrides(task, profileDir, overridesDir, overrides);

    // Install primary modloader
    let localVersionId;
    let forgeVersion;
    for (let i = 0; i < manifest.minecraft.modLoaders.length; i++) {
        const modloader = manifest.minecraft.modLoaders[i];
        console.log(modloader);
        if (modloader.primary) { //todo this is limited to just forge right now, will need to see what is changed to allow for fabric.
            forgeVersion = modloader.id;
            localVersionId = await this.installForge(modloader.id, task);
        }
    }
    if (localVersionId === undefined) {
        console.log('NO VALID MODLOADER HAS BEEN FOUND!!!');
        //todo this should display error and clean up.
        return;
    }

    // Download mods
    const mods = manifest.files;
    await curseInstallMods(task, profileDir, mods);

    // cleanup temporary folder.
    await fs.remove(dir);
    return {
        localVersionId,
        version: {
            version: manifest.minecraft.version,
            flavor: 'forge',
            forge: forgeVersion
        }
    };
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
    return workers.createWorker(task, { libraries, taskName, libDir }, async props => {
        const path = require('path');
        const fs = require('fs-extra');
        const files = require('../util/files');

        const osName = {
            win32: 'windows',
            darwin: 'osx',
            linux: 'linux',
            sunos: 'linux',
            openbsd: 'linux',
            android: 'linux',
            aix: 'linux',
        }[process.platform];
        let complete = 0, total = props.libraries.length;

        const callback = () => {
            props.updateTask(props.taskName, ++complete/total);
            if (complete === total)
                props.complete();
        };

        if (props.isParallel) {
            props.libraries.forEach(library => {
                new Promise(async resolve => {
                    console.log(`Validating ${library.name}`);

                    if (!library.downloads)
                        return resolve();

                    // Forge universal has an empty url.
                    if (library.name.startsWith('net.minecraftforge:forge:') && library.name.endsWith(':universal'))
                        library.downloads.artifact.url = `https://files.minecraftforge.net/maven/${library.downloads.artifact.path}`;
                    // The hosted version of log4j is corrupt.
                    if (library.name.startsWith('org.apache.logging.log4j:log4j-api:') || library.name.startsWith('org.apache.logging.log4j:log4j-core:'))
                        library.downloads.artifact.url = `http://central.maven.org/maven2/${library.downloads.artifact.path}`;

                    if (library.rules) {
                        for (let i = 0; i < library.rules.length; i++) {
                            if (library.rules[i].os === undefined)
                                continue;
                            if ((library.rules[i].os.name !== osName && library.rules[i].action === 'allow') || library.rules[i].os.name === osName && library.rules[i].action === 'deny')
                                return resolve();
                        }
                    }

                    if (library.downloads.artifact) {
                        const filePath = path.join(props.libDir, library.downloads.artifact.path);
                        if (!await fs.pathExists(filePath) || (await files.fileChecksum(filePath, 'sha1')) !== library.downloads.artifact.sha1)
                            await files.download(library.downloads.artifact.url, filePath);
                    }

                    if (!library.natives)
                        return resolve();
                    console.log(`${library.name} has a native file.`);
                    const native = library.natives[osName];
                    if (native === undefined)
                        return resolve();

                    const nativePath = path.join(props.libDir, library.downloads.classifiers[native].path);
                    if (!await fs.pathExists(nativePath) || (await files.fileChecksum(nativePath, 'sha1')) !== library.downloads.classifiers[native].sha1)
                        await files.download(library.downloads.classifiers[native].url, nativePath);

                    resolve();
                }).then(() => callback());
            });
        } else {
            libs:
            for (let i = 0; i < props.libraries.length; i++) {
                const library = props.libraries[i];
                console.log(`Validating ${library.name}`);

                if (!library.downloads) {
                    callback();
                    continue;
                }

                // Forge universal has an empty url.
                if (library.name.startsWith('net.minecraftforge:forge') && library.name.endsWith(':universal'))
                    library.downloads.artifact.url = `https://files.minecraftforge.net/maven/${library.downloads.artifact.path}`;
                // The hosted version of log4j is corrupt.
                if (library.name.startsWith('org.apache.logging.log4j:log4j-api:') || library.name.startsWith('org.apache.logging.log4j:log4j-core:'))
                    library.downloads.artifact.url = `http://central.maven.org/maven2/${library.downloads.artifact.path}`;

                if (library.rules)
                    for (let i = 0; i < library.rules.length; i++) {
                        if (library.rules[i].os === undefined)
                            continue;
                        if ((library.rules[i].os.name !== osName && library.rules[i].action === 'allow') || library.rules[i].os.name === osName && library.rules[i].action === 'deny') {
                            callback();
                            continue libs;
                        }
                    }

                if (library.downloads.artifact) {
                    const filePath = path.join(props.libDir, library.downloads.artifact.path);
                    if (!await fs.pathExists(filePath) || (await files.fileChecksum(filePath, 'sha1')) !== library.downloads.artifact.sha1)
                        await files.download(library.downloads.artifact.url, filePath);
                }

                if (!library.natives) {
                    callback();
                    continue;
                }
                console.log(`${library.name} has a native file.`);
                const native = library.natives[osName];
                if (native === undefined) {
                    callback();
                    continue;
                }

                const nativePath = path.join(props.libDir, library.downloads.classifiers[native].path);
                if (!await fs.pathExists(nativePath) || (await files.fileChecksum(nativePath, 'sha1')) !== library.downloads.classifiers[native].sha1)
                    await files.download(library.downloads.classifiers[native].url, nativePath);

                callback();
            }
        }
    });
};

const validateTypeTwoLibraries = (task, taskName, libraries) => {
    return workers.createWorker(task, { libraries, taskName, libDir }, async props => {
        const path = require('path');
        const fs = require('fs-extra');
        const files = require('../util/files');

        let complete = 0, total = props.libraries.length;
        const callback = () => {
            props.updateTask(props.taskName, ++complete/total);
            if (complete === total)
                props.complete();
        };

        if (props.isParallel) {
            props.libraries.forEach(async library => {
                new Promise(async resolve => {
                    console.log(`Validating ${library.name}`);
                    if (library.clientreq === false)
                        return resolve();

                    const baseUrl = library.url === undefined ? 'https://repo1.maven.org/maven2/' : library.url;
                    const name = library.name.split(':');
                    const url = `${baseUrl}${name[0].split('.').join('/')}/${name[1]}/${name[2]}/${name[1]}-${name[2]}.jar`;
                    const filePath = path.join(props.libDir, name[0].split('.').join('/'), name[1], name[2], `${name[1]}-${name[2]}.jar`);

                    if (!await fs.pathExists(filePath))
                        await files.download(url, filePath);

                    resolve();
                }).then(() => callback());
            });
        } else {
            for (let i = 0; i < props.libraries.length; i++) {
                const library = props.libraries[i];
                console.log(`Validating ${library.name}`);

                if (library.clientreq === false) {
                    callback();
                    continue;
                }

                const baseUrl = library.url === undefined ? 'https://repo1.maven.org/maven2/' : library.url;
                const name = library.name.split(':');
                const url = `${baseUrl}${name[0].split('.').join('/')}/${name[1]}/${name[2]}/${name[1]}-${name[2]}.jar`;
                const filePath = path.join(props.libDir, name[0].split('.').join('/'), name[1], name[2], `${name[1]}-${name[2]}.jar`);

                if (!await fs.pathExists(filePath))
                    await files.download(url, filePath);

                callback();
            }
        }
    });
};

const runForgeProcessors = (task, processors, vars, mcVersion) => {
    return workers.createWorker(task, { processors, vars, mcVersion, installDir, libDir }, async props => {
        const path = require('path');
        const fs = require('fs-extra');
        const files = require('../util/files');

        // Start helper functions
        const exec = cmd => new Promise((resolve, reject) => {
            require('child_process').exec(cmd, {maxBuffer: 1024 * 1024}, (err, stdout, stderr) => {
                if (err) reject(err);
                resolve({
                    stdout: stdout.split(require('os').EOL),
                    stderr: stderr.split(require('os').EOL)
                });
            });
        });

        const findLibraryPath = target => {
            if (target.includes('['))
                target = target.substring(1, target.length - 1);
            const parts = target.split(':');
            let extension;
            if (parts.length === 4)
                extension = `-${parts[3].replace('@', '.')}`;
            else if (parts[2].includes('@')) {
                extension = `.${parts[2].substring(parts[2].indexOf('@') + 1)}`;
                parts[2] = parts[2].substring(0, parts[2].indexOf('@'));
            } else extension = '.jar';
            if (!extension.includes('.'))
                extension += '.jar';
            const folderGroup = path.join(props.libDir, parts[0].split('.').join('/'));
            return path.join(folderGroup, parts[1], parts[2], `${parts[1]}-${parts[2]}${extension}`);
        };

        const findMainClass = async file => {
            const parentDir = path.join(file, '../');
            const fileName = path.basename(file);
            const fileNameNoExt = path.basename(file, '.jar');
            await files.unzip(path.join(parentDir, fileName), false);
            const lines = (await fs.readFile(path.join(parentDir, fileNameNoExt, 'META-INF', 'MANIFEST.MF'))).toString('utf8').split(require('os').EOL);
            let mainClass;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('Main-Class')) {
                    mainClass = lines[i].replace('Main-Class: ', '');
                    break;
                }
            }
            await fs.remove(path.join(parentDir, fileNameNoExt));
            return mainClass;
        };
        // End helper functions

        console.log('Starting forge installer...');
        let complete = -1, total = props.processors.length;
        const callback = () => {
            props.updateTask('installing forge', ++complete/total);
            if (complete === total)
                props.complete();
        };
        callback();

        let envars = {};
        const keys = Object.keys(props.vars);
        keys.forEach(key => {
            let val = props.vars[key].client;
            if (val.startsWith('/'))
                val = path.join(props.installDir, '../', 'temp', val);
            if (val.startsWith('['))
                val = findLibraryPath(val.substring(1, val.length - 1));
            envars[key] = `"${val}"`;
        });
        envars.MINECRAFT_JAR = `"${path.join(props.installDir, 'versions', props.mcVersion, `${props.mcVersion}.jar`)}"`;
        console.log('Using variables: ', envars);

        if (props.isParallel) {
            props.processors.forEach(async processor => {
                new Promise(async resolve => {

                    resolve();
                }).then(() => callback());
            });
        } else {
            for (let i = 0; i < props.processors.length; i++) {
                const processor = props.processors[i];
                const processorJar = findLibraryPath(processor.jar);

                let arguments = ['-cp', `"${processorJar};${processor.classpath.map(cp => findLibraryPath(cp)).join(';')}"`, await findMainClass(processorJar)];
                const envarKeys = Object.keys(envars);
                arguments = arguments.concat(processor.args.map(arg => {
                    for (let j = 0; j < envarKeys.length; j++)
                        if (arg.startsWith(`{${envarKeys[j]}}`))
                            return envars[envarKeys[j]];
                    if (arg.startsWith('['))
                        return `"${findLibraryPath(arg)}"`;
                    return arg;
                }));
                console.log(arguments);

                const resp = await exec(`java ${arguments.join(' ')}`);
                console.log(arguments[2], resp);

                callback();
            }
        }
    });
};

const curseCopyOverrides = (task, profileDir, overrideDir, overrides) => {
    return workers.createWorker(task, { profileDir, overrideDir, overrides }, async props => {
        const path = require('path');
        const fs = require('fs-extra');

        let complete = 0, total = props.overrides.length;
        const callback = () => {
            props.updateTask('copying overrides', ++complete/total);
            if (complete === total)
                props.complete();
        };

        if (props.isParallel) {
            props.overrides.forEach(override =>
                fs.copy(path.join(props.overrideDir, override), path.join(props.profileDir, override))
                    .then(() => callback())
            );
        } else {
            for (let i = 0; i < props.overrides.length; i++) {
                await fs.copy(path.join(props.overrideDir, props.overrides[i]), path.join(props.profileDir, props.overrides[i]));
                callback();
            }
        }
    });
};

const curseInstallMods = (task, profileDir, mods) => {
    return workers.createWorker(task, { profileDir, mods }, async props => {
        const path = require('path');
        const fs = require('fs-extra');
        const files = require('../util/files');

        let complete = 0, total = props.mods.length;
        const callback = name => {
            props.updateTask(`downloading ${name}`, ++complete/total);
            if (complete === total)
                props.complete();
        };

        if (props.isParallel) {
            props.mods.forEach(mod => {
                new Promise(async resolve => {
                    const name = (await (await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${mod.projectID}`)).json()).name;
                    const fileJson = await (await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${mod.projectID}/file/${mod.fileID}`)).json();
                    const modsDir = path.join(props.profileDir, 'mods');

                    await fs.mkdirs(modsDir);
                    await files.download(fileJson.downloadUrl, path.join(modsDir, fileJson.fileName));
                    resolve(name);
                }).then(callback);
            });
        } else {
            for (let i = 0; i < props.mods.length; i++) {
                const mod = props.mods[i];
                const name = (await (await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${mod.projectID}`)).json()).name;
                const fileJson = await (await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${mod.projectID}/file/${mod.fileID}`)).json();
                const modsDir = path.join(props.profileDir, 'mods');

                await fs.mkdirs(modsDir);
                await files.download(fileJson.downloadUrl, path.join(modsDir, fileJson.fileName));

                callback(name);
            }
        }
    });
};
