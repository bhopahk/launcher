import React from 'react';
import ReactDOM from 'react-dom';
import './render/core/index.css';
import App from './render/core/App';

const doc = document.createElement("style");
doc.innerHTML = window.ipc.sendSync('theme');
document.head.appendChild(doc);

ReactDOM.render(<App />, document.getElementById('root'));
