const flavorIcon = flavor => flavor === 'fabric' ? 'scroll' : flavor === 'forge' ? 'gavel' : 'cube';

class Queue {
    data = [];

    add(object) {
        this.data.unshift(object);
    }
    remove() {
        this.data.pop();
    }

    first() {
        return this.data[0];
    }
    last() {
        return this.data[this.data.length - 1];
    }

    length() {
        return this.data.length;
    }

    pull() {
        const next = this.last();
        this.remove();
        return next;
    }
}

export {
    flavorIcon, Queue
}