// require addon-sdk
const simpleStorage = require("sdk/simple-storage");

// require own classes
const Hashtable = require('lib/Hashtable');

/**
 * (self executing) singleton access to simple-storage
 */
module.exports = (function simpleStorageAccess() {
    /**
     * Create a new object in the storage or restore an existing one. This function should be called before any get is attempted.
     * @param key
     * @param defaultValue a default value that should be used if the object did not already exist in the storage.
     * @param selfConstructFunction a function that takes the simple object from the storage on disk and returns a typed
     * object for this key. (e.g. takes a {with items} object and returns a new Hashtable with the items.)
     */
    this.createOrRestore = function createOrRestore(key, defaultValue, selfConstructFunction) {
        if (!simpleStorage.storage[key]) {
            simpleStorage.storage[key] = defaultValue;
            return;
        }

        // replace stored simple object with the constructed(typed) object
        let newObject = selfConstructFunction(simpleStorage.storage[key]);
        delete simpleStorage.storage[key];
        simpleStorage.storage[key] = newObject;
    };

    /**
     * gets an object from the storage. createOrRestore should always be called before the first get is executed for a
     * specific stored object.
     * @param key identifier of the object
     * @return {*} the stored object or undefined if no object was found
     */
    this.get = function get(key) {
        if(simpleStorage.storage[key])
            return simpleStorage.storage[key];
        throw "Key not found '" + key + "'";
    };

    this.set = function set(key,obj) {
        simpleStorage.storage[key] = obj;
    };

    this.remove = function remove(key) {
        if(simpleStorage.storage[key]){
            delete simpleStorage.storage[key];
        }
    };

    //TODO check if this is necessary. behavior of re-assignment was taken from the old code.
    this.save = function save(key) {
       simpleStorage.storage[key] = simpleStorage.storage[key];
    };

    this.print = function print(key) {
        let str = "";
        simpleStorage.storage[key].each(function (k, v) {
            str += 'key in ' + key + ' is "' + k + '" value is "' + v + '" with items: {';
            v.each(function (subk, subv) {
                str += '"' + subk + '":"' + subv + '",';
            });
        });
        return str;
    };

    return this;
}());



