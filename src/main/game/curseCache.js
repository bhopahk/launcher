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
const PAGE_SIZE = 20;

let filter = {};
let modpacks = [];

// For sending to the window outside of an ipc method
let mainWindow = null;
ipcMain.once('sync', event => mainWindow = event.sender);

ipcMain.on('curse:search', (event, newFilter) => {
    newFilter.page = 0;
    filter = newFilter;
    modpacks = [];
    this.loadNextPage();
});
ipcMain.on('curse:page', () => this.loadNextPage());

exports.loadNextPage = () => {
    let current = modpacks.slice();
    fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/search?gameId=432&pageSize=${PAGE_SIZE}&index=${filter.page * PAGE_SIZE}&sort=${filter.sort}&searchFilter=${encodeURI(filter.search)}&gameVersion=${filter.mcVersion === '-' ? '' : filter.mcVersion}&categoryId=${filter.category}&sectionId=4471&sortDescending=${filter.sort === 'Name' || filter.sort === 'Author' ? 'false' : 'true'}`, {
        // headers: { "User-Agent": "Launcher (https://github.com/bhopahk/launcher/)" }
        headers: { "User-Agent": "User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) twitch-desktop-electron-platform/1.0.0 Chrome/66.0.3359.181 Twitch/3.0.16 Safari/537.36 desklight/8.40.1" }
    }).then(resp => resp.json()).then(json => {
        json.forEach(packJson => {
            let icon = '';
            let attachments = [];
            packJson.attachments.forEach(attachmentJson => {
                if (attachmentJson.isDefault)
                    icon = attachmentJson.thumbnailUrl;
                else attachments.push({
                    id: attachmentJson.id,
                    title: attachmentJson.title,
                    description: attachmentJson.description,
                    url: attachmentJson.thumbnailUrl,
                });
            });

            let categories = [];
            packJson.categories.forEach(category => {
                categories.push({
                    id: category.id,
                    name: category.name,
                    url: category.avatarUrl,
                });
            });

            let gameVersionLatestFiles = [];
            packJson.gameVersionLatestFiles.forEach(gameVersionFile => {
                gameVersionLatestFiles.push({
                    version: gameVersionFile.gameVersion,
                    defaultFile: gameVersionFile.projectFileId,
                    type: gameVersionFile.fileType,
                });
            });

            current.push({
                disabled: false,
                id: packJson.id,
                name: packJson.name,
                slug: packJson.slug,
                websiteUrl: packJson.websiteUrl,
                icon: icon,
                summary: packJson.summary,
                description: packJson.fullDescription,
                featured: packJson.isFeatured,
                popularity: packJson.popularityScore,
                downloads: packJson.downloadCount,
                modified: new Date(packJson.dateModified).getTime(),
                created: new Date(packJson.dateCreated).getTime(),
                released: new Date(packJson.dateReleased).getTime(),
                authors: packJson.authors,
                attachments: attachments,
                categories: categories,
                gameVersionLatestFiles: gameVersionLatestFiles,
                defaultFile: packJson.defaultFileId,
            });
        });

        modpacks = current;
        filter.page++;
        mainWindow.send('curse:page', modpacks);
    });
};
