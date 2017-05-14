class BlueprintStorageAccess {
    constructor() {
        // get content from persistent storage to build the blueprint live collection
        let getting = browser.storage.local.get("PWCPaths");
        getting.then(function(item) {
            if (typeof item.PWCPaths !== "undefined") {
                // PWCPaths object found in storage, rebuild hash table structure out of it
                let pwcPaths = item.PWCPaths.items;
                let blueprints = {};
                for (let domain in pwcPaths) {
                    if (pwcPaths.hasOwnProperty(domain)) {
                        // rebuild individual blueprints
                        blueprints[domain] = new HashTable(pwcPaths[domain].items);
                    }
                }
                // rebuild blueprint collection
                blueprintStorageAccess.storedBlueprints = new HashTable(blueprints);
            } else {
                blueprintStorageAccess.storedBlueprints = new HashTable();
            }
        }, function() {
            console.log("Getting the PWCPaths object from persistent storage failed");
        });
    }

    /**
     * Saves a blueprint-entry in storage
     * @param url URL of website where password should be changed. Identifier for the blueprint
     * @param blueprintObject HashTable that contains the blueprint for password change
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
     * @returns HashTable object with blueprint
     */
    getBlueprint(url) {
        return this.storedBlueprints.getItem(url);
    }

    /**
     * Removes blueprint from storage
     * @param url Base url for the blueprint. Identifier for the blueprint.
     */
    removeBlueprint(url) {
        // remove blueprint from the live collection
        let removeItem = this.storedBlueprints.removeItem(url);
        let removeResult = typeof removeItem !== "undefined";
        if (removeResult) {
            // update persistent storage
            let setting = browser.storage.local.set({PWCPaths: this.storedBlueprints});
            setting.then(null, function () {
                console.log("Updating persistent storage after removing a blueprint failed");
            });
        }
        return removeResult;
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
     * @returns {*}
     */
    getAllBlueprints() {
        return this.storedBlueprints;
    }

    /**
     * Exports a stored blueprint to a new json file
     * @param url Identifier of the blueprint that should be exported.
     */
    exportBlueprint(url) {
        let blueprint = this.getBlueprint(url);
        if (typeof blueprint !== "undefined") {
            // clone blueprint hash table object, as it is a reference and we don't
            // want an url entry in the original blueprint in the live collection
            let clonedBlueprint = new HashTable(blueprint.items);
            // add url for using it as key when importing this blueprint
            clonedBlueprint.setItem(blueprint.length, url);
            let blob = new Blob([JSON.stringify(clonedBlueprint)], {
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
}