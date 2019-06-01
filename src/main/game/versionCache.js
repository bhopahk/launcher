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

const { ipcMain } = require('electron');
const fetch = require('node-fetch');
const xmlJs = require('xml-js');

// Fetch links - I would like to find a direct one for forge if possible.
const VANILLA_META = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
const FORGE_META = 'https://addons-ecs.forgesvc.net/api/minecraft/modloader';
const FABRIC_MAPPINGS = 'https://maven.fabricmc.net/net/fabricmc/yarn/';
const FABRIC_MAPPINGS_META = `${FABRIC_MAPPINGS}maven-metadata.xml`;
const FABRIC_LOADER = 'https://maven.fabricmc.net/net/fabricmc/fabric-loader/';
const FABRIC_LOADER_META = `${FABRIC_LOADER}maven-metadata.xml`;

let loaded = false;

ipcMain.on('cache:versions:keys', async event => {
    if (!loaded) {
        await loadVanilla();
        await loadForge();
        await loadFabric();
        loaded = true;
    }

    event.sender.send('cache:versions:keys', Object.keys(this.minecraft));
});

ipcMain.on('cache:versions', async (event, version) => {
    event.returnValue = this.minecraft[version];
});

ipcMain.on('cache:versions:fabric', async event => {
    if (!loaded)
        event.returnValue = {};
    else event.returnValue = this.fabric;
});

const loadVanilla = async() => {
    this.minecraft = {};
    this.minecraftOld = [];

    let current = {};

    const response = await (await fetch(VANILLA_META)).json();
    response.versions.forEach(version => {
        if (version.type === 'release') {
            if (current.hasOwnProperty('name')) {
                this.minecraft[current.name] = current;
                current = {};
            }
            current.name = version.id;
            current.url = version.url;
            current.release = new Date(version.releaseTime).getTime();
            current.snapshots = [];
            current.forge = [];
            current.fabric = [];
        } else if (version.type === 'snapshot') {
            if (!current.hasOwnProperty('name')) {
                current.name = version.id.split(' ')[0];
                current.snapshots = [];
                current.forge = [];
                current.fabric = [];
            }
            current.snapshots.push({
                name: version.id,
                url: version.url,
                release: new Date(version.releaseTime).getTime(),
                fabric: [],
            });
        } else {
            this.minecraftOld.push({
                name: version.id,
                url: version.url,
                release: new Date(version.releaseTime).getTime(),
            });
        }
    });
};

const loadForge = async () => {
    const versions = await (await fetch(FORGE_META)).json();
    versions.forEach(version => {
        this.findGameVersion(version.gameVersion).forge.push({
            id: version.name,
            recommended: version.recommended,
            release: new Date(version.dateModified).getTime(),
        });
    });
};

const loadFabric = async () => {
    this.fabric = {};

    let currentId = null;
    let current = [];

    const loader = xmlJs.xml2js(await (await fetch(FABRIC_LOADER_META)).text(), { compact: true });
    const release = loader.metadata.versioning.release._text;
    loader.metadata.versioning.versions.version.reverse().forEach(ver => {
        const version = fabricify(ver._text, FABRIC_LOADER, 'fabric-loader');
        if (currentId !== version.game) {
            if (currentId != null)
                this.fabric[currentId] = current;
            currentId = version.game;
            current = [];
        }
        current.push({
            build: version.mappings,
            url: version.url,
            raw: version.version,
            release: version.version === release,
        });
    });

    const mappingsVersion = xmlJs.xml2js(await (await fetch(FABRIC_MAPPINGS_META)).text(), { compact: true });
    mappingsVersion.metadata.versioning.versions.version.reverse().forEach(ver => {
        const version = fabricify(ver._text, FABRIC_MAPPINGS, 'yarn');
        this.findGameVersion(version.game).fabric.push(version);
    });
};

exports.findGameVersion = (version) => {
    const keys = Object.keys(this.minecraft);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (version === key)
            return this.minecraft[key];
        for (let j = 0; j < this.minecraft[key].snapshots.length; j++)
            if (this.minecraft[key].snapshots[j].name === version)
                return this.minecraft[key].snapshots[j];
    }
};

// https://github.com/FabricMC/fabric-installer/blob/master/src/main/java/net/fabricmc/installer/util/Version.java
const fabricify = (version, uri, jar) => {
    if (version.includes('+build.')) {
        return {
            version: version,
            game: version.substring(0, version.lastIndexOf('+')),
            mappings: version.substring(version.lastIndexOf('.') + 1),
            url: encodeURI(`${uri}${version}/${jar}-${version}.jar`),
        };
    } else {
        const verSep = version.includes('-') ? '-' : '.';
        return {
            version: version,
            game: version.substring(0, version.lastIndexOf(verSep)),
            mappings: version.substring(version.lastIndexOf(verSep) + 1),
            url: encodeURI(`${uri}${version}/${jar}-${version}.jar`),
        };
    }
};
