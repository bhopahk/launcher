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

const { app, ipcMain } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config/config');

const baseDir = app.getPath('userData');
const themeDir = path.join(baseDir, 'themes');

let theme;
config.getValue('personalization/theme').then(val => val.value).then(async value =>
    theme = await this.loadTheme(value));

ipcMain.on('sync', async () => {
    await fs.mkdirs(themeDir);
    const defaultPath = path.join(themeDir, 'default.json');
    if (!await fs.pathExists(defaultPath))
        await fs.copy(path.join(__dirname, 'default.json'), defaultPath);
});

// IPC API
ipcMain.on('theme', event => event.returnValue = theme);

/**
 * A method to get a theme based on the file.
 *
 * The default theme from `./default.json` will be loaded on error.
 *
 * @since 0.2.25
 *
 * @param {string} name The name of the theme.
 * @return {Promise<string>} CSS variable declaration.
 */
exports.loadTheme = async name => {
    const themePath = path.join(themeDir, `${name}.json`);
    if (!await fs.pathExists(themePath)) {
        console.log(`Failed to load theme '${name}': Unable to locate theme file. (${themePath})`);
        return this.loadStaticDefault();
    }
    const parsed = this.parseTheme(await fs.readJson(themePath));
    if (parsed.error) {
        console.log(`Failed to load theme '${name}': ${parsed.errorMessage}`);
        return this.loadStaticDefault();
    }
    return parsed;
};

/**
 * Load the default theme from `./default.json`.
 *
 * @since 0.2.25
 *
 * @return {Promise<string>} CSS variable declaration.
 */
exports.loadStaticDefault = async () => {
    const parsed = this.parseTheme(await fs.readJson(path.join(__dirname, 'default.json')));
    if (parsed.error)
        throw `Error loading static default theme: ${parsed.errorMessage}`;
    return parsed;
};

/**
 * Parse a given theme json.
 *
 * An error will be returned if the format is invalid.
 *
 * @since 0.2.25
 *
 * @param json The theme json to parse.
 * @return {string|{errorMessage: string, error: string}} CSS variable declaration or an error.
 */
exports.parseTheme = json => {
    if (!json.color)
        return { error: 'invalid', errorMessage: 'Missing required color section of theme json.' };
    let theme = ':root {';
    Object.keys(json.color).forEach(color => {
        if (color === '__comment')
            return;
        const value = json.color[color];
        if (value.charAt(0) !== '#')
            return { error: 'char', errorMessage: `Missing pound sign for color '${color}'` };
        if (value.length !== 7 && value.length !== 9)
            return { error: 'length', errorMessage: `Invalid hex length for color '${color}'` };
        theme = `${theme} --${color}:${value};`
    });
    return `${theme} }`;
};
