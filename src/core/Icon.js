import React from 'react';

const MaterialIcon = (props) => {
    return (
        <i className={'material-icons'} style={{
            fontSize: `${props.size}px !important`,
            height: `${props.size}px !important`,
            width: `${props.size}px !important`,
            verticalAlign: 'middle',
            paddingBottom: '2px',
        }} onClick={() => props.onClick()}>{props.name}</i>
    );
};

export default MaterialIcon;
