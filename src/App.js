import React from 'react';
import './app.css';
import Actions from './actions/Actions';
import {
    Sidebar,
    SidebarHeader,
    SidebarFooter,
    SidebarGroup,
    Page, Link
} from './sidebar/Sidebar';

function App() {
    return (
        <div>
            <Actions />
            <Sidebar default="profiles">
                <SidebarHeader />
                <SidebarGroup index={0} title="library">
                    <Page id="profiles" icon="list" display="Profiles">
                        <p>Profiles</p>
                    </Page>
                    <Page id="profiles2" icon="lock" display="Coming Soon" disabled={true}>
                        <p>Profiles Alt</p>
                    </Page>
                    <Page id="profiles3" icon="lock" display="Coming Soon" disabled={true}>
                        <p>Profiles Alt Alt</p>
                    </Page>
                </SidebarGroup>
                <SidebarGroup index={1} title="install">
                    <Page id="curse" icon="fire" display="Curse Modpacks">
                        <p>Curse Packs</p>
                    </Page>
                    <Page id="technic" icon="wrench" display="Technic Modpacks?">
                        <p>Technic Packs</p>
                    </Page>
                    <Page id="recommended" icon="star" display="Recommended">
                        <p>Recommended Profiles</p>
                    </Page>
                    <Page id="custom" icon="tools" display="Custom Profile">
                        <p>Custom Profiles</p>
                    </Page>
                </SidebarGroup>
                <SidebarGroup index={2} title="quick launch">
                    <Link id="tst" icon="cube" display="Sevtech: Ages" onClick={() => {window.ipc.send('quickLaunch', { target: 123456 })}} />
                    <Link id="tst2" icon="cube" display="Stoneblock 2" onClick={() => {window.ipc.send('quickLaunch', { target: 654321 })}} />
                </SidebarGroup>
                <SidebarFooter />
            </Sidebar>
        </div>
    );
}

export default App;
