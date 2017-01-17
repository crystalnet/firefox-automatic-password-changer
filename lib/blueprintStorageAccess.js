// require addon-sdk
const {Cc, Ci} = require('chrome');
const {viewFor} = require("sdk/view/core");
const window = viewFor(require("sdk/windows").browserWindows[0]);

// require own classes
const Hashtable = require('lib/Hashtable');
const simpleStorageAccess = require('lib/simpleStorageAccess');

const simpleStorageKey = 'PWCPaths';

/**
 * persistent storage of blueprints, only accessible from within the addon.
 * (self executing) singleton access to blueprints stored in the simple-storage.
 */
module.exports = (function blueprintStorageAccess() {
    let storedBlueprints;
    let languageStrings;
    (function init() {
        simpleStorageAccess.createOrRestore(simpleStorageKey, new Hashtable(), function (obj) {
            let typedItems = {};
            for (let property in obj.items) {
                if (!obj.items.hasOwnProperty(property))
                    continue;
                // rebuild individual blueprints
                typedItems[property] = new Hashtable(obj.items[property].items);
            }
            // rebuild blueprint collection
            return new Hashtable(typedItems);
        });
        storedBlueprints = simpleStorageAccess.get(simpleStorageKey);
    })();

    this.setLanguageStrings = function (lang) {
        languageStrings = lang;
    };

    /**
     * saves a blueprint-entry in simple-storage
     * @param url url of website where password should be changed. identifier for the blueprint
     * @param blueprintObject hashtable that contains the blueprint for password change
     */
    this.saveBlueprint = function saveBlueprint(url, blueprintObject) {
        console.log("save blueprint for " + url + " as " + blueprintObject + " in blueprint-storage");

        // blueprintObject might be null if sanityCheck after recording failed
        if(blueprintObject !== null) {
            storedBlueprints.setItem(url, blueprintObject);
            simpleStorageAccess.save(simpleStorageKey);
            console.log(simpleStorageAccess.print(simpleStorageKey));
            return true;
        } else {
            return false;
        }
    };

    /**
     * gets a stored blueprint.
     * @param url identifier for the blueprint.
     * @returns Hashtable object with blueprint
     */
    this.getBlueprint = function getBlueprint(url) {
        return storedBlueprints.getItem(url);
    };

    /**
     * remove elements from persistent storage
     * @param url base url for the blueprint. identifier for the blueprint.
     */
    this.removeBlueprint = function removeBlueprint(url) {
        storedBlueprints.removeItem(url);
        simpleStorageAccess.save(simpleStorageKey);
        return true;
    };

    /**
     * Checks if a certain object is in the storage.
     * @param url identifier for the blueprint.
     * @return {boolean}
     */
    this.hasBlueprint = function hasBlueprint(url) {
        return storedBlueprints.hasItem(url);
    };

    /**
     * Returns a Hashtable containing all blueprints(also Hashtable objects).
     * @return {*|Hashtable}
     */
    this.getAllBlueprints = function getAllBlueprints() {
        return storedBlueprints;
    };

    function openFileDialog() {
        let data = "";
        let fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        let cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);


        let nsIFilePicker = Ci.nsIFilePicker;
        let filePicker = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);

        let rv = filePicker.show();
        if (rv === nsIFilePicker.returnOK || rv === nsIFilePicker.returnReplace) {
            let file = filePicker.file;
            // Get the path as string. Note that you usually won't
            // need to work with the string paths.
            let path = filePicker.file.path;
            // work with returned nsILocalFile...
            console.log(file + " " + path);

            fstream.init(file, -1, 0, 0);
            cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish
            let str = {};
            let read = 1;
            while (read !== 0) {
                read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
                data += str.value;
            }

            cstream.close(); // this closes fstream
            console.log(data);
        }
        return data;
    }

    /**
     * export a stored blueprint to a new json file
     * parts of function are taken from https://developer.mozilla.org/en-US/Add-ons/Code_snippets/File_I_O#Reading_a_file
     * @param url identifier of the blueprint that should be exported.
     */
    this.exportBlueprint = function exportBlueprint(url) {
        let blueprint = getBlueprint(url);
        if (typeof blueprint === "undefined")
            return;

        let nsIFilePicker = Ci.nsIFilePicker;
        let filePicker = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
        let window = require('sdk/window/utils').getMostRecentBrowserWindow();
        let domain = url.split("//")[1];
        let name = "blueprint_for_" + domain.replace(/\./g, '_') + ".json";

        filePicker.appendFilter("JSON", "*.json");
        filePicker.defaultExtension = "json";
        filePicker.defaultString = name;
        filePicker.init(window, languageStrings["save blueprint"], nsIFilePicker.modeSave);
        filePicker.open(function(){
            // clone blueprint hashtable object, as it is a reference and we don't want an url entry in the original blueprint
            let clonedBlueprint = new Hashtable(blueprint.items);
            // add url for using it as key when importing this blueprint
            clonedBlueprint.setItem(blueprint.length, url);
            // convert hashtable to JSON
            let blueprintJson = JSON.stringify(clonedBlueprint);

            let newFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
            newFile.initWithPath(filePicker.file.target);

            // file is nsIFile, data is a string
            let foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);

            // use 0x02 | 0x10 to open file for appending.
            foStream.init(newFile, 0x02 | 0x08 | 0x20, 0x0666, 0);
            // write, create, truncate
            // In a c file operation, we have no need to set file mode with or operation,
            // directly using "r" or "w" usually.

            // if you are sure there will never ever be any non-ascii text in data you can
            // also call foStream.write(data, data.length) directly
            let converter = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
            converter.init(foStream, "UTF-8", 0, 0);
            converter.writeString(blueprintJson);
            converter.close(); // this closes foStream
        });
    };

    /**
     * imports a blueprint from disk.
     * opens file-manager for picking an external file
     */
    this.importBlueprint = function importBlueprint() {
        let newBlueprint = new Hashtable();
        let data = openFileDialog();

        if(typeof data === 'undefined' || data === ""){
            return;
        }

        // convert JSON to an Object
        let parsedData = JSON.parse(data);
        let keys = Object.keys(parsedData.items);

        console.log(parsedData.length);

        for (let i = 0; i < parsedData.length; i++) {
            console.log("set (" + keys[i] + ", " + parsedData.items[i] + ")");
            newBlueprint.setItem(keys[i], parsedData.items[i]);
        }

        // store in simple-storage
        let url = newBlueprint.getItem(newBlueprint.length - 1);
        newBlueprint.removeItem(newBlueprint.length - 1);

        let status = saveBlueprint(url, newBlueprint);
        return status;
    };
    return this;
}());