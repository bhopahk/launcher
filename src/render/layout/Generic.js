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
import './generic.css';

const Header = props => (
    <h1 className={`header-generic ${props.className ? props.className : ''}`}>{props.children}</h1>
);

const Title = props => (
    <h1 className={`title-generic ${props.className ? props.className : ''}`}>{props.children}</h1>
);

const Paragraph = props => (
    <p className={`paragraph-generic ${props.className ? props.className : ''}`}>{props.children}</p>
);

const Icon = props => (
    <i className={`icon ${props.icon} ${props.className}`} onClick={() => {
        if (props.onClick) props.onClick()
    }}></i>
);

const MaterialIcon = props => (
    <i className={`material-icons icon ${props.className}`} onClick={() => {
        if (props.onClick) props.onClick()
    }}>{props.icon}</i>
);

const ImageSquare = props => (<img className={props.className} style={{ width: `${props.size}px`, height: `${props.size}px` }} src={props.src} alt={props.alt} />);

export {
    Header,
    Title,
    Paragraph,
    Icon,
    MaterialIcon,
    ImageSquare
}
