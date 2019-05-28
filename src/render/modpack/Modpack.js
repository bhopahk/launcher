import React from 'react';
import './modpack.css';

import { Tooltip } from '../core/Tooltip';

export class ModpackBrowser extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: null,
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

    render() {
        if (this.props.error) {
            return (
                <div className="bug">
                    <h1><i className="fas fa-bug"></i></h1>
                    <p>An error has occurred, please <span onClick={() => this.props.onRefresh()}>refresh</span> the page.</p>
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
                                     onSetActive={() => this.handleSetActive(modpack.id)} />)
                })}
                {/*{props.loading ? (<p>LOADING</p>) : (<div></div>)}*/}
            </div>
        );
    }
}

const Modpack = (props) => {
    return (
        <div className="modpack">
            <img src={props.icon} alt={props.name} />
            <div className="modpack-info">
                <div className="modpack-info-ext">
                    <h1>{props.name}</h1>
                    <h2>by <span>{props.primaryAuthor}</span></h2>
                    <p>{truncateString(props.summary)}</p>
                    <Tooltip text="TOOLTIPS BOIS" top={15} left={0}>
                        <i className={`fas ${props.featured ? 'fa-star' : ''}`}></i>
                    </Tooltip>
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
                <div className={props.disabled ? 'disabled' : ''}>
                    <button onClick={() => {if (!props.disabled) props.onInstall(props.defaultFile)}}><i className="fas fa-file-download"></i> Install</button>
                    <div></div>
                    <button onClick={() => {if (!props.disabled) props.onSetActive()}}><i className="fas fa-caret-down"></i>{props.dropped ? (<VersionDropdown id={props.id} onInstall={(fileId) => props.onInstall(fileId)} />) : (<div></div>)}</button>
                </div>
            </div>
        </div>
    );
};

class VersionDropdown extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            versions: []
        };

        fetch(`https://addons-ecs.forgesvc.net/api/addon/${this.props.id}/files`, {
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
                versions: versions.reverse()
            });
        });
    }


    render() {
        if (this.state.versions.length === 0) {
            return (
                <div className="modpack-versions">
                    <p>temp // loading...</p>
                </div>
            )
        }
        return (
            <div className="modpack-versions">
                <ul>
                    {this.state.versions.map(ver => {
                        return (<li onClick={() => {this.props.onInstall(ver.id)}}><span className="version-name">{ver.name}</span><span className="version-type">{ver.type === 1 ? 'Release' : ver.type === 2 ? 'Beta' : 'Alpha'}</span></li>)
                    })}
                </ul>
            </div>
        );
    }
}

const truncateString = (str) => {
    // 158 chars
    let truncated = str;
    if (str.length > 150) {
        truncated = truncated.substring(0, 150);
        truncated = truncated.substring(0, truncated.lastIndexOf(' '));
        truncated += '...';
    }
    return truncated;
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
    VersionDropdown
}
