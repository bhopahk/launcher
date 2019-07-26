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
 * Installation script for downloading 'type 1' libraries.
 * This is used for vanilla and forge 1.14+.
 *
 * @since 0.2.3
 */

require('../tasklogger');
const path = require('path');
const fs = require('fs-extra');
const files = require('../../util/files');
const libDir = path.join(process.env.BASE_DIR, 'Install', 'libraries');
const osName = {
    win32: 'windows',
    darwin: 'osx',
    linux: 'linux',
    sunos: 'linux',
    openbsd: 'linux',
    android: 'linux',
    aix: 'linux',
}[process.platform];

process.on('message', async libraries => {
    await fs.mkdirs(libDir);

    const task = (i, library) => new Promise(async resolve => {
        process.send({ task: 'validating libraries', progress: i/libraries.length });
        console.debug(`Library@${i + 1} is ${library.name}.`);
        if (!library.downloads)
            return resolve(console.debug(`Library@${i + 1} does not have any downloadable artifacts, it is being skipped!`));

        // Forge universal has an empty url.
        if (library.name.startsWith('net.minecraftforge:forge:') && library.name.endsWith(':universal'))
            library.downloads.artifact.url = `https://files.minecraftforge.net/maven/${library.downloads.artifact.path}`;
        // The hosted version of log4j is corrupt.
        if (library.name.startsWith('org.apache.logging.log4j:log4j-api:') || library.name.startsWith('org.apache.logging.log4j:log4j-core:'))
            library.downloads.artifact.url = `http://central.maven.org/maven2/${library.downloads.artifact.path}`;

        let valid = true;
        if (library.rules) {
            for (let i = 0; i < library.rules.length; i++) {
                if (library.rules[i].os === undefined)
                    continue;
                if ((library.rules[i].os.name !== osName && library.rules[i].action === 'allow') || library.rules[i].os.name === osName && library.rules[i].action === 'deny')
                    valid = false;
            }
        }

        if (valid && library.downloads.artifact) {
            valid = true;
            const file = path.join(libDir, library.downloads.artifact.path);
            if (await fs.pathExists(file)) {
                if ((await files.fileChecksum(file, 'sha1')) === library.downloads.artifact.sha1) {
                    console.debug(`Library@${i + 1} exists with matching checksum.`);
                    valid = false;
                } else {
                    await fs.remove(file);
                    console.debug(`Library@${i + 1} exists with an invalid checksum, it will be downloaded.`);
                }
            } else console.debug(`Library@${i + 1} does not exist. It will be downloaded.`);
            if (valid) await files.download(library.downloads.artifact.url, file);
        } else
            console.debug(`Library@${i + 1} has no (non native) libraries for the current platform.`);

        if (!library.natives || !library.natives[osName])
            return resolve();
        const native = library.natives[osName].replace(/\${arch}/g, process.arch === 'x64' ? '64' : '32');
        if (native === undefined)
            return resolve(console.debug(`Library@${i + 1} has no natives for the current platform.`));

        if (!library.downloads.classifiers[native] || !library.downloads.classifiers[native].path)
            return resolve(console.log(`Library@${i + 1} has an invalid native file! (${library.name})`));
        const nativeFile = path.join(libDir, library.downloads.classifiers[native].path);
        if (await fs.pathExists(nativeFile)) {
            if ((await files.fileChecksum(nativeFile, 'sha1')) === library.downloads.classifiers[native].sha1)
                return resolve(console.debug(`Library@${i + 1} has an existing native file with matching checksum.`));
            else {
                await fs.remove(nativeFile);
                console.debug(`Library@${i + 1} has an existing native file with an invalid checksum, it will be downloaded.`);
            }
        } else console.debug(`Library@${i + 1} is missing a native file. It will be downloaded.`);
        await files.download(library.downloads.classifiers[native].url, nativeFile);
        resolve();
    });

    let i = 0;
    let c = 0;
    if (process.env.DO_PARALLEL === 'true')
        libraries.forEach(library => task(i++, library).then(() => {
            if (++c === libraries.length) process.send({ exit: true });
        }));
    else {
        for (let i = 0; i < libraries.length; i++)
            await task(i, libraries[i]);
        process.send({ exit: true });
    }
});
