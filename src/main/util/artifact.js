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

const path = require('path');
const ZipStream = require('node-stream-zip');

exports.findLibraryPath = target => {
    if (target.includes('['))
        target = target.substring(1, target.length - 1);
    const parts = target.split(':');
    let extension;
    if (parts.length === 4)
        extension = `-${parts[3].replace('@', '.')}`;
    else if (parts[2].includes('@')) {
        extension = `.${parts[2].substring(parts[2].indexOf('@') + 1)}`;
        parts[2] = parts[2].substring(0, parts[2].indexOf('@'));
    } else extension = '.jar';
    if (!extension.includes('.'))
        extension += '.jar';
    return path.join(parts[0].split('.').join('/'), parts[1], parts[2], `${parts[1]}-${parts[2]}${extension}`);
};

exports.findMainClass = file => new Promise((resolve, reject) => {
    const zip = new ZipStream({ file, storeEntries: true });
    zip.on('ready', () => {
        for (const entry of Object.values(zip.entries())) {
            if (!entry.name.includes('MANIFEST.MF'))
                continue;
            zip.stream(entry.name, (err, stream) => {
                if (err) return reject(err);
                let body = '';
                stream.setEncoding('utf8');
                stream.on('data', data => body += data);
                stream.on('end', () => {
                    body = body.split(require('os').EOL);
                    for (const line of body)
                        if (line.startsWith('Main-Class'))
                            resolve(line.replace('Main-Class: ', ''));
                });
            })
        }
    });
});
