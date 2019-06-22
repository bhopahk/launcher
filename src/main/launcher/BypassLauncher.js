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

const { app } = require('electron');
const profile = require('../needsHome/profile');
const config = require('../config/config');
const updater = require('../app/updater');
const cache = require('../game/versionCache');
const path = require('path');
const fs = require('fs-extra');
const StreamZip = require('node-stream-zip');

const baseDir = app.getPath('userData');
const osName = {
    win32: 'windows',
    darwin: 'osx',
    linux: 'linux',
    sunos: 'linux',
    openbsd: 'linux',
    android: 'linux',
    aix: 'linux',
}[process.platform];

/**
 * Launch Minecraft without the use of any Mojang launcher.
 *
 * @since 0.2.3
 */
class BypassLauncher {
    constructor(profile) {
        this.profileName = profile;
        this.nativeDirectory = path.join(app.getPath('temp'), `proton-mc-natives-${uniqueId(5)}`);
        //todo this should come from config VVV
        this.javaPath = `"C:\\Users\\Matt Worzala\\AppData\\Roaming\\proton\\Install\\runtime\\jre-x64\\bin\\javaw.exe"`;
    }

    launch = async () => {
        this.profile = await profile.getProfile(this.profileName);
        await fs.mkdirs(this.nativeDirectory);
        const versionJson = await fs.readJson(path.join(baseDir, 'Install', 'versions', this.profile.targetVersion, `${this.profile.targetVersion}.json`));
        console.log(`Extracting natives to ${this.nativeDirectory}`);

        for (const library of versionJson.libraries) {
            if (!library.natives || !library.natives[osName])
                continue;
            const nativePath = path.join(baseDir, 'Install', 'libraries', library.downloads.classifiers[library.natives[osName]].path);
            const exclusions = library.extract ? library.extract.exclude : [];
            await new Promise(resolve => {
                const zip = new StreamZip({ file: nativePath, storeEntries: true });
                zip.on('ready', async () => {
                    for (const entry of Object.values(zip.entries())) {
                        let valid = true;
                        for (const exclusion of exclusions)
                            if (entry.name.startsWith(exclusion))
                                valid = false;
                        if (!valid)
                            continue;
                        if (entry.name.indexOf('.') === -1)
                            await fs.mkdirs(path.join(this.nativeDirectory, entry.name));
                        zip.extract(entry.name, path.join(this.nativeDirectory, entry.name), err => resolve(console.log(`Extracted ${entry.name}`)));
                    }
                });
            });
        }

        // Construct required variables for launch arguments.
        let envars = {};
        envars.auth_player_name = '3640'; //todo accounts
        envars.auth_uuid = 'aceb326fda1545bcbf2f11940c21780c'; //todo accounts
        envars.auth_access_token = ''; //todo accounts
        envars.version_name = this.profile.targetVersion;
        envars.game_directory = `${this.profile.directory}`;
        envars.assets_root = `${path.join(baseDir, 'Install', 'assets')}`;
        envars.assets_index_name = versionJson.assets;
        envars.user_type = 'mojang'; // When is this different? Demo users?
        envars.version_type = 'snapshot'; //todo this needs to be accurate.
        envars.natives_directory = this.nativeDirectory;
        envars.launcher_name = 'proton';
        envars.launcher_version = updater.CURRENT;
        envars.resolution_width = this.profile.resolution.width;
        envars.resolution_height = this.profile.resolution.height;
        envars.classpath = '"';
        envars.features = {};
        envars.features.is_demo_user = false;
        envars.features.has_custom_resolution = true;
        envars.os = {};
        envars.os.name = osName;
        envars.os.version = require('os').release();
        envars.os.arch = process.arch;

        for (const library of versionJson.libraries) {
            if (!library.downloads || !library.downloads.artifact || !library.downloads.artifact.path)
                continue;
            envars.classpath += path.join(baseDir, 'Install', 'libraries', library.downloads.artifact.path) + ';';
        }
        envars.classpath += path.join(baseDir, 'Install', 'versions', this.profile.targetVersion, `${this.profile.targetVersion}.jar`);
        envars.classpath += '"';

        let args = [];

        // JVM Arguments
        for (const arg of versionJson.arguments.jvm) {
            const processed = prepareArgument(envars, arg);
            if (Array.isArray(processed))
                args = args.concat(processed);
            else args.push(processed);
        }

        // Extra arguments
        // args.push(`-Xmx${this.profile.memory.max}m`);
        args.push(`-Xmx1024m`);
        args.push(`-Xms${this.profile.memory.min}m`);
        args.push(`-Dminecraft.applet.TargetDirectory="${this.profile.directory}"`);
        args.push('-Dfml.ignorePatchDiscrepancies=true');
        args.push('-Dfml.ignoreInvalidMinecraftCertificates=true');
        args.push('-Duser.language=en'); //todo this should come from language setting
        args.push('-Duser.country=US'); //todo this should come from language setting

        // Logger
        args.push(versionJson.logging.client.argument.replace('${path}', path.join(baseDir, 'Install', 'assets', 'log_configs', versionJson.logging.client.file.id)));

        // Main Class - This could be an alternate launch wrapper ;)
        args.push(versionJson.mainClass);

        // Game Arguments
        for (const arg of versionJson.arguments.game) {
            const processed = prepareArgument(envars, arg);
            if (Array.isArray(processed))
                args = args.concat(processed);
            else args.push(processed);
        }

        // Added arguments from profile
        this.profile.javaArgs.split(' ').forEach(arg => args.push(arg));

        console.log('LAUNCHING');
        console.log(JSON.stringify(this.profile));
        // console.log(JSON.stringify(args));
        await fs.writeFile('C:\\Users\\Matt Worzala\\Desktop\\cmd15.txt', args.join(' '));

        const spawn = require('child_process').spawn;
        this.process = spawn('C:\\Program Files (x86)\\Java\\jre1.8.0_181\\bin\\java.exe', args, {
            stdio: [ 'ignore', 'pipe', 'pipe' ]
        });

        this.process.stdout.setEncoding('UTF-8');
        this.process.stderr.setEncoding('UTF-8');

        this.process.stdout.on('data', data => {
            console.log('stdout: ' + data);
        });

        this.process.stderr.on('data', data => {
            console.log('stderr: ' + data);
        });

        this.process.on('close', code => console.log(`Process exited with code ${code}`));
    }
}

const prepareArgument = (envars, argument) => {
    if (typeof argument === 'string') {
        let processed = argument;
        Object.keys(envars).forEach(envar => processed = processed.replace(`\${${envar}}`, envars[envar]));
        // if (processed.includes('Windows 10'))
            // processed = '-Dos.name="Windows 10"'; //todo temporary fix
        // return processed.includes(' ') && !processed.includes('guava') ? `"${processed}"` : processed; //todo this is a bad check
        return processed;
    } else {
        let valid = true;
        for (const rule of argument.rules) {
            if (rule.os) {
                for (const os of Object.keys(rule.os))
                    if (!envars.os[os].match(rule.os[os]))
                        valid = false;
            } else if (rule.features) {
                for (const feature of Object.keys(rule.features))
                    if (envars.features[feature] !== rule.features[feature])
                        valid = false;
            }
            valid = rule.action === 'allow' ? valid : !valid;
        }
        if (!valid)
            return [];
        if (Array.isArray(argument.value))
            return argument.value.map(value => prepareArgument(envars, value));
        else return prepareArgument(envars, argument.value);
    }
};

const uniqueId = length => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', cLen = characters.length;
    for (let i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * cLen));
    return result;
};

module.exports = BypassLauncher;
