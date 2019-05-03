import React from 'react';
import './app.css';
// import Titlebar from '../titlebar/Titlebar';
import { Tabs, Tab } from '../NewTabs';
import Form from '../inputs/Form';
import {
    Text,
    Password,
    File,
    Switch,
    Checkbox,
    // Radio,
    // RadioOption,
    Range,
    Progress,
    Dropdown,
    DropdownOption,
    ColorPicker
} from '../inputs/Input';
import {TitleBarActions} from "../titlebar/Titlebar";
import Thumbnail from "./Thumbnail";
import logo from '../static/LauncherNoText.png'
import {Settings, SettingsPage} from "../settings/Settings";

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
                    <Form>
                        <Text id="testText" label="Text Label" />
                        <Password id="testPassword" label="Password Label" />
                        <Switch id="testSwitch" />
                        <Switch id="testSwitch2" />
                        <Checkbox id="testCheckbox" label={"Checkbox Label"} noBreak />
                        <Checkbox id="testCheckbox2" label={"Checkbox Label 2"} noBreak />
                        <Range id="testRange" min={1} max={100} />
                        <Progress id="testProgress" label="Progress Label" max={100} value={80} />
                        <Dropdown id="testDropdown" default="test3" label="Dropdown Label">
                            <DropdownOption value="test1" name="Test 1" />
                            <DropdownOption value="test2" name="Test 2" />
                            <DropdownOption value="test3" name="Test 3" />
                            <DropdownOption value="test4" name="Test 4" />
                        </Dropdown>
                        <ColorPicker id="testColor" default={"#185cc9"} />
                        <File id="testFile" label="File Label" accept="image/png, image/jpeg" />
                        <Text id="testText2" icon="search" label="Search" />
                    </Form>
                </Tab>
                <Tab name="settings" icon={true} display="settings" >
                    <Settings default="general">
                        <SettingsPage name="general" display="General">
                            <Form>
                                <Text id="testText3" label="Local Storage Text" />
                                <Text id="testText4" label="Local Storage Text 2" />
                            </Form>
                        </SettingsPage>
                        <SettingsPage name="storage" display="Storage">
                            <p>Hello page 2</p>
                        </SettingsPage>
                        <SettingsPage name="java" display="Java">
                            <p>Hello Page 3</p>
                        </SettingsPage>
                        <SettingsPage name="personalization" display="Personalization">
                            <p>Hello Page 4</p>
                        </SettingsPage>
                    </Settings>
                </Tab>
            </Tabs>
            {/*<Tabs default="profiles">*/}
            {/*    <Tab name="profiles" display="PROFILES">*/}
            {/*        <p>profiles</p>*/}

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
