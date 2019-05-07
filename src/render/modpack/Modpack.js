import React from 'react';
import './modpack.css';

export const ModpackBrowser = (props) => {
    if (props.error) {
        return (
            <div className="bug">
                <h1><i className="fas fa-bug"></i></h1>
                <p>An error has occurred, please <span onClick={() => props.onRefresh()}>refresh</span> the page.</p>
            </div>
        );
    }
    if (props.modpacks.length === 0 && props.loading)
        return (
            <div className="bug">
                <h1 className="small"><i className="fas fa-frown"></i></h1>
                <p>No modpacks were found, please edit your search!</p>
            </div>
        );
    return (
        <div className="modpack-browser" onScroll={e => {
            if ((e.target.scrollHeight - e.target.offsetHeight) <= (e.target.scrollTop + 10))
                props.onScrollBottom();
        }}>
            {[...props.modpacks].map(modpack => {
                return (<Modpack key={modpack.id} {...modpack}
                                 onInstall={(version) => props.onModpackInstall(modpack.id, version)}
                                 onShowVersions={() => props.onModpackFetchVersions(modpack.id)} />)
            })}
            {/*{props.loading ? (<p>LOADING</p>) : (<div></div>)}*/}
        </div>
    );
};

const Modpack = (props) => {
    return (
        <div className="modpack">
            <img src={props.icon} alt={props.name} />
            <div className="modpack-info">
                <div className="modpack-info-ext">
                    <h1>{props.name}</h1>
                    <h2>by <span>{props.primaryAuthor}</span></h2>
                    <p>{truncateString(props.summary)}</p>
                    <i className={`fas ${props.featured ? 'fa-star' : ''}`}></i>
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
                <div>
                    <button onClick={() => props.onInstall(props.defaultFile)}><i className="fas fa-file-download"></i> Install</button>
                    <div></div>
                    <button onClick={() => props.onShowVersions()}><i className="fas fa-caret-down"></i></button>
                </div>
            </div>
        </div>
    );
};

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
    Modpack
}
