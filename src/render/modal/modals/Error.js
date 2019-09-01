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
import './error.css';
import { CloseButton } from '../../layout/window/WindowOptions';
import { Title, Paragraph } from '../../layout/Generic';
import { Button } from '../../input/Input';
import { ModalConductor } from '../Modal';

// let report = {
//     quote: 'Listen, this could be something minor. Right?',
//     lines: [
//         'TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received type object',
//         'at validateString (internal/validators.js:105:11)',
//         'at Object.join (path.js:372:7)',
//         'at findName (C:\\Users\\benny\\AppData\\Local\\Programs\\proton\\resources\\app.asar\\src\\main\\app\\profile.js:550:34)',
//         'at Object.exports.createProfile (C:\\Users\\benny\\AppData\\Local\\Programs\\proton\\resources\\app.asar\\src\\main\\app\\profile.js:135:24)',
//         'at EventEmitter.<anonymous> (C:\\Users\\benny\\AppData\\Local\\Programs\\proton\\resources\\app.asar\\src\\main\\app\\profile.js:55:55)',
//         'at EventEmitter.emit (events.js:194:13)',
//         'at WebContents.<anonymous> (C:\\Users\\benny\\AppData\\Local\\Programs\\proton\\resources\\electron.asar\\browser\\api\\web-contents.js:390:13)',
//         'at WebContents.emit (events.js:194:13)'
//     ],
//     path: 'C:\\Users\\Matt Worzala\\Documents\\launcher_log.log'
// };
let report = {
    quote: '',
    lines: [ ],
    path: ''
};

// window.ipc.on('reporter:report', (_, newReport) => {
//     report = newReport;
    // ModalConductor.openModal('errorReportModal');
// });

class ErrorReport extends React.Component {
    constructor(props) {
        super(props);
        this.state = { loading: false }
    }

    componentDidMount() {
        window.ipc.on('reporter:haste', () => this.setState({ loading: false }, () => ModalConductor.closeModals()))
    }
    componentWillUnmount() {
        window.ipc.removeAllListeners('reporter:haste');
    }

    render() {
        return (
            <div className="error-report-container">
                <CloseButton onClose={() => ModalConductor.closeModals()} />
                <Title>Error Report</Title>
                <Paragraph>"{report.quote}"</Paragraph>
                <div className="error-report-error">
                    {report.lines.map(line => (<code>{line}</code>))}
                </div>
                <div className="error-report-actions">
                    <Button onClick={() => this.setState({ loading: true }, () => window.ipc.send('reporter:haste', report.path))}>
                        Upload
                        <div className={this.state.loading ? "lds-dual-ring-small" : ""} style={{ marginLeft: this.state.loading ? '5px' : '0' }}></div>
                    </Button>
                    <Button onClick={() => window.ipc.send('open:folder', report.path)}>Open Report</Button>
                </div>
            </div>
        );
    }
}

export {
    ErrorReport
}
