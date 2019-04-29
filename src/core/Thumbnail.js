import React from "react";

const Thumbnail = (props) => {
    return (
        <img id={props.id} src={props.src} alt={props.alt} style={Object.assign({
            width: `${props.size}px`,
            height: `${props.size}px`
        }, props.style)} />
    );
};

export default Thumbnail;
