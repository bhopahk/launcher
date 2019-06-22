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

exporst.findLibraryPath = target => {
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
    return path.join(parts[1], parts[2], `${parts[1]}-${parts[2]}${extension}`);
};

//todo this
const findMainClass = async file => {
    const parentDir = path.join(file, '../');
    const fileName = path.basename(file);
    const fileNameNoExt = path.basename(file, '.jar');
    await files.unzip(path.join(parentDir, fileName), false);
    const lines = (await fs.readFile(path.join(parentDir, fileNameNoExt, 'META-INF', 'MANIFEST.MF'))).toString('utf8').split(require('os').EOL);
    let mainClass;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('Main-Class')) {
            mainClass = lines[i].replace('Main-Class: ', '');
            break;
        }
    }
    await fs.remove(path.join(parentDir, fileNameNoExt));
    return mainClass;
};
