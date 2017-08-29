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
                        pwcPaths[domain].changeProcedure = new HashTable(pwcPaths[domain].changeProcedure.items);
                        blueprints[domain] = pwcPaths[domain];
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
     * Exports a stored blueprint to a new JSON file
     * @param url Identifier of the blueprint that should be exported.
     */
    exportBlueprint(url) {
        let blueprint = this.getBlueprint(url);
        if (typeof blueprint !== "undefined") {
            let blob = new Blob([JSON.stringify(blueprint)], {
                "type": "text/plain;charset=utf8;"
            });
            let date = new Date();
            let domain = url.split("//")[1];
            let filename = "blueprint_for_" + domain.replace(/\./g, '_') + "_" + date.toLocaleDateString() + "_" + date.toLocaleTimeString().replace(/:/g, "-") + ".json";
            browser.downloads.download({
                url: URL.createObjectURL(blob),
                filename: filename,
                saveAs: true
            });
        }
    }

    /**
     * Imports one or more blueprints into storage
     * @param files  A FileList object returned by an input tag of type file
     */
    importBlueprints(files) {
        for (let i = 0; i < files.length; i++) {
            let reader = new FileReader();
            reader.addEventListener("load", function() {
                let blueprintImport;
                try {
                    blueprintImport = JSON.parse(reader.result);
                } catch (e) {
                    console.log("file does not contain a valid JSON string");
                    return;
                }
                if (typeof blueprintImport.scope === "object" && typeof blueprintImport.changeProcedure === "object") {
                    // TODO iterate over scope
                    blueprintImport.changeProcedure = new HashTable(blueprintImport.changeProcedure.items);
                    blueprintStorageAccess.saveBlueprint(blueprintImport.scope[0], blueprintImport);
                }

            });
            reader.readAsText(files[i]);
        }
    }
}