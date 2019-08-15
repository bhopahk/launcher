import React from 'react';
import { ModpackBrowser } from '../Modpack';
import Snackbar from "../../snackbar/Snackbar";
import { TextField, Dropdown, Option } from '../../input/Input';

class CurseModpackListing extends React.Component {
    constructor(props) {
        super(props);

        this.page = 0;

        this.state = {
            sort: 'Featured',
            search: '',
            category: 0,
            mcVersion: '-',
            mcVersions: [],
            modpacks: [ ],
            loading: true,
        };

        new Promise(resolve => {
            window.ipc.send('cache:versions:keys');
            window.ipc.once('cache:versions:keys', (event, data) => resolve(data));
        }).then(keys => this.setState({ mcVersions: keys }));

        setTimeout(() => {
            window.ipc.send('curse:search', { search: this.state.search, sort: this.state.sort, category: this.state.category, mcVersion: this.state.mcVersion })
        }, 100);
    }

    componentWillMount() {
        window.ipc.on('profile:create:response', this.handleResponse);
        window.ipc.on('curse:page', this.onNextPage)
    }
    componentWillUnmount() {
        window.ipc.removeListener('profile:create:response', this.handleResponse);
        window.ipc.removeListener('curse:page', this.onNextPage)
    }

    componentWillUpdate(nextProps, nextState, nextContext) {
        if (this.state.sort === nextState.sort && this.state.search === nextState.search && this.state.category === nextState.category && this.state.mcVersion === nextState.mcVersion)
            return;
        window.ipc.send('curse:search', { search: nextState.search, sort: nextState.sort, category: nextState.category, mcVersion: nextState.mcVersion });
    }

    getNextPage = () => {
        window.ipc.send('curse:page');
        this.setState({ loading: true });
    };

    onNextPage = (event, modpacks) => {
        this.setState({ loading: false, modpacks })
    };

    onRefresh = () => {
        Snackbar.sendSnack({ body: 'Refreshing modpack listings...' });
        window.ipc.send('curse:search', { search: this.state.search, sort: this.state.sort, category: this.state.category, mcVersion: this.state.mcVersion });
    };

    clearRefresh = () =>
        this.setState({ loading: true }, () =>
            window.ipc.send('curse:search', { search: this.state.search, sort: this.state.sort, category: this.state.category, mcVersion: this.state.mcVersion }));

    handleResponse = () => {
        this.setState({
            loading: false,
        })
    };

    async installModpack(id, version) {
        // let cp = this.state.modpacks.slice();
        // for (let i = 0; i < cp.length; i++) {
        //     if (cp[i].id !== id)
        //         continue;
        //     cp[i].disabled = true;
        // }
        this.setState({
            // modpacks: cp,
            loading: true,
        });
        window.ipc.send('profile:create', {
            modpack: id,
            file: version,
        });
    }

    render() {
        return (
            <div className="modpack-browser-wrapper">
                <div className={`create-profile-cover ${this.state.loading ? '' : 'hidden'}`}>
                    <div className="lds-dual-ring"/>
                </div>
                <div className="modpack-filter">
                    <div className="search">
                        <TextField id="curseSearch" placeholder="Search..." getValue={() => this.state.search} setValue={next => this.setState({ search: next }, () => this.clearRefresh())} icon="fas fa-search" />
                    </div>
                    <div style={{ width: '175px', paddingLeft: '15px' }}>
                        <Dropdown id="curseCategory" getValue={() => this.state.category} setValue={next => this.setState({ category: next }, () => this.clearRefresh())} >
                            <Option value={0} display="All" />
                            <Option value={4475} display="Adventure and RPG" />
                            <Option value={4483} display="Combat / PvP" />
                            <Option value={4476} display="Exploration" />
                            <Option value={4482} display="Extra Large" />
                            <Option value={4487} display="FTB Official" />
                            <Option value={4479} display="Hardcore" />
                            <Option value={4473} display="Magic" />
                            <Option value={4480} display="Map Based" />
                            <Option value={4477} display="Mini Game" />
                            <Option value={4484} display="Multiplayer" />
                            <Option value={4478} display="Quests" />
                            <Option value={4474} display="Sci-Fi" />
                            <Option value={4736} display="Skyblock" />
                            <Option value={4481} display="Small / Light" />
                            <Option value={4472} display="Tech" />
                        </Dropdown>
                    </div>
                    <div style={{ width: '125px', paddingLeft: '15px' }}>
                        <Dropdown id="curseSortOrder" getValue={() => this.state.sort} setValue={next => this.setState({ sort: next }, () => this.clearRefresh())} >
                            <Option value="Featured" display="Featured" />
                            <Option value="TotalDownloads" display="Downloads" />
                            <Option value="Popularity" display="Popularity" />
                            <Option value="Name" display="Name" />
                            <Option value="Author" display="Author" />
                            <Option value={2} display="Last Updated" />
                        </Dropdown>
                    </div>
                    <div style={{ width: '125px', paddingLeft: '15px' }}>
                        <Dropdown id="curseGameVersion" getValue={() => this.state.mcVersion} setValue={next => this.setState({ mcVersion: next }, () => this.clearRefresh())} >
                            <Option value="-" display="Any" />
                            {this.state.mcVersions.map(ver => {
                                return (<Option key={ver} value={ver} display={ver} />)
                            })}
                        </Dropdown>
                    </div>
                    <div className="refresh" onClick={() => this.onRefresh()}>
                        <i className="fas fa-redo flip"/>
                    </div>
                </div>
                <ModpackBrowser modpacks={this.state.modpacks} loading={!this.state.loading} onRefresh={() => this.onRefresh()} onScrollBottom={() => {
                    if (!this.state.loading)
                        this.getNextPage();
                }} onModpackInstall={(id, version) => {this.installModpack(id, version)}} onModpackFetchVersions={(id) => {this.fetchVersions(id)}} />
            </div>
        );
    }
}

export default CurseModpackListing;
