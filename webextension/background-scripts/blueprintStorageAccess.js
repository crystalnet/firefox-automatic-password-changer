/* exported BlueprintStorageAccess */
class BlueprintStorageAccess {
    constructor() {
        // get content from persistent storage to build the blueprint live collection
        let getting = browser.storage.local.get('PWCPaths');
        getting.then(function (item) {
            if (typeof item.PWCPaths !== 'undefined') {
                // PWCPaths object found in storage, rebuild hash table structure out of it
                let pwcPaths = item.PWCPaths.items;
                let blueprints = {};
                for (let domain in pwcPaths) {
                    if (pwcPaths.hasOwnProperty(domain)) {
                        // rebuild individual blueprints
                        // pwcPaths[domain].changeProcedure = new HashTable(pwcPaths[domain].changeProcedure.items);
                        blueprints[domain] = pwcPaths[domain];
                    }
                }
                // rebuild blueprint collection
                blueprintStorageAccess.storedBlueprints = new HashTable(blueprints);
            } else {
                blueprintStorageAccess.storedBlueprints = new HashTable();
            }
        }, function () {
            console.log('Getting the PWCPaths object from persistent storage failed');
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
                console.log('Saving blueprint in persistent storage failed');
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
     * @returns {boolean}
     */
    removeBlueprint(url) {
        // remove blueprint from the live collection
        let removeItem = this.storedBlueprints.removeItem(url);
        let removeResult = typeof removeItem !== 'undefined';
        if (removeResult) {
            // update persistent storage
            let setting = browser.storage.local.set({PWCPaths: this.storedBlueprints});
            setting.then(null, function () {
                console.log('Updating persistent storage after removing a blueprint failed');
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
        if (typeof blueprint !== 'undefined') {
            let blob = new Blob([JSON.stringify(blueprint)], {
                'type': 'text/plain;charset=utf8;'
            });
            let date = new Date();
            let domain = url.split('//')[1];
            let filename = 'blueprint_for_' + domain.replace(/\./g, '_') + '_' + date.toLocaleDateString() + '_' + date.toLocaleTimeString().replace(/:/g, '-') + '.json';
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
            reader.addEventListener('load', function () {
                let blueprintImport;
                try {
                    blueprintImport = JSON.parse(reader.result);
                    const schema = '{"$schema":"http://json-schema.org/schema#","title":"Blueprint","description":"Blueprint Format Schema, DRAFT v3","type":"object","required":["version","scope","changeProcedure"],"properties":{"version":{"type":"number"},"scope":{"type":"array","description":"Scope, to which domains this blueprint applies (in particular wildcard * as for *.wikipedia.org)","items":{"type":"string"},"minItems":1,"uniqueItems":true},"changeProcedure":{"type":"array","description":"Step, by step description of the procedure to change the password","items":{"type":"object","properties":{"action":{"type":"string"},"parameters":{"type":"array","items":{"type":["string","number"]}}}},"minItems":1,"uniqueItems":true},"pwdPolicy":{"type":"array","items":{"type":"object","description":"Array of password policy descriptions for the automatic creation of new passwords, DRAFT v3","properties":{"allowedCharacterSets":{"type":"object","description":"The different sets of allowed characters. Threre are special charsets available to all policies: username (is filled with the username if available), emanresu (is filled with the reverse username if available), allASCII (represents all ASCII characters), allUnicode (represents all Unicode characters). The names of these special character sets must not be used by other charset definitions.","minProperties":1},"minLength":{"type":"number","description":"The minimum length of the password, if left out: assumed to be 1","minimum":1},"maxLength":{"type":"number","description":"The maximum length of the password, if left out: assumed to be infinite","minimum":1},"compositionRequirements":{"type":"array","description":"The list of composition requirements in this password policy. If left out: assumed that all character sets can be used in any combination.","items":{"type":"object","description":"Representations of composition requirements using rules (regexps) on the allowed character sets, which either must or must not be fulfilled by valid passwords.","required":["kind","num","rule"],"properties":{"kind":{"type":"string","enum":["must","mustNot"]},"num":{"type":"number"},"rule":{"type":"object","description":"The rule of this composition requirement as regexp.","properties":{"description":{"type":"string","description":"A textual description of the rule to display to the user in the UI."},"regexp":{"type":"string","description":"The actual regexp of the rule."}}}},"minItems":1,"uniqueItems":true}}}}}}}';
                    new Player(reader.result, schema);
                } catch (e) {
                    console.log('file does not contain a valid JSON string');
                    Utils.showNotification('Error. Blueprint was not imported because it is not a valid JSON or does not follow the blueprint schema');
                    return;
                }
                // TODO iterate over scope
                blueprintStorageAccess.saveBlueprint(blueprintImport.scope[0], blueprintImport);
            });
            reader.readAsText(files[i]);
        }
    }
}