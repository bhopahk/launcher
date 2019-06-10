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

describe('forge installation tests', () => {
    const path = require('path');
    describe('library path conversion', () => {
        const libDir = path.join('C:\\Launcher\\Directory\\', 'Install', 'libraries');

        it('should convert [net.minecraft:client:1.14.2:slim]', () =>
            assert.strictEqual(findLibraryPath(libDir, '[net.minecraft:client:1.14.2:slim]'), 'C:\\Launcher\\Directory\\Install\\libraries\\net\\minecraft\\client\\1.14.2\\client-1.14.2-slim.jar'));
        it('should convert com.github.jponge:lzma-java:1.3', () =>
            assert.strictEqual(findLibraryPath(libDir, 'com.github.jponge:lzma-java:1.3'), 'C:\\Launcher\\Directory\\Install\\libraries\\com\\github\\jponge\\lzma-java\\1.3\\lzma-java-1.3.jar'));
        it('should convert [de.oceanlabs.mcp:mcp_config:1.14.2-20190603.175704@zip]', () =>
            assert.strictEqual(findLibraryPath(libDir, '[de.oceanlabs.mcp:mcp_config:1.14.2-20190603.175704@zip]'), 'C:\\Launcher\\Directory\\Install\\libraries\\de\\oceanlabs\\mcp\\mcp_config\\1.14.2-20190603.175704\\mcp_config-1.14.2-20190603.175704.zip'));
        it('should convert [de.oceanlabs.mcp:mcp_config:1.14.2-20190603.175704:mappings@txt]', () =>
            assert.strictEqual(findLibraryPath(libDir, '[de.oceanlabs.mcp:mcp_config:1.14.2-20190603.175704:mappings@txt]'), 'C:\\Launcher\\Directory\\Install\\libraries\\de\\oceanlabs\\mcp\\mcp_config\\1.14.2-20190603.175704\\mcp_config-1.14.2-20190603.175704-mappings.txt'));

        const findLibraryPath = (libDir, target) => {
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
            const folderGroup = path.join(libDir, parts[0].split('.').join('/'));
            return path.join(folderGroup, parts[1], parts[2], `${parts[1]}-${parts[2]}${extension}`);
        };
    });
    describe('main class locator', () => {

    });
});
