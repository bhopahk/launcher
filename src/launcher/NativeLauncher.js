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

const EventEmitter = require('events').EventEmitter;

const spawn = require('child_process').spawn;
const path = require('path');

const aliases = {
    win32: 'exe',
    darwin: '',
    linux: '',
    sunos: '',
    openbsd: '',
    android: '',
    aix: '',
};

const installDir = path.join(require('electron').app.getPath('userData'), 'Install');
const launcherFile = path.join(installDir, `minecraft.${aliases[process.platform]}`);

class NativeLauncher extends EventEmitter {
    constructor() {
        super();

        this.process = spawn(launcherFile, ['--workDir', installDir], {
            stdio: [ 'ignore', 'pipe', 'pipe' ]
        });

        this.process.stdout.setEncoding('UTF-8');
        this.process.stderr.setEncoding('UTF-8');

        this.process.stdout.on('data', data => {
            this.emit('log', data.trim());
        });

        this.process.stderr.on('data', data => {
            this.emit('log', data.trim());
        });

        this.process.on('close', code => this.emit('stop', code));
    }

    unlink() {
        this.emit('disconnect');
        this.process.disconnect();
    }

    destroy() {
        this.process.abort();
    }
}

module.exports = NativeLauncher;
