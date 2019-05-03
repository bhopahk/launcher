import React from 'react';

class Form extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    update(event, value) {
        let k = event.target.id;
        let v = value != null ? value : event.target.value;

        this.setState({ [k]: v });
        // localStorage.setItem(k, v);
    }

    get(id, dft) {
        if (id == null)
            return '';
        let current = this.state[id];
        if (current == null) {
            current = dft == null ? '' : dft;
            // current = localStorage.getItem(id);
            // if (current == null)
            //     localStorage.setItem(id, dft == null ? '' : dft);
            this.setState({ [id]: current });
            // current = localStorage.getItem(id);
        }
        return current;
    }

    render() {
        return (
            <div className={'form-container'}>
                {this.props.children.map(child => {
                    return (
                        <div key={child.props.id}>
                            {React.cloneElement(child, {
                                onInput: (event, value) => this.update(event, value),
                                getValue: (dtf) => this.get(child.props.id, dtf),
                            })}
                            <br style={{
                                display: `${child.props.noBreak == null ? 'block' : 'none'}`
                            }} />
                        </div>
                    )
                })}
            </div>
        );
    }
}

export default Form;
