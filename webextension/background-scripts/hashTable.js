/**
 * Got idea for hashtable implementation from http://www.mojavelinux.com/articles/javascript_hashes.html
 */
/* exported HashTable */
class HashTable {
    constructor(obj) {
        this.length = 0;
        this.items = {};
        for (let p in obj) {
            if (obj.hasOwnProperty(p)) {
                this.items[p] = obj[p];
                this.length++;
            }
        }
    }

    setItem(key, value) {
        let previous = undefined;
        if (this.hasItem(key)) {
            previous = this.items[key];
        }
        else {
            this.length++;
        }
        this.items[key] = value;
        return previous;
    }

    getItem(key) {
        return this.hasItem(key) ? this.items[key] : undefined;
    }

    hasItem(key) {
        return this.items.hasOwnProperty(key);
    }

    removeItem(key) {
        if (this.hasItem(key)) {
            let previous = this.items[key];
            this.length--;
            delete this.items[key];
            return previous;
        }
        else {
            return undefined;
        }
    }

    keys() {
        let keys = [];
        for (let k in this.items) {
            if (this.hasItem(k)) {
                keys.push(k);
            }
        }
        return keys;
    }

    values() {
        let values = [];
        for (let k in this.items) {
            if (this.hasItem(k)) {
                values.push(this.items[k]);
            }
        }
        return values;
    }

    each(fn) {
        for (let k in this.items) {
            if (this.hasItem(k)) {
                fn(k, this.items[k]);
            }
        }
    }

    clear() {
        this.items = {};
        this.length = 0;
    }
}