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
        return (
            <div>
                <div className={active !== null ? 'modal-cover' : ''} onClick={() => ModalConductor.closeModals()}></div>
                {this.props.children.map(child => {
                    if (child.props.id === active)
                        return child;
                    else return null;
                })}
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
