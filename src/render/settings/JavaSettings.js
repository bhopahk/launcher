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
import { Button } from '../input/Input';
import './java.css';

class JavaSettings extends React.Component {
    constructor(props) {
        super(props);

        this.folderSelect = React.createRef();

        this.state = {
            canInstallPortable: false,
            javaVersions: []
        }
    }

    componentDidMount() {
        window.ipc.on('java:render', this.handleRender);
        window.ipc.send('java:render');
        // Workaround to unsupported attribute. According to V, this is fixed but it does not seem to work.
        // https://reactjs.org/blog/2017/09/08/dom-attributes-in-react-16.html
        this.folderSelect.current.webkitdirectory = true;
    }
    componentWillUnmount() {
        window.ipc.removeListener('java:render', this.handleRender);
    }

    handleRender = (event, versions) => this.setState({ javaVersions: versions });

    select = _id => {
        const vers = this.state.javaVersions.slice();
        for (let i = 0; i < vers.length; i++)
            vers[i].selected = vers[i]._id === _id;
        this.setState({ javaVersions: vers });
        window.ipc.send('java:select', _id);
    };

    add = event => {
        if (!event.target.files[0])
            return;
        window.ipc.send('java:add', event.target.files[0].path);
    };

    remove = _id => window.ipc.send('java:remove', _id);

    install = () => window.ipc.send('java:install');

    render() {
        if (this.state.javaVersions.length === 0) return (
            <div className="java-settings">
                <div className="java-add">
                    <input type="file" ref={this.folderSelect} onChange={this.add} hidden />
                    <Button disabled={!this.state.canInstallPortable} onClick={() => this.install()}>Install Java</Button>
                    <Button onClick={() => this.folderSelect.current.click()}>Add Java Instance</Button>
                </div>
                <div className="java-none">
                    <h1><i className="fab fa-java"></i></h1>
                    <h2>No Java Versions Detected!</h2>
                    <p>Minecraft requires Java to run! If you have java, please use click <span>Add Java Instance</span> above. If not, please click <span>Install Java</span></p>
                </div>
            </div>
        ); else return (
            <div className="java-settings">
                <div className="java-add">
                    <input type="file" ref={this.folderSelect} onChange={this.add} hidden />
                    <Button disabled={!this.state.canInstallPortable} onClick={() => this.install()}>Install Java</Button>
                    <Button onClick={() => this.folderSelect.current.click()}>Add Java Instance</Button>
                </div>
                <div className="cards">
                    {this.state.javaVersions.map(ver => (
                        <div key={ver._id} className={`card java-card ${ver.selected ? 'selected' : ''}`} onClick={() => this.select(ver._id)}>
                            <Button classList="java-remove" onClick={(e) => { e.stopPropagation(); this.remove(ver._id) }}>Remove</Button>
                            <h1><i className="fab fa-java"></i>{ver.version}</h1>
                            <p>{ver.path}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export {
    JavaSettings
}
