class Imitator {
    /**
     * Constructor for a Imitator object
     * @param blueprint HashTable object that contains the blueprint for changing password at a certain domain
     * @param username Username of the account the password should be changed for
     * @param credential Login credentials stored in the password manager for given username and url
     */
    constructor(blueprint, username, credential, newPassword = '') {
        this.actualStepNum = 0;
        this.maxStepNum = blueprint.changeProcedure.length;
        this.loginCredential = credential;
        this.blueprint = blueprint;
        this.username = username;
        this.newPassword = newPassword;
        this.imitationTabId = -1;
        this.imitationWindowId = -1;
    }

    /**
     * Starts the imitation process
     */
    startImitating() {
        // we start imitation on site where user started recording
        let firstItem = this.blueprint.changeProcedure[0];
        let startURL = firstItem.action === 'Click' ? firstItem.parameters[5] : firstItem.parameters[3];
        // new browser window for imitation process
        let creating = browser.windows.create({
            url: startURL
        });
        creating.then(function (windowInfo) {
            // store id of new window
            imitator.imitationWindowId = windowInfo.id;
            // store id of tab used for imitation
            imitator.imitationTabId = windowInfo.tabs[0].id;
            // listener for tab changes, which is used to inject the imitatorContentScript after each site load
            // this also applies to the initial site load after creating the window
            browser.tabs.onUpdated.addListener(imitator.injectContentScript);
        }, function (error) {
            console.log(`Creating a new window for the imitation process failed. ${error}`);
        });
    }

    /**
     * Injects the imitatorContentScript on site load
     */
    injectContentScript(tabId, changeInfo, tabInfo) {
        if (tabId === imitator.imitationTabId && changeInfo.status === 'loading' && typeof changeInfo.url !== 'undefined') {
            // inject imitatorContentScript
            let executing = browser.tabs.executeScript(imitator.imitationTabId, {
                file: '../content-scripts/imitatorContentScript.js',
                runAt: 'document_idle'
            });
            executing.then(null, function (error) {
                console.log(`Injecting imitatorContentScript in active tab failed. ${error}`);
            });
        }
    }

    /**
     * Executes the action described by the next blueprint item
     */
    executeImitationStep() {
        if (this.actualStepNum < this.maxStepNum) {
            let item = this.blueprint.changeProcedure[this.actualStepNum];
            let nextEvent = item.action;
            let sending = browser.tabs.sendMessage(this.imitationTabId, {type: 'getWebPage'});
            sending.then(function (message) {
                let currentWebsite = message.webPage;
                let websiteTrunk = (currentWebsite.split('?'))[0];
                switch (nextEvent) {
                case 'Input':
                    let tag = item.parameters[0];
                    let numberOfInputElements = item.parameters[1];
                    let positionOfInputElement = item.parameters[2];
                    let websiteURL = item.parameters[3].split('?')[0]; // splitting is only relevant for first item of blueprint, other item URL are not effected by this at all
                    if (Utils.removeTrailingSlash(websiteTrunk) !== Utils.removeTrailingSlash(websiteURL)) {
                            // we are on the wrong website -> abort
                        imitator.stopImitating('input should be filled, but we are on the wrong website\n  should be ' + Utils.removeTrailingSlash(websiteURL) + '\n  actually is ' + Utils.removeTrailingSlash(websiteTrunk));
                    } else {
                        imitator.performInput(tag, numberOfInputElements, positionOfInputElement);
                        imitator.actualStepNum++;
                    }
                    break;
                case 'Click' :
                    let mustXCoordinate = item.parameters[0];
                    let mustYCoordinate = item.parameters[1];
                    let mustWindowHeight = item.parameters[2];
                    let mustWindowWidth = item.parameters[3];
                    let mustScrollTop = item.parameters[4];
                    let mustWebsiteURL = item.parameters[5].split('?')[0]; // splitting is only relevant for first item of blueprint, other item URL are not effected by this at all
                    let triggersSiteLoad = item.parameters[6];
                    if (Utils.removeTrailingSlash(websiteTrunk) !== Utils.removeTrailingSlash(mustWebsiteURL)) {
                            // we are on the wrong website -> abort
                        imitator.stopImitating('click should be performed, but we are on the wrong website\n  should be ' + Utils.removeTrailingSlash(mustWebsiteURL) + '\n  actually is ' + Utils.removeTrailingSlash(websiteTrunk));
                    } else {
                        let sending = browser.tabs.sendMessage(imitator.imitationTabId, {type: 'getInnerDimensions'});
                        sending.then(function (message) {
                            if (message.innerHeight !== mustWindowHeight || message.innerWidth !== mustWindowWidth) {
                                    // change size of window if necessary to match click coordinates
                                imitator.changeWindowSize(mustWindowHeight, mustWindowWidth, message.innerHeight, message.innerWidth);
                            }
                            imitator.performClick(mustXCoordinate, mustYCoordinate, mustScrollTop, triggersSiteLoad);
                            imitator.actualStepNum++;
                        }, imitator.stopImitating);
                    }
                    break;
                }
            }, this.stopImitating);
        } else {
            this.stopImitating('done');
        }
    }

    /**
     * Changes size of window to handle size differences due to toolbars or bookmark sidebar
     * @param desiredHeight The desired inner height of the window
     * @param desiredWidth The desired inner width of the window
     * @param actualHeight The actual inner width of the window
     * @param actualWidth The actual inner width of the window
     */
    changeWindowSize(desiredHeight, desiredWidth, actualHeight, actualWidth) {
        let widthDifference = desiredWidth - actualWidth;
        let heightDifference = desiredHeight - actualHeight;
        let getting = browser.windows.get(this.imitationWindowId);
        getting.then(function (windowInfo) {
            let update = browser.windows.update(windowInfo.id, {
                left: 0,
                top: 0,
                width: windowInfo.width + widthDifference,
                height: windowInfo.heigth + heightDifference
            });
            update.then(null, imitator.stopImitating);
        }, null);
    }

    /**
     * Informs content script to fill some input element and provides the content plus all relevant information
     * @param tag Indicator whether to input username, current password or new password
     * @param numberOfInputElements Number of input elements we expect on the site
     * @param positionOfInputElement Identifies with input element should be filled
     */
    performInput(tag, numberOfInputElements, positionOfInputElement) {
        const self = this;
        let valueToSend = '';
        let promise = new Promise(function (resolve, reject) {
            resolve();
        });
        switch (tag) {
        case 'U':
            valueToSend = this.username;
            break;
        case 'C':
            valueToSend = this.loginCredential.password;
            break;
        case 'N':
            if (!this.newPassword) {
                const data = JSON.stringify(this.blueprint);
                const schema = '{"$schema":"http://json-schema.org/schema#","title":"Blueprint","description":"Blueprint Format Schema, DRAFT v3","type":"object","required":["version","scope","changeProcedure"],"properties":{"version":{"type":"number"},"scope":{"type":"array","description":"Scope, to which domains this blueprint applies (in particular wildcard * as for *.wikipedia.org)","items":{"type":"string"},"minItems":1,"uniqueItems":true},"changeProcedure":{"type":"array","description":"Step, by step description of the procedure to change the password","items":{"type":"object","properties":{"action":{"type":"string"},"parameters":{"type":"array","items":{"type":["string","number"]}}}},"minItems":1,"uniqueItems":true},"pwdPolicy":{"type":"array","items":{"type":"object","description":"Array of password policy descriptions for the automatic creation of new passwords, DRAFT v3","properties":{"allowedCharacterSets":{"type":"object","description":"The different sets of allowed characters. Threre are special charsets available to all policies: username (is filled with the username if available), emanresu (is filled with the reverse username if available), allASCII (represents all ASCII characters), allUnicode (represents all Unicode characters). The names of these special character sets must not be used by other charset definitions.","minProperties":1},"minLength":{"type":"number","description":"The minimum length of the password, if left out: assumed to be 1","minimum":1},"maxLength":{"type":"number","description":"The maximum length of the password, if left out: assumed to be infinite","minimum":1},"compositionRequirements":{"type":"array","description":"The list of composition requirements in this password policy. If left out: assumed that all character sets can be used in any combination.","items":{"type":"object","description":"Representations of composition requirements using rules (regexps) on the allowed character sets, which either must or must not be fulfilled by valid passwords.","required":["kind","num","rule"],"properties":{"kind":{"type":"string","enum":["must","mustNot"]},"num":{"type":"number"},"rule":{"type":"object","description":"The rule of this composition requirement as regexp.","properties":{"description":{"type":"string","description":"A textual description of the rule to display to the user in the UI."},"regexp":{"type":"string","description":"The actual regexp of the rule."}}}},"minItems":1,"uniqueItems":true}}}}}}}';
                const player = new Player(data, schema);
                promise = player.generatePassword(this.username)
                        .then(function (result) {
                            self.newPassword = result;
                            valueToSend = self.newPassword;
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
            } else {
                valueToSend = this.newPassword;
            }
            break;
        }
        promise
            .then(function () {
                let sending = browser.tabs.sendMessage(self.imitationTabId, {
                    type: 'fillInput',
                    data: {
                        value: valueToSend,
                        numberOfInputElements: numberOfInputElements,
                        positionOfInputElement: positionOfInputElement
                    }
                });
                sending.then(null, imitator.stopImitating);
            })
            .catch(function (error) {
                console.log(error);
                throw error;
            });
    }

    /**
     * Informs content script to click at (x,y) position in the web page
     * @param xCoordinate clientX-coordinate of click event
     * @param yCoordinate clientY-coordinate of click event
     * @param mustScrollTop scrollTop of window element for calibrating the viewport on website
     * @param triggersSiteLoad String indicating whether or not this click will trigger a site load
     */
    performClick(xCoordinate, yCoordinate, mustScrollTop, triggersSiteLoad) {
        let sending = browser.tabs.sendMessage(this.imitationTabId, {
            type: 'clickCoordinates',
            data: {
                xCoordinate: xCoordinate,
                yCoordinate: yCoordinate,
                mustScrollTop: mustScrollTop,
                triggersSiteLoad: triggersSiteLoad
            }
        });
        sending.then(null, imitator.stopImitating);
    }

    /**
     * Stops the imitation process
     * @param reason
     */
    stopImitating(reason = 'unknown') {
        console.log(`imitating stopped, reason: ${reason}`);
        // remove listener for tab changes
        browser.tabs.onUpdated.removeListener(this.injectContentScript);
        // close the window used for imitation
        browser.windows.remove(this.imitationWindowId);
        // inform user if something went wrong
        if (this.actualStepNum !== this.maxStepNum) {
            this.clearSensibleData();
            let message = browser.i18n.getMessage('imitator change failed');
            if (this.newPassword !== '')
                message += browser.i18n.getMessage('imitator change failed new password is', this.newPassword);
            Utils.showNotification(message);
        }
        // if there is a new password, store it in the password manager
        if (this.newPassword) {
            let loginData = JSON.parse(JSON.stringify(this.loginCredential));
            loginData.password = this.newPassword;
            portToLegacyAddOn.postMessage({
                type: 'setPassword',
                loginData: loginData,
                oldLoginData: this.loginCredential,
                sender: 'Imitator'
            });
        }
    }

    /**
     * Clears all password related data
     */
    clearSensibleData() {
        this.newPassword = null;
        this.loginCredential = null;
    }
}

let imitator;
let imitationStepDelay = 1000;

// listen for messages from imitatorContentScript
browser.runtime.onMessage.addListener(function (message) {
    switch (message.type) {
    case 'documentLoaded':
        imitator.executeImitationStep();
        break;
    case 'errorNumberOfInputElements':
        imitator.stopImitating('input should be filled, but site has changed since recording the blueprint');
        break;
    case 'fillInputDone':
        setTimeout(function () {
            imitator.executeImitationStep();
        }, imitationStepDelay);
        break;
    case 'clickCoordinatesDone':
        if (message.triggersSiteLoad === 'false')
            setTimeout(function () {
                imitator.executeImitationStep();
            }, imitationStepDelay);
        break;
    }
});

// listen for answers from the legacy add-on
portToLegacyAddOn.onMessage.addListener(function (message) {
    switch (message.type) {
    case 'SingleLoginCredential':
            // we got the necessary information from the legacy add-on, so now we can start the imitation process
        imitator = new Imitator(blueprintStorageAccess.getBlueprint(message.url), message.username, message.credential, message.newPassword);
        imitator.startImitating();
        break;
    case 'storePassword':
            // recorder also listens for "storePassword" messages, so we need to check the intended receiver
        if (message.receiver === 'Imitator') {
            if (message.status === 'Success') {
                Utils.showNotification(browser.i18n.getMessage('password_has_been_successfully_changed'));
            } else {
                // message.status is "Error", no need to check this
                switch (message.errorCode) {
                case 'removingOldCredentialFailed':
                    Utils.showNotification(browser.i18n.getMessage('imitator failed to save new password already changed'));
                    break;
                case 'storingFailedOldRemoved':
                    Utils.showNotification(browser.i18n.getMessage('imitator failed to save new password old deleted'));
                    break;
                case 'missingInformation':
                    Utils.showNotification(browser.i18n.getMessage('store_password_failed_missing_information'));
                    break;
                }
            }
                // imitator object no longer needed, set it to null to clear all sensitive with it
            imitator = null;
            break;
        }
    }
});

/**
 * This function is called in accountlistHandler to start an imitation process
 * @param username
 * @param url
 */
function startImitation(username, url, newPassword = '') {
    portToLegacyAddOn.postMessage({
        type: 'getSingleLoginCredential',
        username: username,
        url: url,
        newPassword: newPassword
    });
}