import React from 'react';
import './app.css';
import Snackbar from '../snackbar/Snackbar';
import { ModalConductor, Modal } from '../modal/Modal';
import Actions from '../actions/Actions';
import {
    Sidebar,
    SidebarHeader,
    SidebarFooter,
    SidebarGroup,
    Page, Link
} from '../sidebar/Sidebar';
import { Profiles } from '../profiles/Profiles';
import CurseModpackListing from '../modpack/provider/Curse';

import { ModpackBrowser } from '../modpack/Modpack';
import CreateProfile from "../create/CreateProfile";

class App extends React.Component {
    static snackbar = React.createRef();
    static modals = React.createRef();

    constructor(props) {
        super(props);

        window.ipc.on('argv', (event, arg) => {
            alert(arg);
        })
    }

    render() {
        return (
            <div>
                <Actions />
                <Sidebar default="custom">
                    <SidebarHeader />
                    <SidebarGroup index={0} title="library">
                        <Page id="profiles" icon="list" display="Profiles">
                            <Profiles />
                        </Page>
                        <Page id="profiles2" icon="lock" display="Coming Soon" disabled={true}>
                            <p>Profiles Alt</p>
                        </Page>
                        <Page id="profiles3" icon="lock" display="Coming Soon" disabled={true}>
                            <p>Profiles Alt Alt</p>
                        </Page>
                    </SidebarGroup>
                    <SidebarGroup index={1} title="install">
                        <Page id="recommended" icon="star" display="Recommended">
                            <ModpackBrowser error />
                        </Page>
                        <Page id="curse" icon="fire" display="Curse Modpacks">
                            <CurseModpackListing />
                        </Page>
                        <Page id="technic" icon="wrench" display="Technic Modpacks?">
                            <p>Custom Profiles</p>
                            <button onClick={() => ModalConductor.openModal('test1')}>Open Modal 1</button>
                            <button onClick={() => ModalConductor.openModal('test2')}>Open Modal 2</button>
                            <button onClick={() => window.ipc.send('argv', 'twonk')}>argv</button>
                            {/*<ModpackBrowser error />*/}
                        </Page>
                        <Page id="custom" icon="tools" display="Custom Profile">
                            <CreateProfile />
                        </Page>
                    </SidebarGroup>
                    <SidebarGroup index={2} title="quick launch">
                        <Link id="tst" icon="cube" display="Sevtech: Ages" onClick={() => {window.ipc.send('quickLaunch', { target: 123456 })}} />
                        <Link id="tst2" icon="cube" display="Stoneblock 2" onClick={() => {window.ipc.send('quickLaunch', { target: 654321 })}} />
                    </SidebarGroup>
                    <SidebarFooter />
                </Sidebar>
                <Snackbar ref={App.snackbar}/>
                <ModalConductor ref={App.modals}>
                    <Modal id="test1" className="testing">
                        <p>Hello Modal 1</p>
                    </Modal>
                    <Modal id="test2">
                        <p>Hello Modal 2</p>
                    </Modal>
                </ModalConductor>
            </div>
        );
    }
}

export default App;
