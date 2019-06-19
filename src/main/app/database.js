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

// A (partial) promise wrapper for neDB.

class Database {
    constructor(path) {
        const Datastore = require('nedb');
        this._db = new Datastore({ filename: path, autoload: true });
    }

    insert = doc => new Promise((resolve, reject) => {
        this._db.insert(doc, (err, newDoc) => {
            if (err) reject(err);
            else resolve(newDoc);
        });
    });

    find = (filter = {}) => new Promise((resolve, reject) => {
        this._db.find(filter, (err, docs) => {
            if (err) reject(err);
            else resolve(docs);
        });
    });

    findOne = (filter = {}) => new Promise((resolve, reject) => {
        this._db.findOne(filter, (err, doc) => {
            if (err) reject(err);
            else resolve(doc);
        });
    });

    count = (filter = {}) => new Promise((resolve, reject) => {
        this._db.count(filter, (err, count) => {
            if (err) reject(err);
            else resolve(count);
        });
    });

    update = (filter, update, options = {}) => new Promise((resolve, reject) => {
        this._db.update(filter, update, options, (err, numUpdated) => {
            if (err) reject(err);
            else resolve(numUpdated);
        })
    });

    remove = (filter, options = {}) => new Promise((resolve, reject) => {
        this._db.remove(filter, options, (err, numRemoved) => {
            if (err) reject(err);
            else resolve(numRemoved);
        });
    });

    index = options => new Promise((resolve, reject) => {
        this._db.ensureIndex(options, err => {
            if (err) reject(err);
            else resolve();
        })
    });
}

module.exports = Database;
