import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Route, Redirect} from "react-router-dom";
import Sidebar from './render2/sidebar';
import {Profiles, ProfileSettings} from './render2/profiles';
import Accounts from './render2/accounts';
import CurseModpacks from "./render2/curse";
import CustomProfile from "./render2/custom";

import './render2/common/standard.css';
import './render2/common/window_control.css';

// import './render/core/index.css';
// import App from './render/core/App';

const doc = document.createElement("style");
doc.innerHTML = window.ipc.sendSync('theme');
document.head.appendChild(doc);

const Wrapper = () => (
    <Router>
        <Controls/>
        <Sidebar/>
        <Route exact path="/" render={() => <Redirect to="/profiles"/>}/>
        <Route path="/profiles" component={Profiles}/>
        <Route path="/profiles/:id/settings" component={ProfileSettings}/>
        <Route exact path="/accounts" component={Accounts}/>
        <Route exact path="/curse" component={CurseModpacks}/>
        <Route exact path="/custom" component={CustomProfile}/>
    </Router>
);

const Controls = () => (
    <div className="window-control">
        <i className="material-icons icon" onClick={() => window.ipc.send('titlebar:minimize')}>remove</i>
        <i className="material-icons icon" onClick={() => window.ipc.send('titlebar:maximize')}>crop_square</i>
        <i className="material-icons icon" onClick={() => window.ipc.send('titlebar:quit')}>close</i>
    </div>
);

ReactDOM.render(<Wrapper/>, document.getElementById('root'));
// ReactDOM.render(<App />, document.getElementById('root'));
