import React from 'react';
import './modal.css';
import App from "../core/App";

class ModalConductor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: null,
        }
    }


    static openModal(name) {
        App.modals.current.setState({
            active: name,
        });
    }

    static closeModals() {
        ModalConductor.openModal(null);
    }

    render() {
        const active = this.state.active;
        let activeChild = null;
        for (let i = 0; i < React.Children.count(this.props.children); i++) {
            const child = React.Children.toArray(this.props.children)[i];
            if (child.props.id === active)
                activeChild = child;
        }

        return (
            <div>
                <div className={active !== null ? 'modal-cover' : ''} onClick={() => {
                    if (activeChild !== null && !activeChild.props.noclose) ModalConductor.closeModals()
                }}></div>
                {activeChild}
            </div>
        );
    }
}

const Modal = (props) => {
    return (
        <div className={`modal ${props.className}`}>
            {props.children}
        </div>
    );
};

export {
    ModalConductor,
    Modal,
}
