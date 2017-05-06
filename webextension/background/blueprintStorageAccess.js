class BlueprintStorageAccess {
    constructor(obj) {
        this.storedBlueprints = obj;
    }

    /**
     * Saves a blueprint-entry in storage
     * @param url URL of website where password should be changed. Identifier for the blueprint
     * @param blueprintObject Hashtable that contains the blueprint for password change
     */
    saveBlueprint(url, blueprintObject) {
        // blueprintObject might be null if sanityCheck after recording failed
        if (blueprintObject !== null) {
            // add blueprint to the live collection
            this.storedBlueprints.setItem(url, blueprintObject);
            // update persistent storage
            let setting = browser.storage.local.set({PWCPaths: this.storedBlueprints});
            setting.then(null, function () {
                console.log("Saving blueprint in persistent storage failed");
            });
        }
    }

    /**
     * Gets a stored blueprint.
     * @param url Identifier for the blueprint.
     * @returns Hashtable object with blueprint
     */
    getBlueprint(url) {
        return this.storedBlueprints.getItem(url);
    }

    /**
     * Removes blueprint from persistent storage
     * @param url Base url for the blueprint. Identifier for the blueprint.
     */
    removeBlueprint(url) {
        // remove blueprint from the live collection
        this.storedBlueprints.removeItem(url);
        // update persistent storage
        let setting = browser.storage.local.set({PWCPaths: this.storedBlueprints});
        setting.then(null, function () {
            console.log("Updating persistent storage after removing a blueprint failed");
        });
    }

    /**
     * Checks if a certain object is in the storage.
     * @param url Identifier for the blueprint.
     * @return {boolean}
     */
    hasBlueprint(url) {
        return this.storedBlueprints.hasItem(url);
    }

    /**
     * Returns a HashTable containing all blueprints (also HashTable objects).
     * @return {*|Hashtable}
     */
    getAllBlueprints() {
        return this.storedBlueprints;
    }

    /**
     * Exports a stored blueprint to a new json file
     * @param url Identifier of the blueprint that should be exported.
     */
    exportBlueprint(url) {
        let blob = new Blob([JSON.stringify(this.getBlueprint(url))], {
            "type": "text/plain;charset=utf8;"
        });
        let domain = url.split("//")[1];
        let filename = "blueprint_for_" + domain.replace(/\./g, '_') + ".json";
        browser.downloads.download({
            url: URL.createObjectURL(blob),
            filename: filename,
            saveAs: true
        });
    }
}

// We create a single blueprintStorageAccess object here, which can then be accessed in any other background script directly,
// because all background scripts are executed in the same scope; All other privileged add-on code can also
// access this scope via runtime.getBackgroundPage()
let blueprintStorageAccess = null;

(function initBlueprintStorageAccess() {
    // get content from persistent storage to build the blueprint live collection
    // we can't do this in the constructor of the BlueprintStorageAccess class, because of the
    // asynchronous behaviour of storage.local.get(), which prevents setting the "storedBlueprints" property of the class
    let getting = browser.storage.local.get("PWCPaths");
    getting.then(function(item) {
        if (typeof item.PWCPaths !== "undefined") {
            // PWCPaths object found in storage, rebuild hashtable structure out of it
            let pwcPaths = item.PWCPaths.items;
            let blueprints = {};
            for (let domain in pwcPaths) {
                if (pwcPaths.hasOwnProperty(domain)) {
                    // rebuild individual blueprints
                    blueprints[domain] = new HashTable(pwcPaths[domain].items);
                }
            }
            // rebuild blueprint collection
            blueprintStorageAccess = new BlueprintStorageAccess(new HashTable(blueprints));
        } else {
            blueprintStorageAccess = new BlueprintStorageAccess(new HashTable());
        }
    }, function() {
        console.log("Getting the PWCPaths object from persistent storage failed");
    });
})();