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
 * Installation script for downloading 'type 2' libraries.
 * This is used for fabric and forge <1.14.
 *
 * @since 0.2.3
 */

require('../tasklogger');
const path = require('path');
const fs = require('fs-extra');
const files = require('../../util/files');
const libDir = path.join(process.env.BASE_DIR, 'Install', 'libraries');

process.on('message', async libraries => {
    await fs.mkdirs(libDir);

    const task = (i, library) => new Promise(async resolve => {
        process.send({ task: 'validating libraries', progress: i/libraries.length });
        console.debug(`Library@${i + 1} is ${library.name}.`);

        if (library.clientreq === false)
            return resolve(console.debug(`Library@${i + 1} is serverside only.`));

        const baseUrl = library.url === undefined ? 'https://repo1.maven.org/maven2/' : library.url;
        const name = library.name.split(':');
        const url = `${baseUrl}${name[0].split('.').join('/')}/${name[1]}/${name[2]}/${name[1]}-${name[2]}.jar`;
        const file = path.join(props.libDir, name[0].split('.').join('/'), name[1], name[2], `${name[1]}-${name[2]}.jar`);

        if (await fs.pathExists(file))
            return resolve(console.error(`Library@${i + 1} exists.`));
        console.error(`Library@${i + 1} does not exist, it will be downloaded.`);
        await files.download(url, file);
        resolve();
    });

    let i = 0;
    if (process.env.DO_PARALLEL)
        libraries.forEach(library => task(i, library)).then(() => {
            if (++i === libraries.length) process.send({ end: true });
        });
    else for (i = 0; i < libraries.length; i++)
        await task(i, libraries[i]);
    process.send({ end: true });
});
