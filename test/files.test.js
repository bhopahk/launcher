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

        beforeEach(async () => await files.download(testFile, path));
        afterEach(async () => await fs.remove(path));

        it('should download a file \'testfile.txt\'', async () =>
            assert.ok(await fs.pathExists(path))
        );
        it('should download a file with non-zero size', async () =>
            assert.notStrictEqual(fs.statSync(path).size, 0)
        );
    });
    describe('unzip', () => {
        const testFile = 'https://github.com/bhopahk/launcher/blob/3aeccd9b6db0b6e58fb103402b31d13ce46a8704/test/files/zipped.zip?raw=true';
        const zippedPath = absolute('./zipped.zip');
        const unzippedPath = absolute('./zipped');
        const filePath = absolute('./zipped/zipped/testfile.txt');

        beforeEach(async () => {
            await files.download(testFile, zippedPath);
            await files.unzip(zippedPath);
        });
        afterEach(async () => await fs.remove(unzippedPath));

        it('should create a folder named \'zipped\'', async () =>
            assert.ok(await fs.pathExists(unzippedPath))
        );
        it('should create a folder with a file \'zipped/testfile.txt\'', async () =>
            assert.ok(await fs.pathExists(filePath))
        );
    });
    describe('lzma', () => {
        const testFile = 'http://launcher.mojang.com/mc/launcher/jar/fa896bd4c79d4e9f0d18df43151b549f865a3db6/launcher.jar.lzma';
        const zippedPath = absolute('./launcher.jar.lzma');
        const unzippedPath = absolute('./launcher.jar');

        beforeEach(async () => {
            await files.download(testFile, zippedPath);
            await files.dLzma(zippedPath, true);
        });
        afterEach(async () => await fs.remove(unzippedPath));

        it('should unzip \'launcher.jar.lzma\' to \'launcher.jar\'', async () =>
            assert.ok(await fs.pathExists(unzippedPath))
        );
    });
    describe('checksum', () => {
        const testFileUrl = 'https://launcher.mojang.com/v1/objects/a9358d6b2ac6025923155b46dc26cc74523ac130/client.jar';
        const testFile = './client.jar';
        const correctChecksum = 'a9358d6b2ac6025923155b46dc26cc74523ac130';

        it('should download test file', async () => {
            await files.download(testFileUrl, testFile, true);
            assert.ok(await fs.pathExists(testFile));
        });
        it('should find a matching checksum', async () => {
            const checksum = await files.fileChecksum(testFile, 'sha1');
            assert.strictEqual(checksum, correctChecksum);
            await fs.remove(testFile);
        });
    });
    describe('images', () => {
        it('should convert the url successfully', async () => {
            const url = 'https://raw.githubusercontent.com/bhopahk/launcher/master/public/icon.png';
            const real = 'data:image/png;base64,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';
            const found = await files.downloadImage(url);
            assert.strictEqual(found, real);
        })
    })
});

