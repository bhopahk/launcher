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
 * Installation script for downloading mods for a modpack.
 * This is only used for bulk curse mod downloading.
 *
 * Props:
 * `profileDir` target profile directory
 * `mods` array of mod objects
 *
 * @since 0.2.3
 */

require('../tasklogger');
const path = require('path');
const fs = require('fs-extra');
const files = require('../../util/files');

process.on('message', async props => {
    const modsDir = path.join(props.profileDir, 'mods');
    fs.mkdirs(modsDir);

    const task = async (i, mod) => {
        console.debug(`Mod@${i + 1} is ${mod.projectID}.`);
        const name = (await (await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${mod.projectID}`)).json()).name;
        process.send({ task: `installing ${name}`, progress: i/props.mods.length });
        const fileJson = await (await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${mod.projectID}/file/${mod.fileID}`)).json();
        await files.download(fileJson.downloadUrl, path.join(modsDir, fileJson.fileName));
        console.debug(`Mod@${i + 1} has been downloaded.`);
        resolve();
    };

    let i = 0;
    if (process.env.DO_PARALLEL)
        props.mods.forEach(mod => task(i, mod)).then(() => {
            if (++i === props.mods.length) process.send({ end: true });
        });
    else for (i = 0; i < props.mods.length; i++)
        await task(i, props.mods[i]);
    process.send({ end: true });
});
