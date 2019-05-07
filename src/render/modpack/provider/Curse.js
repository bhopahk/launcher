import React from 'react';
import { ModpackBrowser } from '../Modpack';
import Snackbar from "../../snackbar/Snackbar";

class CurseModpackListing extends React.Component {
    constructor(props) {
        super(props);

        this.page = 0;
        this.canLoadMore = true;
        this.searchRefreshTimeout = null;

        // noinspection SpellCheckingInspection
        this.state = {
            sort: 'Featured',
            search: '',
            category: 0,
            mcVersion: '-',
            modpacks: [ ]
        };

        setTimeout(() => {
            this.fetchNextPage();
        }, 100);
    }

    fetchNextPage() {
        this.canLoadMore = false;
        let oldModpacks = this.state.modpacks.slice();
        fetch(`https://addons-ecs.forgesvc.net/api/addon/search?gameId=432&pageSize=20&index=${this.page * 20}&sort=${this.state.sort}&searchFilter=${encodeURI(this.state.search)}&categoryId=${this.state.category}&sectionId=4471&sortDescending=${this.state.sort === 'Name' || this.state.sort === 'Author' ? 'false' : true}`, {
            headers: { "User-Agent": "Launcher (https://github.com/bhopahk/launcher/)" }
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
                    featured: packJson.isFeatured === 1,
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
            }, () => {
                this.canLoadMore = true;
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

    fetchVersions(id) {
        alert(`fetching versions for ${id}`)
    }

    installModpack(id, version) {
        let cp = this.state.modpacks.slice();
        for (let i = 0; i < cp.length; i++) {
            if (cp[i].id !== id)
                continue;
            cp[i].disabled = true;//todo this isnt working
        }
        this.setState({
            modpacks: cp,
        });
        alert(`installing ${id} // ${version}`)
    }

    render() {
        return (
            <div>
                <div className="modpack-filter">
                    <div className="search">
                        <input id="curseSearch" type="text" placeholder="Search..." onChange={(e) => {
                            const newValue = e.target.value;
                            clearTimeout(this.searchRefreshTimeout);
                            this.searchRefreshTimeout = setTimeout(() => {
                                this.setState({ search: newValue }, () => this.clearRefresh());
                            }, 750);
                        }} />
                        <i className="fas fa-search"></i>
                    </div>
                    <div className="dropdowns">
                        <select id="curseCategory" name="category" onChange={(e) => {
                            this.setState({ category: e.target.value }, () => this.clearRefresh())
                        }} >
                            <option value="0">All</option>
                            <option value="4475">Adventure and RPG</option>
                            <option value="4483">Combat / PvP</option>
                            <option value="4476">Exploration</option>
                            <option value="4482">Extra Large</option>
                            <option value="4487">FTB Official</option>
                            <option value="4479">Hardcore</option>
                            <option value="4473">Magic</option>
                            <option value="4480">Map Based</option>
                            <option value="4477">Mini Game</option>
                            <option value="4484">Multiplayer</option>
                            <option value="4478">Quests</option>
                            <option value="4474">Sci-Fi</option>
                            <option value="4736">Skyblock</option>
                            <option value="4481">Small / Light</option>
                            <option value="4472">Tech</option>
                        </select>
                        <select id="curseSortOrder" name="sort-order" onChange={(e) => {
                            this.setState({ sort: e.target.value }, () => this.clearRefresh())
                        }} >
                            <option value="Featured">Featured</option>
                            <option value="TotalDownloads">Downloads</option>
                            <option value="Popularity">Popularity</option>
                            <option value="Name">Name</option>
                            <option value="Author">Author</option>
                            <option value="LastUpdated">Last Updated</option>
                        </select>
                        <select id="curseGameVersion" onChange={(e) => {
                            this.setState({ mcVersion: e.target.value }, () => this.clearRefresh())
                        }} >
                            <option value="-">Any</option>
                            <option value="1.14">1.14</option>
                            <option value="1.13.2">1.13.2</option>
                        </select>
                    </div>
                    <div className="refresh" onClick={() => this.onRefresh()}>
                        <i className="fas fa-redo flip"></i>
                    </div>
                </div>
                <ModpackBrowser modpacks={this.state.modpacks} loading={!this.canLoadMore} onRefresh={() => this.onRefresh()} onScrollBottom={() => {
                    if (this.canLoadMore)
                        this.fetchNextPage();
                }} onModpackInstall={(id, version) => {this.installModpack(id, version)}} onModpackFetchVersions={(id) => {this.fetchVersions(id)}} />
            </div>
        );
    }
}

export default CurseModpackListing;
