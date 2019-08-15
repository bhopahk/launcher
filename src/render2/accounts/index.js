import React from 'react';

import './accounts.css';
const HEAD_BASE_URL = 'https://mc-heads.net/avatar/';

export default class Accounts extends React.Component {
    constructor(props) {
        super(props);

        this.rerender = (_, accounts) => this.setState({ accounts });
        this.state = {
            active: 0,
            accounts: []
        };
    }

    componentDidMount() {
        window.ipc.on('account:render', this.rerender);
        window.ipc.send('account:render');
    }
    componentWillUnmount() {
        window.ipc.removeListener('account:render', this.rerender);
    }

    render() {
        return (
            <div className="accounts">
                <button className="add-account" onClick={() => window.ipc.send('account:inst')}>Add Account</button>
                <div className="account-list">
                    {this.state.accounts.map(acc => {
                        return (<Account key={acc._id} {...acc} />);
                    })}
                </div>
            </div>
        );
    }
}

const Account = props => (
    <div className={`account ${props.selected && 'active'}`} onClick={() => window.ipc.send('account:select', props.uuid)}>
        <img alt="User Head" src={`${HEAD_BASE_URL}${props.uuid}`}/>
        <div>
            <h4>{props.username}</h4>
            <h5>{props.uuid}</h5>
            <button onClick={e => {
                e.stopPropagation();
                window.ipc.send('account:remove', props.uuid);
            }} className="am-account-remove">Remove
            </button>
        </div>
    </div>
);