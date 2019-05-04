import React from 'react';
import ModpackListing from '../Modpack';

class CurseModpackListing extends ModpackListing {
    constructor(props) {
        super(props);

        this.state = {
            test: 'test value!',
            error: true,
        }
    }

    onRefresh() {
        alert('no implemented');
    }

    render() {
        return super.render();
    }
}

export default CurseModpackListing;
