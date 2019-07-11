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

const log = require('electron-log');
// electron log config
log.transports.console.format = '[{h}:{i}:{s} {level}] {text}';
log.transports.file.format = '[{m}/{d}/{y} {h}:{i}:{s} {level}] {text}';
log.transports.file.maxSize = 10 * 1024 * 1024;
log.transports.file.file = process.env.BASE_DIR + `/launcher_log${process.env.IS_DEV ? '_dev' : ''}.log`;
// Use electron log for console.log calls.
console.log = (message) => {
    log.info(message);
};
console.debug = message => {
    if (process.env.DEBUG) log.debug(message);
};
