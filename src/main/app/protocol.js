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
 * A parser and handler for the proton uri protocol.
 * Format: `proton://{service}/{data}`
 * Example 1: `proton://mmc-pack/https://github.com/AllOfFabric/AOF/releases/download/3.2.0/All.of.Fabric.3.2.0.zip`
 * Example 2: `proton://curse/{modpack:123456,file:654321}`
 *
 * @since 0.2.13
 */

const { app, ipcMain } = require('electron');
const profile = require('./profile');

// Handle `proton://` protocol.
app.setAsDefaultProtocolClient('proton');

// Quit app if there is another instance running.
const locked = app.requestSingleInstanceLock();
if (!locked) app.quit();

// Called when a new instance is created.
app.on('second-instance', (event, argv) => this.handle(argv[3]));
ipcMain.on('uri:test', (event, uri) => this.handle(uri));

/**
 * Handles a URI String.
 *
 * @since 0.2.13
 *
 * @param {String} uri_string The full URI to handle.
 * @return {Promise<void>} Completion.
 */
exports.handle = async (uri_string) => {
    const uri = uri_string.substring(9);
    const service = uri.substring(0, uri.indexOf('/'));
    const data = uri.substring(uri.indexOf('/') + 1);
    switch (service) {
        case 'mmc-pack':
            if (data.length === 0)
                return console.log('Failed to execute mmc-pack URI endpoint: invalid URL');
            await profile.createProfile({ mmc: data });
            break;
        case 'curse':
            const json = safeParse(data);
            if (json === undefined)
                return console.log('Failed to execute curse URI endpoint: invalid JSON');
            await profile.createProfile(json);
            break;
        default:
            return;
    }
    console.log(`URIService@${service} has been handled.`);
};

// Helper functions
const safeParse = string => {
    try {
        return JSON.parse(string);
    } catch (e) {}
};
