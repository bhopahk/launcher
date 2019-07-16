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
 * A launcher and manager for individual game instances.
 *
 * @since 0.1.5
 */

const { app } = require('electron');
const profiles = require('../needsHome/profile');
const artifact = require('../util/artifact');
const config = require('../config/config');
const sendSnack = require('../main').sendSnack;
const accounts = require('../mojang/accounts');
const java = require('../config/java');
const updater = require('../app/updater');
const path = require('path');
const fs = require('fs-extra');
const StreamZip = require('node-stream-zip');
const xmlJs = require('xml-js');
const spawn = require('child_process').spawn;

const baseDir = app.getPath('userData');
const tempDir = app.getPath('temp');
const osName = {
    win32: 'windows',
    darwin: 'osx',
    linux: 'linux',
    sunos: 'linux',
    openbsd: 'linux',
    android: 'linux',
    aix: 'linux',
}[process.platform];

exports.launchProfile = async (profile) => {

    await profiles.updateProfile(profile.name, { played: new Date().getTime() });
    await launchMinecraft(profile);
};

/**
 * Launches an instance of the Minecraft client.
 *
 * @since 0.2.19
 *
 * @param profile The profile JSON to launch.
 * @return {Promise<void>} Completion - Called when the process has been started.
 */
const launchMinecraft = async (profile) => {
    const account = await accounts.getSelectedAccount();
    if (account == null) {
        sendSnack({
            body: 'No valid Minecraft account could be found!'
        });
        console.log('Attempted to launch Minecraft without a valid account!');
        return;
    }

    const nativeDirectory = path.join(tempDir, `proton-mc-natives-${uniqueId(5)}`);
    await fs.mkdirs(nativeDirectory);
    const versionJson = await fs.readJson(path.join(baseDir, 'Install', 'versions', profile.targetVersion, `${profile.targetVersion}.json`));
    let inheritedVersionJson;
    if (versionJson.inheritsFrom)
        inheritedVersionJson = await fs.readJson(path.join(baseDir, 'Install', 'versions', versionJson.inheritsFrom, `${versionJson.inheritsFrom}.json`));
    console.debug(`Extracting natives to ${nativeDirectory}`);

    let allLibraries = versionJson.libraries;
    if (inheritedVersionJson)
        allLibraries = allLibraries.concat(inheritedVersionJson.libraries);
    for (const library of allLibraries) {
        if (!library.natives || !library.natives[osName])
            continue;

        const nativePath = path.join(baseDir, 'Install', 'libraries', library.downloads.classifiers[library.natives[osName]].path);
        const exclusions = library.extract ? library.extract.exclude : [];
        const name = await new Promise(resolve => {
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
                        await fs.mkdirs(path.join(nativeDirectory, entry.name));
                    zip.extract(entry.name, path.join(nativeDirectory, entry.name), err => resolve(entry.name));
                }
            });
        });
        console.debug(`Extracted ${name}`)
    }

    // Construct required variables for launch arguments.
    let envars = {};
    // Vanilla
    envars.auth_player_name = account.username;
    envars.auth_uuid = account._id.replace(/-/g, '');
    envars.auth_access_token = account.token;
    envars.version_name = profile.targetVersion;
    envars.game_directory = `${profile.directory}`;
    envars.assets_root = `${path.join(baseDir, 'Install', 'assets')}`;
    envars.assets_index_name = inheritedVersionJson ? inheritedVersionJson.assets : versionJson.assets;
    envars.user_type = 'mojang'; // When is this different? Demo users?
    envars.version_type = versionJson.type;
    envars.natives_directory = nativeDirectory;
    envars.launcher_name = 'proton';
    envars.launcher_version = updater.CURRENT;
    envars.resolution_width = profile.resolution.width;
    envars.resolution_height = profile.resolution.height;
    // envars.classpath = 'C:\\Users\\Matt Worzala\\Desktop\\launchwrapper-1.0.jar;';
    envars.classpath = '';
    envars.minecraft_jar = inheritedVersionJson ? path.join(baseDir, 'Install', 'versions', inheritedVersionJson.id, `${inheritedVersionJson.id}.jar`) : '';
    envars.features = {};
    envars.features.is_demo_user = false;
    envars.features.has_custom_resolution = true;
    envars.os = {};
    envars.os.name = osName;
    envars.os.version = require('os').release();
    envars.os.arch = process.arch;
    // Fabric
    // Forge

    const noPatchy = !await config.getValue('defaults/patchy');
    let libraries = versionJson.libraries;
    if (inheritedVersionJson)
        libraries = libraries.concat(inheritedVersionJson.libraries);
    for (const library of libraries) {
        if (library.name.includes('patchy') && noPatchy)
            continue;
        if (!library.downloads || !library.downloads.artifact || !library.downloads.artifact.path) {
            if (library.clientreq !== false)
                envars.classpath += path.join(baseDir, 'Install', 'libraries', artifact.findLibraryPath(library.name)) + ';';
        } else {
            if (library.rules && library.rules[0].os) {
                if (library.rules[0].os.name !== envars.os.name)
                    continue;
            }

            const lib = path.join(baseDir, 'Install', 'libraries', library.downloads.artifact.path);
            if (!envars.classpath.includes(lib))
                envars.classpath += lib + ';';
        }
    }
    if (inheritedVersionJson)
        envars.classpath += path.join(baseDir, 'Install', 'versions', inheritedVersionJson.id, `${inheritedVersionJson.id}.jar`) + ';';
    if (versionJson.jar)
        envars.classpath += path.join(baseDir, 'Install', 'versions', versionJson.jar, `${versionJson.jar}.jar`);
    else if (profile.flavor !== 'fabric')
        envars.classpath += path.join(baseDir, 'Install', 'versions', profile.targetVersion, `${profile.targetVersion}.jar`);
    envars.classpath += '';

    let args = [];

    // JVM Arguments
    let jvmArguments = [];
    if (versionJson.arguments && versionJson.arguments.jvm)
        jvmArguments = jvmArguments.concat(versionJson.arguments.jvm);
    if (inheritedVersionJson && inheritedVersionJson.arguments && inheritedVersionJson.arguments.jvm)
        jvmArguments = jvmArguments.concat(inheritedVersionJson.arguments.jvm);
    if (jvmArguments.length === 0)
        jvmArguments.push(
            '-Djava.library.path=${natives_directory}',
            '-Dminecraft.launcher.brand=${launcher_name}',
            '-Dminecraft.launcher.version=${launcher_version}',
            '-Dminecraft.client.jar=${minecraft_jar}',
            '-cp',
            '${classpath}'
        );
    for (const arg of jvmArguments) {
        const processed = prepareArgument(envars, arg);
        if (Array.isArray(processed))
            args = args.concat(processed);
        else args.push(processed);
    }

    // Extra arguments
    args.push(`-Xmx${profile.memory.max}m`);
    // args.push(`-Xmx1024m`);
    args.push(`-Xms${profile.memory.min}m`);
    args.push(`-Dminecraft.applet.TargetDirectory=${profile.directory}`);
    args.push('-Dfml.ignorePatchDiscrepancies=true');
    args.push('-Dfml.ignoreInvalidMinecraftCertificates=true');
    args.push('-Duser.language=en'); //todo this should come from language setting
    args.push('-Duser.country=US'); //todo this should come from language setting

    // Logger
    let loggerDefinition = versionJson.logging === undefined || versionJson.logging.client === undefined ? inheritedVersionJson : versionJson;
    args.push(loggerDefinition.logging.client.argument.replace('${path}', path.join(baseDir, 'Install', 'assets', 'log_configs', loggerDefinition.logging.client.file.id)));

    // Main Class
    // args.push(`-Dminecraft.launchwrapper=${versionJson.mainClass}`);
    // args.push('me.bhop.proton.launchwrapper.LaunchWrapper');
    args.push(versionJson.mainClass);

    // Game Arguments
    let gameArguments = [];
    if (versionJson.minecraftArguments)
        gameArguments = versionJson.minecraftArguments.split(' ');
    else {
        if (versionJson.arguments.game)
            gameArguments = gameArguments.concat(versionJson.arguments.game);
        if (inheritedVersionJson && inheritedVersionJson.arguments.game)
            gameArguments = gameArguments.concat(inheritedVersionJson.arguments.game);
    }
    for (const arg of gameArguments) {
        const processed = prepareArgument(envars, arg);
        if (Array.isArray(processed))
            args = args.concat(processed);
        else args.push(processed);
    }

    // Added arguments from profile
    profile.javaArgs.split(' ').forEach(arg => args.push(arg));

    console.log('LAUNCHING');

    const javaInstance = await java.getSelectedJavaInstance();
    if (javaInstance.error) {
        sendSnack({ body: javaInstance.errorMessage });
        console.log('Failed to start Minecraft for `' + javaInstance.error + '`');
        await fs.remove(nativeDirectory);
        return;
    }
    const javaExecutable = path.join(javaInstance.path, 'bin', java.getOsDefaultJavaExecutable());

    this.process = spawn(javaExecutable, args, {
        stdio: [ 'ignore', 'pipe', 'pipe' ],
        cwd: profile.directory,
    });

    this.process.stdout.setEncoding('UTF-8');
    this.process.stderr.setEncoding('UTF-8');

    const handleMessage = raw => {
        let message = {};
        try {
            const json = xmlJs.xml2js(raw);
            message.thread = json.elements[0].attributes.thread;
            message.level = json.elements[0].attributes.level;
            message.text = json.elements[0].elements[0].elements[0].cdata;
        } catch (e) {
            console.log(raw);
            return;
        }
        console.log(`Minecraft // ${message.level} : ${message.text}`);
    };

    this.process.stdout.on('data', handleMessage);
    this.process.stderr.on('data', handleMessage);
    this.process.on('close', async code => {
        console.log(`Process exited with code ${code}`);
        await fs.remove(nativeDirectory);
    });

};

const prepareArgument = (envars, argument) => {
    if (typeof argument === 'string') {
        let processed = argument;
        Object.keys(envars).forEach(envar => processed = processed.replace(`\${${envar}}`, envars[envar]));
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
