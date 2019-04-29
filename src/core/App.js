import React from 'react';
import './app.css';
// import Titlebar from '../titlebar/Titlebar';
import { Tabs, Tab } from '../NewTabs';
import Form from '../inputs/Form';
import {
    Text,
    Search,
    Password,
    TextArea,
    File,
    Switch,
    Checkbox,
    Radio,
    RadioOption,
    Range,
    Progress,
    Dropdown,
    DropdownOption,
    ColorPicker
} from '../inputs/Input';
import {TitleBarActions} from "../titlebar/Titlebar";
import Thumbnail from "./Thumbnail";
import logo from '../static/LauncherNoText.png'

function App() {
    return (
        <div id="wrapper">
            <Thumbnail id="titlebarLogo" src={logo} size={40} style={{
                position: 'absolute',
                left: '4px',
                top: '4px'
            }} />
            <TitleBarActions />
            <Tabs default="profiles" style={{
                marginLeft: '40px',
            }}>
                <Tab name="profiles" display="PROFILES" >
                    <p>Profiles</p>
                </Tab>
                <Tab name="browse" display="BROWSE MODPACKS" >
                    <p>Browse</p>
                </Tab>
                <Tab name="create" display="CREATE PROFILE" >
                    <p>Create</p>
                </Tab>
                <Tab name="settings" icon={true} display="settings" >
                    <p>Settings</p>
                </Tab>
            </Tabs>
            {/*<Tabs default="profiles">*/}
            {/*    <Tab name="profiles" display="PROFILES">*/}
            {/*        <p>profiles</p>*/}
            {/*        <Form>*/}
            {/*            <Text id="testText" label="Text Label" />*/}
            {/*            <br/>*/}
            {/*            <Password id="testPassword" label="Password Label" />*/}
            {/*            <br/>*/}
            {/*            <Switch id="testSwitch" />*/}
            {/*            <br/>*/}
            {/*            <Switch id="testSwitch2" />*/}
            {/*            <br/>*/}
            {/*            <Checkbox id="testCheckbox" label={"Checkbox Label"} />*/}
            {/*            <Checkbox id="testCheckbox2" label={"Checkbox Label 2"} />*/}
            {/*            <br/>*/}
            {/*            <Range id="testRange" min={1} max={100} />*/}
            {/*            <br/>*/}
            {/*            <Progress id="testProgress" label="Progress Label" max={100} value={80} />*/}
            {/*            <br/>*/}
            {/*            <Dropdown id="testDropdown" default="test3" label="Dropdown Label">*/}
            {/*                <DropdownOption value="test1" name="Test 1" />*/}
            {/*                <DropdownOption value="test2" name="Test 2" />*/}
            {/*                <DropdownOption value="test3" name="Test 3" />*/}
            {/*                <DropdownOption value="test4" name="Test 4" />*/}
            {/*            </Dropdown>*/}
            {/*            <br/>*/}
            {/*            <ColorPicker default={"#185cc9"} />*/}
            {/*            <br/>*/}
            {/*            <File id="testFile" label="File Label" accept="image/png, image/jpeg" />*/}
            {/*            <br/>*/}
            {/*            <Text icon="search" />*/}
            {/*        </Form>*/}
            {/*    </Tab>*/}
            {/*    <Tab name="browse" display="BROWSE MODPACKS">*/}
            {/*        <p>browse</p>*/}
            {/*    </Tab>*/}
            {/*    <Tab name="create" display="CREATE PROFILE">*/}
            {/*        <p>create</p>*/}
            {/*    </Tab>*/}
            {/*    <Tab name="settings" display="SETTINGS" scroll={true}>*/}
            {/*        <p>settings</p>*/}
            {/*    </Tab>*/}
            {/*</Tabs>*/}
        </div>
    );
}

export default App;
