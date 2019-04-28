import React from "react";

const Thumbnail = (props) => {
    return (
        <img src={props.src} alt={props.alt} style={{
            width: `${props.size}px`,
            height: `${props.size}px`
        }} />
    );
};

export default Thumbnail;
