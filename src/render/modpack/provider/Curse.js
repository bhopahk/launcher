import React from 'react';
import { ModpackBrowser } from '../Modpack';
import Snackbar from "../../snackbar/Snackbar";
import { TextField, Dropdown, Option } from '../../input/Input';

class CurseModpackListing extends React.Component {
    constructor(props) {
        super(props);

        this.page = 0;

        // noinspection SpellCheckingInspection
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
            this.fetchNextPage();
        }, 100);
    }

    fetchNextPage() {
        this.setState({ loading: true });
        let oldModpacks = this.state.modpacks.slice();
        fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/search?gameId=432&pageSize=20&index=${this.page * 20}&sort=${this.state.sort}&searchFilter=${encodeURI(this.state.search)}&gameVersion=${this.state.mcVersion === '-' ? '' : this.state.mcVersion}&categoryId=${this.state.category}&sectionId=4471&sortDescending=${this.state.sort === 'Name' || this.state.sort === 'Author' ? 'false' : 'true'}`, {
            // headers: { "User-Agent": "Launcher (https://github.com/bhopahk/launcher/)" }
            headers: { "User-Agent": "User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) twitch-desktop-electron-platform/1.0.0 Chrome/66.0.3359.181 Twitch/3.0.16 Safari/537.36 desklight/8.40.1" }
        }).then(resp => resp.json()).then(json => {
            json.forEach(packJson => {
                let icon = '';
                let attachments = [];
                packJson.attachments.forEach(attachmentJson => {
                    if (attachmentJson.isDefault)
                        icon = attachmentJson.thumbnailUrl;
                    else attachments.push({
                            id: attachmentJson.id,
                            title: attachmentJson.title,
                            description: attachmentJson.description,
                            url: attachmentJson.thumbnailUrl,
                        });
                });

                let categories = [];
                packJson.categories.forEach(category => {
                    categories.push({
                        id: category.id,
                        name: category.name,
                        url: category.avatarUrl,
                    });
                });

                let gameVersionLatestFiles = [];
                packJson.gameVersionLatestFiles.forEach(gameVersionFile => {
                    gameVersionLatestFiles.push({
                        version: gameVersionFile.gameVersion,
                        defaultFile: gameVersionFile.projectFileId,
                        type: gameVersionFile.fileType,
                    });
                });

                oldModpacks.push({
                    disabled: false,
                    id: packJson.id,
                    name: packJson.name,
                    slug: packJson.slug,
                    websiteUrl: packJson.websiteUrl,
                    icon: icon,
                    summary: packJson.summary,
                    description: packJson.fullDescription,
                    featured: packJson.isFeatured,
                    popularity: packJson.popularityScore,
                    downloads: packJson.downloadCount,
                    modified: new Date(packJson.dateModified).getTime(),
                    created: new Date(packJson.dateCreated).getTime(),
                    released: new Date(packJson.dateReleased).getTime(),
                    primaryAuthor: packJson.primaryAuthorName,
                    authors: packJson.authors,
                    attachments: attachments,
                    categories: categories,
                    gameVersionLatestFiles: gameVersionLatestFiles,
                    defaultFile: packJson.defaultFileId,
                });
            });

            this.setState({
                modpacks: oldModpacks,
                loading: false,
            }, () => {
                this.page++;
            });
        });
    }

    clearRefresh() {
        this.page = 0;
        this.setState({
            modpacks: [],
        }, () => {
            this.fetchNextPage();
        });
    }

    onRefresh() {
        Snackbar.sendSnack({
            body: 'Refreshing modpack listings...',
        });
        this.clearRefresh();
    }

    componentWillMount() {
        window.ipc.on('profile:create:response', this.handleResponse);
    }
    componentWillUnmount() {
        window.ipc.removeListener('profile:create:response', this.handleResponse);
    }

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
                    <div className="lds-dual-ring"></div>
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
                        <i className="fas fa-redo flip"></i>
                    </div>
                </div>
                <ModpackBrowser modpacks={this.state.modpacks} loading={!this.state.loading} onRefresh={() => this.onRefresh()} onScrollBottom={() => {
                    if (!this.state.loading)
                        this.fetchNextPage();
                }} onModpackInstall={(id, version) => {this.installModpack(id, version)}} onModpackFetchVersions={(id) => {this.fetchVersions(id)}} />
            </div>
        );
    }
}

export default CurseModpackListing;
