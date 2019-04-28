import React from 'react';
import './App.css';
import Titlebar from '../titlebar/Titlebar';

function App() {
    return (
        <div id="wrapper">
            <Titlebar/>

            <p>I am some line</p>
            <p>Wow, I've been updated!!</p>
        </div>
    );
}

export default App;
