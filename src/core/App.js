import React from 'react';
import './App.css';
import Titlebar from '../titlebar/Titlebar';
import { Tabs, Tab } from '../tabs/Tabs';

function App() {
    return (
        <div id="wrapper">
            <Titlebar/>
            <Tabs default="profiles">
                <Tab name="profiles" display="PROFILES">
                    <p>profiles</p>
                </Tab>
                <Tab name="browse" display="BROWSE MODPACKS">
                    <p>browse</p>
                </Tab>
                <Tab name="create" display="CREATE PROFILE">
                    <p>create</p>
                </Tab>
                <Tab name="settings" display="SETTINGS" scroll={true}>
                    <p>settings</p>
                </Tab>
            </Tabs>
        </div>
    );
}

export default App;
