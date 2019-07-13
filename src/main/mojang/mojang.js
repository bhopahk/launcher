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

// A complete wrapper of the Mojang API
// Source: https://wiki.vg/Mojang_API

const fetch = require('node-fetch');

exports.apiStatus = async () => {
    const url = 'https://status.mojang.com/check';
    const resp = await (await fetch(url)).json();

    let formatted = {};
    resp.forEach(status => {
        const key = Object.keys(status)[0];
        formatted[key] = status[key];
    });
    return formatted;
};

exports.statistics = async (...keys) => {
    const url = 'https://api.mojang.com/orders/statistics';
    const validKeys = ['item_sold_minecraft', 'prepaid_card_redeemed_minecraft', 'item_sold_cobalt', 'item_sold_scrolls'];

    let payload = { metricKeys: [] };
    let invalid = false;
    keys.map(key => key.toLowerCase()).forEach(key => {
        if (validKeys.includes(key))
            payload.metricKeys.push(key);
        else invalid = true;
    });

    if (invalid)
        throw "One or more invalid keys were supplied!";
    return fetch(url, {
        method: 'post',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
    }).then(resp => resp.json());
};

// This is for completeness, I do not really see any usage for this.
exports.blockedServers = async () => {
    const url = 'https://sessionserver.mojang.com/blockedservers';
    const resp = await (await fetch(url)).text();
    return resp.split('\n');
};

// Anonymous account actions

exports.nameToUuid = async (username, time) => {
    if (!username)
        throw 'A username must be provided!';
    if (time !== undefined && isNaN(time))
        throw 'A valid time must be provided!';
    const url = `https://api.mojang.com/users/profiles/minecraft/${username}${time === undefined ? '' : `?at=${time}`}`;
    const resp = await (await fetch(url)).json();

    if (resp.hasOwnProperty('id'))
        return resp;
    throw 'A valid username must be provided!';
};

exports.batchNameToUuid = (...names) => {
    const url = 'https://api.mojang.com/profiles/minecraft';
    return fetch(url, {
        method: 'post',
        body: JSON.stringify(names),
        headers: { 'Content-Type': 'application/json' }
    }).then(resp => resp.json());
};

exports.nameHistory = async (uuid) => {
    if (uuid === undefined)
        throw 'A valid uuid must be provided';
    const url = `https://api.mojang.com/user/profiles/${uuid.replace('-', '')}/names`;
    return await (await fetch(url)).json();
};

exports.userData = async (uuid) => {
    if (uuid === undefined)
        throw 'A valid uuid must be provided';
    const url = `https://sessionserver.mojang.com/session/minecraft/profile/${uuid.replace('-', '')}`;
    const resp = await (await fetch(url)).json();

    if (resp.error)
        throw 'A valid uuid must be provided!';
    return resp;
};

// Logged in account actions
const BASE_URL = 'https://authserver.mojang.com/';

exports.login = (username, password, clientToken, requestUser) => {
    if (!clientToken)
        throw 'A valid client token must be provided';
    const url = BASE_URL + '/authenticate';
    const payload = {
        agent: {
            name: 'Minecraft',
            version: 1,
        },
        username: username,
        password: password,
        clientToken: clientToken,
        requestUser: requestUser !== undefined,
    };
    return fetch(url, {
        method: 'post',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
    }).then(resp => resp.json());
};

exports.logout = async (username, password) => {
    const url = BASE_URL + 'signout';
    const payload = {
        username: username,
        password: password,
    };
    return (await fetch(url, {
        method: 'post',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
    }).then(resp => resp.text())).length === 0;
};

exports.refreshToken = async (accessToken, clientToken, requestUser) => {
    if (!clientToken)
        throw 'A valid access token must be provided';
    const url = BASE_URL + '/refresh';
    const payload = {
        accessToken: accessToken,
        clientToken: clientToken,
        requestUser: requestUser !== undefined,
    };
    return await fetch(url, {
        method: 'post',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
    }).then(resp => resp.json());
};

exports.validateToken = async (accessToken, clientToken) => {
    const url = BASE_URL + 'validate';
    const payload = { accessToken, clientToken };
    return (await fetch(url, {
        method: 'post',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
    }).then(resp => resp.status)) === 204;
};

exports.invalidateToken = async (accessToken, clientToken) => {
    if (!clientToken)
        throw 'A valid access token must be provided';
    const url = BASE_URL + 'invalidate';
    const payload = {
        accessToken: accessToken,
        clientToken: clientToken,
    };
    const resp = await (await fetch(url, {
        method: 'post',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
    })).text();
    return resp.length === 0;
};

exports.changeSkin = async () => {
    //todo
};

exports.uploadSkin = async () => {
    //todo
};

exports.resetSkin = async () => {
    //todo
};
