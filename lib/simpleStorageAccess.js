// require addon-sdk
const simpleStorage = require("sdk/simple-storage");
// require own classes
const Hashtable = require('lib/Hashtable');

// (self executing) singleton access to simple-storage
module.exports = (function simpleStorageAccess() {
    (function init() {
        // singleton "constructor"

        if (!simpleStorage.storage.PWCPaths) {
            // if storage is empty
            simpleStorage.storage.PWCPaths = new Hashtable();
        }
        else {
            let it = simpleStorage.storage.PWCPaths.items;
            let myh = new Hashtable();
            for (let property in simpleStorage.storage.PWCPaths.items) {
                let tempHash = new Hashtable();
                if(!simpleStorage.storage.PWCPaths.items.hasOwnProperty(property))
                    continue;

                let propertyObject = simpleStorage.storage.PWCPaths.items[property];
                for (let i = 0; i < propertyObject.length; i++) {
                    tempHash.setItem(i, propertyObject.items[i]);
                }
                myh.setItem(property, tempHash);
            }
            delete simpleStorage.storage.PWCPaths;
            simpleStorage.storage.PWCPaths = myh;
        }
    })();

    /**
     * persistent storage of hashtable objects in simple-storage, only accessible from within the addon.
     * saves a blueprint-entry in simple-storage
     * @param key4Obj url of website where password should be changed
     * @param myObject hashtable that contains the blueprint for password change
     */
    this.savePWCPath = function savePWCPath(key4Obj, myObject) {
        console.log("save key4Obj = " + key4Obj + " and myObject" + myObject + "in simple-storage");

        let pwcPaths;
        if (!simpleStorage.storage.PWCPaths) {
            // if storage is empty
            pwcPaths = new Hashtable();
        }
        else {
            pwcPaths = simpleStorage.storage.PWCPaths;
        }

        pwcPaths.setItem(key4Obj, myObject);
        simpleStorage.storage.PWCPaths = pwcPaths;

        simpleStorage.storage.PWCPaths.each(function (k, v) {
            console.log('key in pwcpath is: ' + k + ', value is: ' + v);
            v.each(function (k, v) {
                console.log('key in pwcpath in element is: ' + k + ', value is: ' + v);
            });
        });
    };

    /**
     *
     * @param key4Obj url that is used as key in simple-storage for a hashtable with blueprint
     * @returns hashtable object with blueprint
     */
    this.getPWCPath = function getPWCPath(key4Obj) {
        if (!simpleStorage.storage.PWCPaths) {
            // if storage is empty
            return;
        }

        let pwcPaths = simpleStorage.storage.PWCPaths;
        return pwcPaths.getItem(key4Obj);
    };

    /**
     * remove elements from persistent storage
     * @param key4Obj base url for the password-change-path
     */
    this.deletePWCPath = function deletePWCPath(key4Obj) {
        if (!simpleStorage.storage.PWCPaths) {
            // if storage is empty
            return;
        }
        let pwcPaths = simpleStorage.storage.PWCPaths;
        pwcPaths.removeItem(key4Obj);
        simpleStorage.storage.PWCPaths = pwcPaths;
    };

    /**
     * Checks if a certain object is in the storage.
     * @param key4Obj
     * @return {boolean}
     */
    this.hasPWCPath = function hasPWCPath(key4Obj){
        return typeof(getPWCPath(key4Obj)) !== "undefined"
    };

    /**
     * Returns a hashtable containing all stored objects.
     * @return {*|Hashtable}
     */
    this.getAllPWCPaths = function getAllPWCPaths(){
        return simpleStorage.storage.PWCPaths;
    };

    return this;
}());



