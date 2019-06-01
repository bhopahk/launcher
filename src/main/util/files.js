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

exports.download = (url, location, oneTry) => {
    let https = url.startsWith('https')
        ? require('follow-redirects').https
        : require('follow-redirects').http;
    return new Promise((resolve, reject) => {
        if (fs.existsSync(location))
            return resolve(location);
        else fs.ensureFileSync(location);
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
            fs.unlink(target);
            reject(error);
        });
    });
};

exports.unzip = (file, cleanup = true) => {
    return new Promise((resolve, reject) => {
        const target = file.substring(0, file.length - 4);
        require('extract-zip')(file, { dir: target }, err => {
            if (err) reject(err);
            else {
                if (cleanup) fs.removeSync(file);
                resolve(target);
            }
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
