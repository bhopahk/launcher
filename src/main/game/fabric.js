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

const fetch = require('node-fetch');

// Constants
exports.MAVEN_SERVER_URL = 'https://maven.fabricmc.net/';
exports.PACKAGE_NAME = 'net/fabricmc';
exports.LOADER_NAME = 'fabric-loader';
exports.MAPPINGS_NAME = 'yarn';

exports.fabricify = version => {
    let processed = {
        version: version,
        snapshot: version.includes("-pre") || version.includes("Pre-Release") || version.includes("19w") || version.includes("18w") || version.startsWith("3D"),
    };
    if (version.includes("+build.")) {
        processed.minecraftVersion = version.substring(0, version.lastIndexOf('+'));
        processed.mappingsVersion = version.substring(version.lastIndexOf('.') + 1);
    } else {
        const verSep = version.includes("-") ? '-' : '.';
        processed.minecraftVersion = version.substring(0, version.lastIndexOf(verSep));
        processed.mappingsVersion = version.substring(version.lastIndexOf(verSep) + 1);
    }
    return processed;
};

exports.getLaunchMeta = async loaderVersion => {
    let processed = {
        releaseTime: new Date().toISOString(),
        time: new Date().toISOString(),
        type: 'release',
        arguments: { game: [] },
        libraries: [],
    };

    const url = `${this.MAVEN_SERVER_URL}${this.PACKAGE_NAME}/${this.LOADER_NAME}/${loaderVersion}/${this.LOADER_NAME}-${loaderVersion}.json`;
    const meta = await (await fetch(encodeURI(url))).json();

    if (meta.mainClass.hasOwnProperty('client')) {
        processed.mainClass = meta.mainClass.client;
        processed.mainClassServer = meta.mainClass.server;
    } else processed.mainClass = meta.mainClass;

    if (meta.hasOwnProperty('launchwrapper')) {
        const clientTweaker = meta.launchwrapper.tweakers.client[0];

        processed.arguments.game.push('--tweakClass');
        processed.arguments.game.push(clientTweaker);
    }

    ['common', 'client'].forEach(side => meta.libraries[side].forEach(library => processed.libraries.push({ name: library.name, url: library.url })));
    return processed;
};
