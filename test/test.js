const assert = require('assert');

describe('files.js', () => {
    const fs = require('fs-extra');
    const files = require('../src/main/util/files');
    describe('download', () => {
        const testFile = 'https://raw.githubusercontent.com/bhopahk/launcher/master/LICENSE.md';
        const path = './TEST.md';
        it('should download a file', async () => {
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
        const testFile = '';
        it('should create a folder named ""', () => {

        });
        it('should create a file with non-zero size', () => {

        });
    });
    describe('lzma', () => {
        const testFile = 'http://launcher.mojang.com/mc/launcher/jar/fa896bd4c79d4e9f0d18df43151b549f865a3db6/launcher.jar.lzma';
        it('should unzip launcher.jar.lzma to launcher.jar', () => {

        });
        it('should create a file with non-zero size', () => {

        });
    });
});
