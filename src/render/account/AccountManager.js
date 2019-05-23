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

import React from 'react';
import './accounts.css';
import './status.css';

const HEAD_BASE_URL = 'https://mc-heads.net/avatar/';

class AccountManager extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            active: 0,
            accounts: [
                {
                    name: 'bhop_',
                    uuid: 'd79d790a-8e90-4d78-958a-780c7fadeaab',
                    lastUsed: 1558575841,
                },
                {
                    name: '3640',
                    uuid: 'aceb326f-da15-45bc-bf2f-11940c21780c',
                    lastUsed: 1558575841,
                }
            ],
        };
    }

    render() {
        const activeAccount = this.state.accounts[this.state.active];
        return (
            <div className="account-manager">
                <div className="am-content">
                    <div className="am-header">
                        <img alt="User Head" src={`${HEAD_BASE_URL}${activeAccount.uuid}`} />
                        <div className="am-header-info">
                            <h1>{activeAccount.name}</h1>
                            <h2>{activeAccount.uuid}</h2>
                        </div>
                        <div className="am-header-actions">
                        </div>
                    </div>
                    <div className="am-accounts">
                    </div>
                </div>
                <ServerStatus />
            </div>
        );
    }
}

const Account = (props) => {
    return (
        <div className="am-account">
        </div>
    );
};

class ServerStatus extends React.Component {
    constructor(props) {
        super(props);

        this.aliases = {};
        this.aliases['minecraft.net'] = 'Minecraft Website';
        this.aliases['session.minecraft.net'] = 'Session';
        this.aliases['account.mojang.com'] = 'Accounts';
        this.aliases['authserver.mojang.com'] = 'Auth Server';
        this.aliases['sessionserver.mojang.com'] = 'Session Server';
        this.aliases['api.mojang.com'] = 'Mojang API';
        this.aliases['textures.minecraft.net'] = 'Textures';
        this.aliases['mojang.com'] = 'Mojang Website';

        let startState = {};
        // unknown, green, yellow, red
        startState['minecraft.net'] = 'unknown';
        startState['session.minecraft.net'] = 'unknown';
        startState['account.mojang.com'] = 'unknown';
        startState['authserver.mojang.com'] = 'unknown';
        startState['sessionserver.mojang.com'] = 'unknown';
        startState['api.mojang.com'] = 'unknown';
        startState['textures.minecraft.net'] = 'unknown';
        startState['mojang.com'] = 'unknown';

        this.state = startState;
    }

    componentWillMount(verifier) {
        this.refreshTask = setTimeout(async () => {
            const result = await fetch('https://status.mojang.com/check').then(resp => resp.json());
            let newState = {};

            result.forEach(status => {
                const name = Object.keys(status)[0];
                newState[name] = status[name];
            });

            this.setState(newState);

            this.componentWillMount(1);
        }, verifier === 1 ? 60000 : 100);
    }

    componentWillUnmount() {
        clearTimeout(this.refreshTask);
    }

    forceRefresh() {
        let newState = {};
        newState['minecraft.net'] = 'unknown';
        newState['session.minecraft.net'] = 'unknown';
        newState['account.mojang.com'] = 'unknown';
        newState['authserver.mojang.com'] = 'unknown';
        newState['sessionserver.mojang.com'] = 'unknown';
        newState['api.mojang.com'] = 'unknown';
        newState['textures.minecraft.net'] = 'unknown';
        newState['mojang.com'] = 'unknown';
        this.setState(newState);
        clearTimeout(this.refreshTask);
        this.componentWillMount(0);
    }

    render() {
        return (
            <div className="am-statuses">
                <h1>Server Status</h1>
                {Object.keys(this.state).map(key => {
                    return (<div key={key} className={`am-status ${this.state[key]}`}>
                        <p>{this.aliases[key]}</p>
                    </div>)
                })}
                <button onClick={this.forceRefresh.bind(this)}>refresh</button>
            </div>
        );
    }
}

export {
    AccountManager,
}
