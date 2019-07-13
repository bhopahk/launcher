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

const fs = require('fs-extra');
const StreamZip = require('node-stream-zip');
const crypto = require('crypto');

exports.download = (url, location, oneTry) => {
    let https = url.startsWith('https')
        ? require('follow-redirects').https
        : require('follow-redirects').http;
    return new Promise(async (resolve, reject) => {
        try {
            if (url === undefined)
                reject('undefined url');
            if (await fs.pathExists(location))
                await fs.remove(location);
            await fs.ensureFile(location);
            let target = fs.createWriteStream(location);
            https.get(url, resp => {
                resp.pipe(target);
                target.on('finish', () => {
                    target.close();
                    resolve(location);
                });
            }).on('error', error => {
                if (!oneTry)
                    return this.download(url, location, true);
                fs.removeSync(target);
                reject(error);
            });
        } catch (e) {
            reject(e);
        }
    });
};

exports.unzip = (file, cleanup = true) => {
    return new Promise((resolve, reject) => {
        const zip = new StreamZip({
            file,
            storeEntries: true
        });
        zip.on('error', err => reject(err));
        zip.on('ready', async () => {
            const target = file.substring(0, file.length - 4);
            await fs.mkdir(target);
            zip.extract(null, target, (err, count) => {
                zip.close();
                if (cleanup) fs.removeSync(file);
                resolve(target);
            });
        });
    });
};

exports.dLzma = async (file, cleanup = true) => {
    const compressed = await fs.readFile(file);
    const decompressed = require('lzma-purejs').decompressFile(compressed);
    await fs.writeFile(file.substring(0, file.lastIndexOf('.')), decompressed);
    if (cleanup)
        await fs.remove(file);
};

//todo needs test
exports.loadImage = async (file) => {
    const name = file.substring(file.lastIndexOf(file.indexOf('/') !== -1 ? '/' : '\\'));
    if (!/[^\s]+(\.(jpg|png|gif|bmp))/.test(name))
        return { error: 'no match', errorMessage: 'The supplied file is not a valid image.' };
    if (!await fs.pathExists(file))
        return { error: 'nonexistent', errorMessage: 'The supplied file does not exist!' };
    const image = fs.readFileSync(file);
    return {
        name: name,
        path: file,
        src: `data:image/png;base64,${image.toString('base64')}`
    };
};

exports.downloadImage = url => {
    let https = url.startsWith('https')
        ? require('follow-redirects').https
        : require('follow-redirects').http;
    return new Promise((resolve, reject) => {
        if (url === undefined)
            reject('undefined url');
        https.get(url, resp => {
            resp.setEncoding('base64');
            let body = `data:${resp.headers["content-type"]};base64,`;
            resp.on('data', data => body += data);
            resp.on('end', () => resolve(body));
        }).on('error', e => reject(e));
    });
};

exports.fileChecksum = (file, algorithm) => {
    return new Promise(async resolve => {
        if (!await fs.pathExists(file))
            resolve('');
        let hash = crypto.createHash(algorithm);
        let stream = fs.createReadStream(file);
        stream.on('data', data => hash.update(data, 'utf8'));
        stream.on('end', () => {
            stream.close();
            resolve(hash.digest('hex'))
        });
    });
};
