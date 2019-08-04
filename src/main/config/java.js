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
 * Cross platform handler to manage jvm installations.
 */

const { app, ipcMain } = require('electron');

const Database = require('../util/database');
const path = require('path');
const fs = require('fs-extra');

// Useful paths
const baseDir = app ? app.getPath('userData') : process.env.BASE_DIR;

// For sending to the window outside of an ipc method
let mainWindow = null;
if (ipcMain) {
    ipcMain.once('sync', async event => {
        mainWindow = event.sender;

        const javaLocations = getOsDefaultJavaDirectory().filter(async location => await fs.pathExists(location)).map(async location => await fs.readdir(location, { withFileTypes: true }).then(results => results.filter(dir => dir.isDirectory()).map(dir => path.join(location, dir.name))));
        let all = [];
        for (let i = 0; i < javaLocations.length; i++)
            all = all.concat(await javaLocations[i]);
        for (let i = 0; i < all.length; i++)
            await this.addJavaInstance(all[i]);
        const selected = await this.getSelectedJavaInstance();
        if (selected.error) {
            console.log('No valid java instance has been found!')
        }
    });
}

// JVM instance data store
const jvmDb = new Database(path.join(baseDir, 'jvm.db'));

// IPC Listeners
if (ipcMain) {
    ipcMain.on('java:add', async (event, file) => this.addJavaInstance(file));
    ipcMain.on('java:select', async (event, id) => this.selectJavaInstance(id));
    ipcMain.on('java:remove', (event, id) => this.removeJavaInstance(id));
    ipcMain.on('java:render', async () => mainWindow.send('java:render', await this.listJavaInstances()));
}

/**
 * Adds a java instance based on it's path.
 *
 * This uses `java -version` to fetch version info.
 * A path which is already indexed will be ignored.
 *
 * @since 0.2.3
 *
 * @param {String} location The path to the folder of the java instance.
 * @returns {Promise<Object>} The new java instance, or an error.
 */
exports.addJavaInstance = async location => {
    if (await jvmDb.findOne({ path: location }) != null)
        return { error: 'existent', errorMessage: 'The target Java instance is already available.' };
    const executable = path.join(location, 'bin', this.getOsDefaultJavaExecutable());
    if (!await fs.pathExists(executable))
        return { error: 'nonexistent', extra: executable, errorMessage: 'The target does not contain a valid Java executable.' };

    const result = (await exec(`"${executable}" -version`)).stderr[0];
    const version = result.substring(result.indexOf('"') + 1, result.lastIndexOf('"'));
    const added = await jvmDb.insert({ version, path: location, selected: false });
    await this.getSelectedJavaInstance();
    await this.renderJavaInstances();
    return added;
};

/**
 * Selects a specific Java instance to be used for launching Minecraft instances.
 *
 * @since 0.2.3
 *
 * @param id The Java instance to select.
 * @returns {Promise<void>} Completion.
 */
exports.selectJavaInstance = async id => {
    let selected = await jvmDb.findOne({ selected: true });
    if (selected) {
        selected.selected = false;
        await jvmDb.update({ selected: true }, selected);
    }

    let next = await jvmDb.findOne({ _id: id });
    next.selected = true;
    await jvmDb.update({ _id: id }, next);
    await this.renderJavaInstances();
};

/**
 * Finds the currently selected java version.
 *
 * If one is not selected, an attempt will be made to select the first instance. If none exist, an error will be returned.
 *
 * @since 0.2.3
 *
 * @returns {Promise<Object>} The currently selected java version, or an error.
 */
exports.getSelectedJavaInstance = async () => {
    const current = await jvmDb.findOne({ selected: true });
    if (current)
        return current;
    const first = await jvmDb.findOne({ });
    if (!first)
        return { error: 'no java', errorMessage: 'Please add a java instance in settings!' };
    await this.selectJavaInstance(first._id);
    first.selected = true;
    return first;
};

/**
 * Removes a java instance based on it's id.
 *
 * @since 0.2.3
 *
 * @param {String} id The id of the target java instance.
 * @returns {Promise<void>} Completion.
 */
exports.removeJavaInstance = async id => {
    await jvmDb.remove({ _id: id });
    await this.getSelectedJavaInstance();
    await this.renderJavaInstances();
};

/**
 * Gets all currently indexed Java versions
 *
 * @since 0.2.3
 *
 * @returns {Promise<Array<Object>>} All java versions.
 */
exports.listJavaInstances = () => jvmDb.find({});

/**
 * Renders instances in the settings tab.
 *
 * @since 0.2.3
 *
 * @returns {Promise<Array<Object>>}
 */
exports.renderJavaInstances = async () => {
    if (mainWindow)
        mainWindow.send('java:render', await this.listJavaInstances());
};

// Helper Functions
const getOsDefaultJavaDirectory = () => {
    switch (process.platform) {
        case "win32":
            return [ path.normalize('C:/Program Files/Java/') ];
        case "darwin":
            throw "Unsupported Operation";
        default:
            return [ path.normalize('/usr/lib/jvm/') ];
    }
};
exports.getOsDefaultJavaExecutable = () => process.platform === 'win32' ? 'java.exe' : 'java';
exports.getOsSpecificClasspathSeparator = () => process.platform === 'win32' ? ';' : ':';
const exec = cmd => new Promise((resolve, reject) => {
    require('child_process').exec(cmd, {maxBuffer: 1024 * 1024}, (err, stdout, stderr) => {
        if (err) reject(err);
        resolve({
            stdout: stdout.split(require('os').EOL),
            stderr: stderr.split(require('os').EOL)
        });
    });
});
const downloadJava = async () => {
    // https://download.java.net/openjdk/jdk8u40/ri/jdk_ri-8u40-b25-windows-i586-10_feb_2015.zip maybe
};
