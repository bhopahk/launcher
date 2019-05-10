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
import './downloads.css';

class Downloads extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            totalProgress: 0.7,
        }
    }

    render() {
        const percentage = 100 * (1 - this.state.totalProgress);

        return (
            <button id="downloads-button"> {/*arrow-alt-circle-down*/}
                <i className="fas fa-cloud-download-alt" style={{
                    background: `linear-gradient(#b5b3b3 ${percentage}%, #185cc9 ${percentage}%)`,
                    WebkitBackgroundClip: `text`
                }} onClick={() => { document.getElementById('downloads-button').classList.toggle('active') }}></i>
                <div className="downloads">
                    <h1>Tasks</h1>
                    <div className="tasks">
                        <div className="task">

                        </div>
                    </div>
                </div>
            </button>
        );
    }
}

export {
    Downloads,
}
