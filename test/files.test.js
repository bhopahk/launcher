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

const assert = require('assert');

describe('files.js', () => {
    const fs = require('fs-extra');
    const absolute = require('path').resolve;
    const files = require('../src/main/util/files');
    describe('download', () => {
        const testFile = 'https://raw.githubusercontent.com/bhopahk/launcher/3aeccd9b6db0b6e58fb103402b31d13ce46a8704/test/files/testfile.txt';
        const path = absolute('./testfile.txt');
        it('should download a file \'testfile.txt\'', async () => {
            await files.download(testFile, path);
            const exists = await fs.pathExists(path);
            await fs.remove(path);
            assert.strictEqual(exists, true);
        });
        it('should download a file with non-zero size', async () => {
            await files.download(testFile, path);
            const stats = fs.statSync(path).size;
            await fs.remove(path);
            assert.notStrictEqual(stats.size, 0);
        });
    });
    describe('unzip', () => {
        const testFile = 'https://github.com/bhopahk/launcher/blob/3aeccd9b6db0b6e58fb103402b31d13ce46a8704/test/files/zipped.zip?raw=true';
        const zippedPath = absolute('./zipped.zip');
        const unzippedPath = absolute('./zipped');
        const filePath = absolute('./zipped/zipped/testfile.txt');
        it('should create a folder named \'zipped\'', async () => {
            await files.download(testFile, zippedPath);
            await files.unzip(zippedPath);
            const exists = await fs.pathExists(unzippedPath);
            await fs.remove(unzippedPath);
            assert.strictEqual(exists, true);
        });
        it('should create a folder with a file \'zipped/testfile.txt\'', async () => {
            await files.download(testFile, zippedPath);
            await files.unzip(zippedPath);
            const exists = await fs.pathExists(filePath);
            await fs.remove(unzippedPath);
            assert.strictEqual(exists, true);
        });
    });
    describe('lzma', () => {
        const testFile = 'http://launcher.mojang.com/mc/launcher/jar/fa896bd4c79d4e9f0d18df43151b549f865a3db6/launcher.jar.lzma';
        const zippedPath = absolute('./launcher.jar.lzma');
        const unzippedPath = absolute('./launcher.jar');
        it('should unzip \'launcher.jar.lzma\' to \'launcher.jar\'', async () => {
            await files.download(testFile, zippedPath);
            await files.dLzma(zippedPath, true);
            const exists = await fs.pathExists(unzippedPath);
            await fs.remove(unzippedPath);
            assert.strictEqual(exists, true);
        });
    });
});

