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
import {Button, FolderSelect} from '../input/Input';
import './java.css';

class JavaSettings extends React.Component {
    constructor(props) {
        super(props);

        this.folderSelect = React.createRef();

        this.state = {
            javaVersions: [
                {
                    _id: '21512vqw3fawfa',
                    version: '1.8.0_121',
                    path: 'C:/Program Files (x86)/Java/1.8.0_121/',
                    selected: true
                },
                {
                    _id: '21512vq212fw3fawfa',
                    version: '11.0.3',
                    path: 'C:/Program Files (x86)/Java/11.0.3/',
                    selected: false
                }
            ]
        }
    }

    componentDidMount() {
        // Workaround to unsupported attribute. According to V, this is fixed but it does not seem to work.
        // https://reactjs.org/blog/2017/09/08/dom-attributes-in-react-16.html
        this.folderSelect.current.webkitdirectory = true;
    }

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
        const path = event.target.files[0].path;
        alert(path)
    };

    render() {
        return (
            <div className="java-settings">
                <div className="java-add">
                    <input type="file" ref={this.folderSelect} onChange={this.add} hidden />
                    <Button onClick={() => this.folderSelect.current.click()}>Add Java Instance</Button>
                </div>
                <div className="cards">
                    {this.state.javaVersions.map(ver => (
                        <div key={ver._id} className={`card java-card ${ver.selected ? 'selected' : ''}`} onClick={() => this.select(ver._id)}>
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
