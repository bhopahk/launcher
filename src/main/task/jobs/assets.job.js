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
 * Installation script for assets based on Mojang's asset directory format.
 *
 * @since 0.2.3
 */

require('../tasklogger');
const path = require('path');
const fs = require('fs-extra');
const files = require('../../util/files');
const objectDir = path.join(process.env.BASE_DIR, 'Install', 'assets', 'objects');

process.on('message', async objects => {
    await fs.mkdirs(objectDir);

    const keys = Object.keys(objects);
    for (let i = 0; i < keys.length; i++) {
        process.send({ task: 'validating game assets', progress: i/keys.length });
        console.debug(`Objects@${i + 1} is ${keys[i]}`);
        const object = objects[keys[i]];
        const file = path.join(objectDir, object.hash.substring(0, 2), object.hash.substring(2));

        if (await fs.pathExists(file)) {
            if ((await files.fileChecksum(file, 'sha1')) === object.hash) {
                console.debug(`Objects@${i + 1} exists with matching checksum (${object.hash}).`);
                continue;
            } else {
                await fs.remove(file);
                console.debug(`Objects@${i + 1} exists with an invalid checksum, it will be downloaded.`);
            }
        } else console.debug(`Objects@${i + 1} does not exist. It will be downloaded.`);
        await files.download(`https://resources.download.minecraft.net/${object.hash.substring(0, 2)}/${object.hash}`, file);
    }
    process.send({ task: 'validating game assets', progress: 1 });
    process.send({ end: true });
});
