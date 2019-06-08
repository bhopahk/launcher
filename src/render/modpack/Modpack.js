import React from 'react';
import './modpack.css';
import ReactTooltip from "react-tooltip";
import { ContextMenu, ContextMenuTrigger, MenuItem, SubMenu } from 'react-contextmenu';
import { Button } from '../input/Input';
import Snackbar from '../snackbar/Snackbar';

export class ModpackBrowser extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: null,
            versionsId: -1,
            versions: [],
        }
    }

    handleSetActive(nextActive) {
        if (this.state.active === null && nextActive == null)
            return;
        if (this.state.active === nextActive)
            nextActive = null;
        this.setState({
            active: nextActive,
        })
    }

    handleGlobalClick(event) {
        const buttons = document.getElementsByClassName('modpack-install');
        for (let i = 0; i < buttons.length; i++)
            if (buttons[i].contains(event.target))
                return;

        this.handleSetActive(null);
    };

    componentWillMount() {
        document.addEventListener('click', this.handleGlobalClick.bind(this));
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleGlobalClick.bind(this));
    }

    handleLoadVersions = (id) => {
        if (this.state.versionsId === id) {
            this.forceUpdate();
            return;
        }

        this.setState({
            versionsId: id,
            versions: []
        });

        fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${id}/files`, {
            headers: { "User-Agent": "Launcher (https://github.com/bhopahk/launcher/)" }
        }).then(resp => resp.json()).then(json => {
            let versions = [];
            json.forEach(ver => {
                versions.push({
                    id: ver.id,
                    name: ver.fileName,
                    type: ver.releaseType,
                });
            });
            this.setState({
                versions: versions.reverse(),
            })
        });
    };

    render() {
        if (this.props.error) {
            return (
                <div className="bug">
                    <h1><i className="fas fa-bug"></i></h1>
                    <p>An error has occurred, please <span onClick={() => Snackbar.sendSnack({ body: 'Refreshing Page...' })}>refresh</span> the page.</p>
                </div>
            );
        }
        if (this.props.modpacks.length === 0 && this.props.loading)
            return (
                <div className="bug">
                    <h1 className="small"><i className="fas fa-frown"></i></h1>
                    <p>No modpacks were found, please edit your search!</p>
                </div>
            );
        return (
            <div className="modpack-browser" onScroll={e => {
                if ((e.target.scrollHeight - e.target.offsetHeight) <= (e.target.scrollTop + 10))
                    this.props.onScrollBottom();
            }}>
                {[...this.props.modpacks].map(modpack => {
                    return (<Modpack key={modpack.id} dropped={this.state.active === modpack.id} {...modpack}
                                     onInstall={(version) => this.props.onModpackInstall(modpack.id, version)}
                                     onShowVersions={() => this.props.onModpackFetchVersions(modpack.id)}
                                     onSetActive={() => this.handleSetActive(modpack.id)}
                                     loadVersions={() => this.handleLoadVersions(modpack.id)}
                                     getLoadedVersions={() => this.state.versions} />)
                })}
            </div>
        );
    }
}

const Modpack = (props) => {
    return (
        <div>
            <ContextMenuTrigger id={`${props.id}`}>
                <div className="modpack">
                    <img src={props.icon} alt={props.name} />
                    <div className="modpack-info">
                        <div className="modpack-info-ext">
                            <h1>{props.name}</h1>
                            <h2>by <span>{props.primaryAuthor}</span></h2>
                            <p>{props.summary}</p>
                            <i data-tip="" data-for="sad2" className={`fas ${props.featured ? 'fa-star' : ''}`}></i>
                            <ReactTooltip id='sad2' place="bottom">
                                <span className="tooltip-text">Featured</span>
                            </ReactTooltip>
                        </div>
                        <div className="modpack-details">
                            <div>
                                <h3>DOWNLOADS</h3>
                                <h2>{truncateNumber(props.downloads, 2)}</h2>
                            </div>
                            <div>
                                <h3>UPDATED</h3>
                                <h2>{new Date(props.modified).toLocaleDateString('en-US')}</h2>
                            </div>
                            <div>
                                <h3>GAME VERSION</h3>
                                <h2>{props.gameVersionLatestFiles[0].version}</h2>
                            </div>
                            <div>
                                <h3>POPULARITY INDEX</h3>
                                <h2>{Math.round(props.popularity)}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="modpack-install">
                        <Button onClick={() => props.onInstall(props.defaultFile)} disabled={props.disabled}><i className="fas fa-cloud-download-alt"></i> Install</Button>
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenu id={`${props.id}`} onShow={() => props.loadVersions()}>
                <SubMenu title={<div><i className="fas fa-cloud-download-alt"></i>Install</div>} className={"submenu-menu modpack-versions"} hoverDelay={0}>
                    {/* 1=Release, 2=Beta, 3=Alpha */}
                    {props.getLoadedVersions().map(ver => {
                        return (<MenuItem key={ver.id} onClick={() => props.onInstall(ver.id)}>{ver.name}{ver.type === 2 ? (<span className="badge">Beta</span>) : ver.type === 3 ? (<span className="badge">Alpha</span>) : null}</MenuItem>);
                    })}
                </SubMenu>
                <MenuItem onClick={() => alert('// not implemented //')} disabled><i className="fas fa-ellipsis-h"></i>Details</MenuItem>
                <MenuItem onClick={() => window.ipc.send('open-external', props.websiteUrl)}><i className="fas fa-link"></i>CurseForge</MenuItem>
            </ContextMenu>
        </div>
    );
};

const truncateNumber = (number, decPlaces) => {
    decPlaces = Math.pow(10, decPlaces);
    let abbrev = [ "k", "m", "b", "t" ];

    for (let i = abbrev.length - 1; i >= 0; i--) {
        let size = Math.pow(10,(i + 1) * 3);
        if (size <= number) {
            number = Math.round(number * decPlaces / size) / decPlaces;
            if ((number === 1000) && (i < abbrev.length - 1)) {
                number = 1;
                i++;
            }
            number += abbrev[i];
            break;
        }
    }
    return number;
};

export {
    Modpack,
}
