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
import './overlay.css';

/**
 * Overlay for dimming background with/without a overlay icon.
 *
 * @since 0.2.25
 *
 * @property loading (String) Whether to include a overlay symbol or not.
 * @property active (Boolean: false) Show the overlay.
 * @property padding (Integer: 30) Amount of space to include around the parent element.
 * @property onClick (Function) Called when the overlay is clicked.
 */
const Overlay = props => {
    let padding = props.padding;
    if (!padding)
        padding = 30;
    return (
        <div className={`window-overlay ${props.active ? 'active' : ''}`} style={{
            left: `-${padding}px`,
            top: `-${padding}px`,
            width: `calc(100% + ${2 * padding}px)`,
            height: `calc(100% + ${2 * padding}px)`
        }} onClick={() => {
            if (props.onClick) props.onClick();
        }}>
            {props.loading ? (<div className="lds-dual-ring"></div>) : null}
        </div>
    );
};

export default Overlay;
