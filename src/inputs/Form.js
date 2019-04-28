import React from 'react';

class Form extends React.Component {
    constructor(props) {
        super(props);
    }

    update(event, value) {
        let newState = {};
        if (value != null)
            newState[event.target.id] = value;
        else newState[event.target.id] = event.target.value;
        this.setState(newState);
    }

    render() {
        return (
            <div className={'form-container'}>
                {this.props.children.map(child => {
                    return React.cloneElement(child, {
                        key: child.props.id,
                        onInput: (event, value) => this.update(event, value),
                    });
                })}
            </div>
        );
    }
}

export default Form;
