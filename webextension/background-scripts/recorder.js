class Recorder {
    constructor() {
        this.isActive = false;
        this.recordingTabId = -1;
        this.currentWebsite = '';
        this.eventDOMContentLoadedFired = false;
        this.loginDone = false;
        this.scrollPosition = 0;
        this.clickTempStore = null;
    }

    /**
     * Read-only access to the isActive property
     * @return {boolean} true if the recorder is currently recording, false if the recorder is inactive.
     */
    recorderStatus() {
        return this.isActive;
    }

    /**
     * Starts a recording
     */
    startRecording() {
        this.isActive = true;
        this.userWebPath = [];
        this.pwdPolicy = [];
        this.tagTracker = {};
        this.webPage = '';
        this.loginData = {
            password: '',
            username: '',
            passwordField: '',
            usernameField: '',
            formSubmitURL: '',
            url: ''
        };
        // let the legacy add-on retrieve the currently stored login credentials from the password manager
        // we need this later when setting the password from the recording
        portToLegacyAddOn.postMessage({
            type: 'refreshPasswordList'
        });
        // listener for tab changes, which is used to inject the recorderContentScript after a site load
        browser.tabs.onUpdated.addListener(this.injectContentScripts);
        // get active tab
        let querying = browser.tabs.query({currentWindow: true, active: true});
        querying.then(function(tabs) {
            // store the id of the tab the recording takes place in, so we can check for changes in this tab
            recorder.recordingTabId = tabs[0].id;
            // inject recorderContentScript
            recorder.injectContentScripts();
        }, function(error) {
            console.log(`Getting active tab in startRecording() failed. ${error}`);
        });
    }

    /**
     * Injects the content scripts necessary for recording
     * @param tabId
     * @param changeInfo
     * @param tabInfo
     */
    injectContentScripts(tabId = null, changeInfo = null, tabInfo = null) {
        // when starting the recording this function is called without arguments, so we will just inject the scripts
        // on each subsequent call of this function during recording, tabId will not be null and we do the check to
        // inject the scripts only once on each site load
        if (tabId !== null && (tabId !== recorder.recordingTabId || changeInfo.status !== 'loading' || typeof changeInfo.url === 'undefined'))
            return;
        // inject lodash_throttle
        let executing1 = browser.tabs.executeScript({
            file: '../external-scripts/lodash_throttle.min.js',
            runAt: 'document_start'
        });
        executing1.then(null, function(error) {
            console.log(`Injecting lodash_throttle in active tab failed. ${error}`);
        });
        // inject recorderContentScript
        let executing2 = browser.tabs.executeScript({
            file: '../content-scripts/recorderContentScript.js',
            runAt: 'document_end'
        });
        executing2.then(recorder.DOMContentLoaded, function(error) {
            console.log(`Injecting recorderContentScript in active tab failed. ${error}`);
        });
    }

    /**
     * Handles necessary actions after a site load
     */
    DOMContentLoaded() {
        recorder.eventDOMContentLoadedFired = true;
        recorder.scrollPosition = 0;
        let sending = browser.tabs.sendMessage(recorder.recordingTabId, {type: 'getWebPage'});
        sending.then(function(message) {
            recorder.currentWebsite = message.webPage;
        }, null);
        if (recorder.loginData.username !== '') {
            recorder.loginDone = true;
            // show labelAsNewPassword context menu item
            browser.contextMenus.update('labelAsNewPassword', {
                contexts: ['editable', 'password']
            });
        }
        // we need a fresh tagTracker, as there are other input elements on the new page
        recorder.tagTracker = {};
        if (recorder.clickTempStore !== null) {
            // if temporary click storage is not null, last click did trigger site load
            recorder.clickTempStore.parameters[recorder.clickTempStore.parameters.length - 1] = 'true';
            recorder.userWebPath.push(recorder.clickTempStore);
            recorder.clickTempStore = null;
        }
    }

    /**
     * Handles necessary actions after the user did a left-click with the mouse
     * @param message
     */
    clickHappened(message) {
        let scrollTop = this.scrollPosition;
        if (!this.eventDOMContentLoadedFired) {
            // special case when "DOMContentLoaded" event does not bubble up to window object on site load
            if (Utils.getMainPageFromLink(this.currentWebsite) !== Utils.getMainPageFromLink(message.webPage)) {
                this.scrollPosition = message.scrollTop;
                if (this.clickTempStore !== null) {
                    this.clickTempStore.parameters[this.clickTempStore.parameters.length - 1] = 'true';
                    this.userWebPath.push(this.clickTempStore);
                    this.clickTempStore = null;
                }
            }
            this.currentWebsite = message.webPage;
        }
        this.eventDOMContentLoadedFired = false;
        // cut off arguments of website string
        let websiteTrunk = this.constructItemWebsite(this.currentWebsite);
        // clear temporary click storage first, if last click did not trigger site load
        if (this.clickTempStore !== null)
            this.userWebPath.push(this.clickTempStore);
        this.clickTempStore = {
            action: 'Click',
            parameters: [
                message.clientX,
                message.clientY,
                message.innerHeight,
                message.innerWidth,
                scrollTop,
                websiteTrunk,
                'false'
                ]
        };
    }

    /**
     * Stores the current scroll position after user scrolled on a page
     * @param message
     */
    scrollHappened(message) {
        this.scrollPosition = message.scrollTop;
    }

    /**
     * Handles necessary actions after an input field labeled by the user loses focus
     * @param message
     */
    blurHappened(message) {
        let tag = this.tagTracker[message.nodeNumber];
        if (!this.eventDOMContentLoadedFired && Utils.getMainPageFromLink(this.currentWebsite) !== Utils.getMainPageFromLink(message.webPage)) {
            // special case when "DOMContentLoaded" event does not bubble up to window object on site load
            this.scrollPosition = message.scrollTop;
            if (this.clickTempStore !== null) {
                this.clickTempStore.parameters[this.clickTempStore.parameters.length - 1] = 'true';
                this.userWebPath.push(this.clickTempStore);
                this.clickTempStore = null;
            }
        }
        let websiteTrunk = this.constructItemWebsite(message.webPage);
        // clear temporary click storage if necessary before setting input item
        if (this.clickTempStore !== null) {
            this.userWebPath.push(this.clickTempStore);
            this.clickTempStore = null;
        }
        // we might set duplicate entries for an input element at this point, if the user
        // focuses an input element more than once (to correct a wrongly typed password for
        // example); these duplicates are removed after recording, so that we only have one
        // "Input" entry in the blueprint for each input element
        this.userWebPath.push({
            action: 'Input',
            parameters: [
                tag,
                message.inputsLength,
                message.nodeNumber,
                websiteTrunk
                ]
        });
        // store values we need for changing the password after recording stopped
        if (tag === 'U' && !this.loginDone) {
            this.loginData.formSubmitURL = message.nodeFormAction;
            this.loginData.url = Utils.getMainPageFromLink(websiteTrunk);
            this.loginData.username = message.nodeValue;
            this.loginData.usernameField = message.nodeName;
            // this will be the key in hash table in simple-storage
            this.webPage = Utils.getMainPageFromLink(websiteTrunk);
        }
        if (tag === 'C' && !this.loginDone) {
            this.loginData.passwordField = message.nodeName;
        }
        if (tag === 'N') {
            this.loginData.password = message.nodeValue;
        }
    }

    /**
     * Saves policy to blueprint
     */
    policyEntered(message) {
        this.pwdPolicy.push(message.policy);
    }

    /**
     * Stops recording
     */
    stopRecording() {
        this.isActive = false;
        // remove listener for tab changes
        browser.tabs.onUpdated.removeListener(this.injectContentScripts);
        // send stopRecording command to recorderContentScript
        let sending = browser.tabs.sendMessage(this.recordingTabId, {
            type: 'stopRecording'
        });
        sending.then(null, function(error) {
            console.log(`Getting recording results in stopRecording() failed. ${error}`);
        });
        // save last click, if not yet done
        if (this.clickTempStore !== null)
            this.userWebPath.push(this.clickTempStore);
        // clear variables
        this.currentWebsite = '';
        this.eventDOMContentLoadedFired = false;
        this.loginDone = false;
        this.scrollPosition = 0;
        this.clickTempStore = null;
        // handle recording results
        if (this.userWebPath.length > 0) {
            this.userWebPath = this.cleanUpUserWebPath(this.userWebPath);
            if (this.sanityCheck(this.userWebPath)) {
                // save recording results as new blueprint in storage
                const blueprint = {
                    version: 0,
                    scope: [this.webPage],
                    changeProcedure: this.userWebPath,
                    pwdPolicy: this.pwdPolicy
                };
                // TODO validate blueprint against schema
                blueprintStorageAccess.saveBlueprint(this.webPage, blueprint);
                // use legacy add-on code to store password
                portToLegacyAddOn.postMessage({
                    type: 'setPassword',
                    loginData: this.loginData,
                    sender: 'Recorder'
                });
                // clear loginData
                this.loginDone = null;
            }
        }
    }

    /**
     * Constructs the url for a blueprint item entry; the url for the first item
     * entry is treated differently, as we use it as start URL for imitation
     * @param url the complete URL with all arguments at the point of item recording
     * @returns {*}
     */
    constructItemWebsite(url) {
        let split = url.split('?');
        let constructedURL = split[0];
        if (Object.keys(this.userWebPath).length === 0 && split.length > 1) {
            let args = split[1];
            if (split.length > 2) {
                // arguments can have questions marks, undo splitting in this case
                args = split.slice(1).join('?');
            }
            // include all arguments that need to be part of the imitation start URL in argumentsToAppend
            // for Google these are 'continue', 'hl' and 'followup', but you can extend the array for other websites if necessary
            let argumentsToAppend = ['continue', 'hl', 'followup', 'next', 'forward', 'scope'];
            let argumentsAppended = 0;
            argumentsToAppend.forEach(function(value) {
                let argumentIndex = args.indexOf(value + '=');
                if (argumentIndex !== -1) {
                    constructedURL += argumentsAppended === 0 ? '?' : '&';
                    constructedURL += args.substring(argumentIndex).split('#')[0].split('&')[0];
                    argumentsAppended++;
                }
            });
        }
        return constructedURL;
    }

    /**
     * Cleans up the hash table obtained by a recording
     */
    cleanUpUserWebPath(userWebPath) {
        // remove duplicate entries (e.g. user clicked twice on the same spot)
        let temp = [];
        userWebPath.forEach(function (v, k) {
            let noDuplicateEntry = true;
            userWebPath.forEach(function (v2, k2) {
                if (k2 > k && v.action === v2.action && Utils.arraysEqual(v.parameters, v2.parameters)) {
                    noDuplicateEntry = false;
                }
            });
            if (noDuplicateEntry) {
                temp.push(v);
            }
        });
        // remove unnecessary entries
        // we can have multiple entries for an input element between site load events, if the
        // user first tagged wrongly and then corrected his choice; we only keep the last one
        let result = [];
        let lastSiteLoadClickKey = -1;
        temp.forEach(function (v, k) {
            if (v.action === 'Input') {
                let olderEntryFound = false;
                let key;
                result.forEach(function (v3, k3) {
                    if (v3.action === 'Input') {
                        // for all input items that came after the last site load, but before the current item
                        // we are looking at right now (implicit, because the are stored in result already),
                        // check if position of input element on the site is the same -> same element, but older entry
                        if (v.parameters[2] === v3.parameters[2] && k3 > lastSiteLoadClickKey) {
                            olderEntryFound = true;
                            key = k3;
                        }
                    }
                });
                if (olderEntryFound && typeof key !== 'undefined') {
                    // override older entry
                    result[key] = v;
                } else {
                    result.push(v);
                }
            } else {
                // else case is for click items
                if (v.parameters[6] === 'true')
                    lastSiteLoadClickKey = result.length - 1;
                result.push(v);
            }
        });
        return result;
    }

    /**
     * Performs a sanityCheck on the path of user actions recorded
     * Returns true, if blueprint has at least one item where the user tagged an input element as new
     * password and it happens at least one site load after filling in the new password (excludes most cases where the
     * user typed in a new password, tagged the input element and then stops recording without submitting the password
     * change); also a new password has to be known by the recorder (excludes cases where the user tagged an input
     * element as new password, but did not type in anything); this sanity check is not bulletproof: if the user types
     * in a new password, tags the input element and then changes the site without submitting the password change, the
     * recorder would store the new password in the password manager and save a blueprint
     * @param userWebPath
     * @returns {boolean}
     */
    sanityCheck(userWebPath) {
        let conditionMet = false;
        let hasNewPasswordInputEntry = false;
        userWebPath.forEach(function (v, k) {
            if (v.action === 'Click' && v.parameters[v.parameters.length - 1] === 'true' && hasNewPasswordInputEntry)
                conditionMet = true;
            if (v.action === 'Input' && v.parameters[0] === 'N')
                hasNewPasswordInputEntry = true;
        });
        return conditionMet && this.loginData.password !== '';
    }
}

browser.runtime.onMessage.addListener(function(message) {
    switch (message.type) {
    case 'clickHappened':
        recorder.clickHappened(message);
        break;
    case 'scrollHappened':
        recorder.scrollHappened(message);
        break;
    case 'blurHappened':
        recorder.blurHappened(message);
        break;
    case 'policyEntered':
        recorder.policyEntered(message);
        break;
    }
});

// listen for answers from the legacy add-on
portToLegacyAddOn.onMessage.addListener(function(message) {
    // imitator also listens for "storePassword" messages, so we need to check the intended receiver
    if (message.type === 'storePassword' && message.status === 'Error' && message.receiver === 'Recorder') {
        switch (message.errorCode) {
        case 'missingInformation':
            Utils.showNotification(browser.i18n.getMessage('store_password_failed_missing_information'));
            break;
        default:
            Utils.showNotification(browser.i18n.getMessage('recorder_failed_saving_new_password'));
            break;
        }
    }
});

/**
 * Getter for the recorder object, so we can access it in optionPanelHandler
 * @returns {Recorder}
 */
function getRecorder() {
    return recorder;
}