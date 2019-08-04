import React from 'react';
import './app.css';
import '../util/contextmenu.css';
import '../util/badge.css';
import '../layout/cards.css'
import Snackbar from '../snackbar/Snackbar';
import { ModalConductor, Modal } from '../modal/Modal';
import { ErrorReport } from '../modal/modals/Error';
import { FullWindowOptions } from '../layout/window/WindowOptions';
import {
    Sidebar,
    SidebarHeader,
    SidebarFooter,
    SidebarGroup,
    Page, Link
} from '../sidebar/Sidebar';
import { Profiles } from '../profiles/Profiles';
import { ProfileOptions } from '../profiles/ProfileOptions';
import { AccountManager } from '../account/AccountManager';
import CurseModpackListing from '../modpack/provider/Curse';

import { ModpackBrowser } from '../modpack/Modpack';
import CreateProfile from "../create/CreateProfile";

import {SettingsWrapper, Settings, Separator, Title, Subtitle} from "../settings/Settings";
import { SettingsField, SettingsSwitch } from '../settings/SettingsInput';

import { FolderSelect, Dropdown, Option, TextField, Slider, Button } from '../input/Input';
import {JavaSettings} from '../settings/JavaSettings';

class App extends React.Component {
    static snackbar = React.createRef();
    static modals = React.createRef();

    constructor(props) {
        super(props);

        this.state = {
            // Profile options target
            profile: {},
            // Quick launch profiles
            quick: [],
        };

        // Warning about pasting anything in devtools
        window.ipc.on('launcher:devtools', () => {
            console.log('%cStop!', 'color: #dc3545; font-size: 45px; text-shadow: 2px 2px black; font-weight: 900;');
            console.log('%cCopy/pasting anything here could give somebody access to your Minecraft account.', 'color: #185cc9; font-size: 15px; font-weight: bold;');
        });

        // Misc IPC listeners.
        window.ipc.on('launcher:restart', () => ModalConductor.openModal('restartModal'));
        window.ipc.on('snack:send', (event, body) => Snackbar.sendSnack(body));

        // Quick Launch
        window.ipc.on('profile:render', (event, profiles) =>
            this.setState({ quick: profiles.slice(0, 5).map(profile => { return { name: profile.name, flavor: profile.flavor } }) }));

        const settings = window.ipc.sendSync('sync');
        this.isVibrant = settings.vibrancy.value;
    }

    componentWillMount() {
        document.addEventListener('keydown', event => {
            if (event.code === 'Backquote')
                ModalConductor.openModal('devTools');
        });
    }

    static getConfigValue(path) {
        return window.ipc.sendSync('config:get', path);
    }

    static setConfigValue(path, value) {
        window.ipc.send('config:set', {
            path, value
        })
    }

    render() {
        return (
            <div className={this.isVibrant ? 'background-vibrant' : 'background-normal'} style={{ width: 'calc(100vw-300px)' }}>
                <FullWindowOptions />
                <div className={"alpha"}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <h1>Early Alpha - <span>expect bugs</span></h1>
                    <i className="fas fa-exclamation-triangle"></i>
                </div>
                <Sidebar default="profiles" vibrant={this.isVibrant}>
                    <SidebarHeader />
                    <SidebarGroup index={0} title="library">
                        <Page id="profiles" icon="list" display="Profiles">
                            <Profiles getActiveProfileOptions={() => this.state.profile.name} onProfileOptions={profile => this.setState({ profile: profile })} />
                        </Page>
                        <Page id="accounts" icon="user" display="Accounts">
                            <AccountManager />
                        </Page>
                        <Page id="profiles3" icon="lock" display="Coming Soon" disabled>
                            <p>Profiles Alt Alt</p>
                        </Page>
                    </SidebarGroup>
                    <SidebarGroup index={1} title="install">
                        <Page id="recommended" icon="star" display="Recommended" disabled>
                            <ModpackBrowser error />
                        </Page>
                        <Page id="curse" icon="fire" display="Curse Modpacks">
                            <CurseModpackListing />
                        </Page>
                        <Page id="technic" icon="wrench" display="Technic Modpacks" disabled={!window.ipc.sendSync('launcher:is_dev')}>
                            <p>Custom Profiles</p>
                        </Page>
                        <Page id="custom" icon="tools" display="Custom Profile">
                            <CreateProfile />
                        </Page>
                    </SidebarGroup>
                    <SidebarGroup index={2} title="quick launch">
                        {this.state.quick.map(profile => {
                            const flavorIcon = profile.flavor === 'fabric' ? 'scroll' : profile.flavor === 'forge' ? 'gavel' : 'cube';
                            return (<Link id={`${profile.name}.quick`} key={`${profile.name}.quick`} icon={flavorIcon} display={profile.name} onClick={() => window.ipc.send('profile:launch', profile.name)} />)
                        })}
                    </SidebarGroup>
                    <SidebarFooter />
                </Sidebar>
                <Snackbar ref={App.snackbar}/>
                <ModalConductor ref={App.modals}>
                    <Modal id="settingsModal" className="settings">
                        <SettingsWrapper default="app">
                            <Settings id="app" display="App Settings">
                                <Title>App Settings</Title>
                                <SettingsField title="Instance Directory" description="The location for profiles to be installed. Your account must have access to the folder.">
                                    <FolderSelect id="instanceDir" onMoreAction={value => window.ipc.send('open:folder', value)} />
                                </SettingsField>
                                <Title>Updates</Title>
                                <SettingsField ni title="Prerelease Builds" switch description="Enables pre release builds. They are potentially buggy, however they contain the most up-to-date fixes and features.">
                                    <SettingsSwitch id="prerelease" />
                                </SettingsField>
                                <SettingsField ni title="Interval" description="The amount of time between automatic app update checks.">
                                    <Dropdown id="checkInterval" small>
                                        <Option value={0} display="Never" description="Only check on startup." />
                                        <Option value={15} display="15" description="minutes" />
                                        <Option value={30} display="30" description="minutes" />
                                        <Option value={60} display="1" description="hour" />
                                        <Option value={120} display="2" description="hours" />
                                        <Option value={180} display="3" description="hours" />
                                    </Dropdown>
                                </SettingsField>
                                <Title>Advanced</Title>
                                <SettingsField title="Parallel Downloads" switch description="Allows the launcher to download many files at once, this speeds up the download process significantly, however it is not recommended for slow internet connections.">
                                    <SettingsSwitch id="parallelDownloads" />
                                </SettingsField>
                                <SettingsField title="Background Vibrancy" switch description="Enable at your own risk. It is not guarenteed to work, and it will specifically not work on linux. Requires a restart to apply.">
                                    <SettingsSwitch id="vibrancy" />
                                </SettingsField>
                                <SettingsField title="Developer Mode" switch description="Enables some extra options and menus for testing. This should not be enabled unless confident or instructed by a developer.">
                                    <SettingsSwitch id="developerMode" />
                                </SettingsField>
                            </Settings>
                            <Settings id="java" display="Java">
                                <Title>Java Settings</Title>
                                <JavaSettings/>
                            </Settings>
                            <Settings id="defaults" display="Profile Defaults">
                                <Title>Profile Defaults</Title>
                                <Subtitle>These settings will be applied to all profiles by default, however they can be changed on a per profile basis. Changes will not apply to profiles which are already created.</Subtitle>
                                <SettingsField title="Resolution" description="The default resolution for profiles to launch with.">
                                    <Dropdown id="resolution" small>
                                        <Option value="1920x1080" display="1920x1080" description="Recommended" />
                                        <Option value="1280x720" display="1280x720" />
                                    </Dropdown>
                                </SettingsField>
                                <SettingsField title="Memory" description="SEMI IMPLEMENTED - CAN ALLOCATE MORE THAN SYSTEM HAS - The maximum amount of memory for the profile to consume.">
                                    <Slider id="maxMemory" step={128} min={256} max={16384} />
                                </SettingsField>
                                <SettingsField title="Java Arguments" description="Any additional Java arguments which will be passed into every profile by default. These can be changed for individual profiles separately.">
                                    <TextField id="javaArgs" placeholder="Enter arguments..." />
                                </SettingsField>
                                <SettingsField title="Server Blacklist" description="Enable or disable Mojang's server blacklist. With this setting disabled, you will be able to connect to blacklisted servers.">
                                    <SettingsSwitch id="patchy" />
                                </SettingsField>
                            </Settings>
                            <Settings id="rpc" display="Rich Presence">
                                <Title>Rich Presence</Title>
                                <SettingsField ni title="Enabled" description="Display a Discord rich presence for the launcher.">
                                    <SettingsSwitch id="enabled" />
                                </SettingsField>
                                <SettingsField ni title="Show Profile" description="Display which profile you are currently playing in the Discord rich presence.">
                                    <SettingsSwitch id="showProfile" />
                                </SettingsField>
                                <SettingsField beta ni title="Show Server" description="Display the IP address of the server which you are currently playing on, if you are connected to a server.">
                                    <SettingsSwitch id="showServer" />
                                </SettingsField>
                                <SettingsField beta ni title="Disable RP Mods" description="Automatically disable mods which create a conflicting rich presence when you install a profile.">
                                    <SettingsSwitch id="disableMods" />
                                </SettingsField>
                            </Settings>
                            <Separator/>
                            <Settings id="notifications" display="Notifications">
                                <Title>Notifications</Title>
                                <SettingsField title="Coming Soon..." description="This will be added in a later version of the launcher, hold tight!" />
                            </Settings>
                            <Settings id="personalization" display="Personalization">
                                <Title>Personalization</Title>
                                <SettingsField title="Theme" description="The theme file to load for styles. This should be a css file in the `themes` directory in the proton data directory. If the file is `custom_theme.css`, this field should be `custom_theme`.">
                                    <TextField id="theme" placeholder="default" />
                                </SettingsField>
                            </Settings>
                            <Settings id="language" display="Language">
                                <Title>Language</Title>
                                <SettingsField title="Coming Soon..." description="This will be added in a later version of the launcher, hold tight!" />
                            </Settings>
                            <Separator/>
                            <Settings id="privacy" display="Privacy">
                                <Title>Privacy</Title>
                                <SettingsField title="Coming Soon..." description="This will be added in a later version of the launcher, hold tight!" />
                                {/*<SettingsField title="Recommendations"*/}
                                {/*               description="Some data about modpack preferences must be stored for recommendations to be generated."*/}
                                {/*               note="If anonymous statistics are disabled, this data is only stored locally.">*/}
                                {/*    <button>View Perceived Preferences</button>*/}
                                {/*</SettingsField>*/}
                                {/*<SettingsField title="Anonymous Statistics" switch*/}
                                {/*               description="Allows anonymous data collection about the launcher. This information will be used for improving Proton's features and user experience."*/}
                                {/*               note="We will not distribute any data.">*/}
                                {/*    <SettingsSwitch id="collectData" />*/}
                                {/*</SettingsField>*/}
                            </Settings>
                            <Settings id="dangerZone" display="Danger Zone">
                                <Title>Danger Zone</Title>
                                <SettingsField title="Coming Soon..." description="This will be added in a later version of the launcher, hold tight!" />
                            </Settings>
                        </SettingsWrapper>
                    </Modal>
                    <Modal id="profileOptionsModal" className="profile-options-wrapper">
                        <ProfileOptions profile={this.state.profile} />
                    </Modal>
                    <Modal id="errorReportModal" className="error-report-wrapper">
                        <ErrorReport />
                    </Modal>
                    <Modal id="restartModal" className="error-report-wrapper" noclose>
                        <h1><span>Restart Required!</span></h1>
                        <h2>Would you like to restart now?</h2>
                        <div className="buttons">
                            <Button onClick={() => ModalConductor.openModal('settingsModal')}>No</Button>
                            <Button onClick={() => window.ipc.send('launcher:restart')}>Yes</Button>
                        </div>
                    </Modal>
                    <Modal id="devTools" className="dev-tools-wrapper">
                        <div>
                            <p>Hi! If you stumbled here by mistake, please click anywhere outside the grey window to close this.</p>
                            <button onClick={() => window.ipc.send('argv', 'twonk')}>argv</button>
                            <button onClick={() => window.ipc.send('accounts:newUser', {})}>Login Window</button>
                            <button onClick={() => window.ipc.send('reporter:test')}>Test Error Report</button>
                            <button onClick={() => window.ipc.send('launcher:restart')}>Restart Proton</button>
                            <br />
                            <button onClick={() => window.ipc.send('launch-no-launcher')}>Launch no Launcher</button>
                            <br/>
                            <input id="uriStringInput" type="text" placeholder="URI String" />
                            <button onClick={() => window.ipc.send('uri:test', document.getElementById('uriStringInput').value)}>Send String</button>
                            <br/>
                            <button onClick={() => ModalConductor.openModal('errorReportModal')}>er</button>
                            <br/>
                        </div>
                    </Modal>
                </ModalConductor>
            </div>
        );
    }
}

export default App;
