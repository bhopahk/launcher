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
 * Installation script for running forge installation requirements.
 * This is for forge 1.14+ only.
 *
 * Props:
 * `mcVersion` the minecraft version to target.
 * `forgeVersion` the forge version to target.
 * `java` the path the selected java executable.
 * `vars` a map of possible variables for the processes.
 * `processors` array of processor objects.
 *
 * @since 0.2.3
 */

require('../tasklogger');
const path = require('path');
const fs = require('fs-extra');
const artifact = require('../../util/artifact');
const libDir = path.join(process.env.BASE_DIR, 'Install', 'libraries');

process.on('message', async props => {
    await fs.mkdirs(libDir);

    // Generate Environment Variables
    let envars = {};
    const keys = Object.keys(props.vars);
    keys.forEach(key => {
        let val = props.vars[key].client;
        if (val.startsWith('/'))
            val = path.join('./', val);
        if (val.startsWith('['))
            val = path.join(libDir, artifact.findLibraryPath(val.substring(1, val.length - 1)));
        envars[key] = `"${val}"`;
    });
    envars.MINECRAFT_JAR = `"${path.join(process.env.BASE_DIR, 'Install', 'versions', props.mcVersion, `${props.mcVersion}.jar`)}"`;

    const task = (i, processor) => new Promise(async resolve => {
        console.debug(`ForgeProcess@${i + 1} is ${processor.jar}`);
        process.send({ task: `installing forge`, progress: i/props.processors.length });
        const processorJar = path.join(libDir, artifact.findLibraryPath(processor.jar));

        let arguments = ['-cp', `"${processorJar};${processor.classpath.map(cp => path.join(libDir, artifact.findLibraryPath(cp))).join(';')}"`, await artifact.findMainClass(processorJar)];
        const envarKeys = Object.keys(envars);
        arguments = arguments.concat(processor.args.map(arg => {
            for (let j = 0; j < envarKeys.length; j++)
                if (arg.startsWith(`{${envarKeys[j]}}`))
                    return envars[envarKeys[j]];
            if (arg.startsWith('['))
                return `"${path.join(libDir, artifact.findLibraryPath(arg))}"`;
            return arg;
        }));

        const resp = await exec(`java ${arguments.join(' ')}`);
        console.debug(`ForgeProcess@${i + 1} has finished successfully.`);
        //todo detection of failure
        resolve(resp);
    });

    // These are required for the installer to run.
    const clientDataPathSource = path.join(libDir, 'net', 'minecraftforge', 'forge', `${props.mcVersion}-${props.forgeVersion}`, `forge-${props.mcVersion}-${props.forgeVersion}-clientdata.lzma`);
    const clientDataPathTarget = path.join('./', 'data', 'client.lzma');
    await fs.copy(clientDataPathSource, clientDataPathTarget);
    await fs.remove(clientDataPathSource);

    for (let i = 0; i < props.processors.length; i++)
        await task(i, props.processors[i]);
    await fs.remove(clientDataPathTarget);
    process.send({ exit: true });
});

const exec = cmd => new Promise((resolve, reject) => {
    require('child_process').exec(cmd, {maxBuffer: 1024 * 1024}, (err, stdout, stderr) => {
        if (err) reject(err);
        resolve({
            stdout: stdout.split(require('os').EOL),
            stderr: stderr.split(require('os').EOL)
        });
    });
});
