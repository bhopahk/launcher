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
import { Tab } from '../sidebar';
import { flavorIcon } from "../common/helper";

export default class QuickLaunch extends React.Component {
    constructor(props) {
        super(props);

        this.state = { profiles: [] };
        window.ipc.on('profile:render', (_, profiles) =>
            this.setState({ profiles: profiles.slice(0, 5).map(({ name, flavor } ) => ({ name, flavor })) }));
    }

    render() {
        return (
            <div>
                {this.state.profiles.map(profile => {
                    return (<Tab clickable key={`${profile.name}.quick`} icon={flavorIcon(profile.flavor)} display={profile.name} onClick={() => window.ipc.send('profile:launch', profile.name)} />)
                })}
            </div>
        );
    }
}