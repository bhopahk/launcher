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
    })
});

