/**
 * This is the starting point and main administration script of the add-on
 */

// all these variables can be accessed in any other background script directly,
// because all background scripts are executed in the same scope; All other privileged
// add-on code can also access this scope via runtime.getBackgroundPage()
const blueprintStorageAccess = new BlueprintStorageAccess();
const badge = new Badge();
const passwordGenerator = new PasswordGen(12, 8, 4, 0);
const recorder = new Recorder();
let messagesToDisplay = new HashTable();
let messagesDismissedByUser = [];
let portToLegacyAddOn;

(function init() {
    portToLegacyAddOn = browser.runtime.connect({name: "connection-to-legacy"});
    portToLegacyAddOn.onMessage.addListener(function(message) {
        switch (message.type) {
            case "LoginDomains":
                queryInfoWebservice(message.content);
                break;
        }
    });
    // get all domains the user has stored login credentials for, so we can call the
    // queryInfoWebservice function, which then sets the correct badge on the add-on button
    portToLegacyAddOn.postMessage({
        type: "getLoginDomains"
    });
    // build the context menu
    buildContextMenu();
})();

/**
 * Gets info messages for domains from a webservice
 */
function queryInfoWebservice(domains) {
    // TODO When the webservice is running in the future, do a request here to get actual info messages
    // use dummy JSON data for now to showcase functionality
    let infoMessages = JSON.parse('{"0":["http://should-not-be.included", "testing entry"],"1":["http://fc2.com", "Password hash values have been leaked in March 2017."],"2":["https://www.amazon.de", "Amazon has released a press statement advising its customers to change their password."],"3":["https://imgur.com", "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."],"4":["https://accounts.google.com", "Google sold account data to russian hackers. Shame on you, Google!"]}');
    for (let GUID in infoMessages) {
        // only display relevant messages, which have not yet been dismissed by the user
        if (infoMessages.hasOwnProperty(GUID) && domains.indexOf(infoMessages[GUID][0]) !== -1 && messagesDismissedByUser.indexOf(GUID) === -1) {
            messagesToDisplay.setItem(GUID, infoMessages[GUID]);
        }
    }
    badge.set(messagesToDisplay.length);
}

/**
 * Handles necessary steps when user dismissed a message, so it is not shown to him any more
 * @param messageGUID
 */
function dismissInfoMessage(messageGUID) {
    badge.decrement();
    messagesDismissedByUser.push(messageGUID);
    messagesToDisplay.removeItem(messageGUID);
}

/**
 * Getter for messagesToDisplay, so we can access it in optionPanelHandler
 * @returns {HashTable}
 */
function getMessagesToDisplay() {
    return messagesToDisplay;
}

/**
 * Getter for portToLegacyAddOn, so we can access it in accountlistHandler
 * @returns {HashTable}
 */
function getPortToLegacyAddOn() {
    return portToLegacyAddOn;
}

/**
 * Getter for portToLegacyAddOn, so we can access it in accountlistHandler
 * @returns {HashTable}
 */
function getBlueprintStorageAccess() {
    return blueprintStorageAccess;
}

/**
 * Builds  the context menu
 * We create all necessary context menu items at once, to get the correct display order;
 * page_action context is used to hide items which should currently not be displayed;
 * We update the context of those items whenever necessary;
 * This is done, because unlike the SDK, the WebExtensions API does not support predicate contexts
 */
function buildContextMenu() {
    browser.contextMenus.create({
        id: "topLevelItem",
        title: browser.i18n.getMessage("extensionName"),
        contexts: ["all"]
    });
    browser.contextMenus.create({
        id: "labelAs",
        parentId: "topLevelItem",
        title: browser.i18n.getMessage("label as"),
        contexts: ["page_action"]
    });
    browser.contextMenus.create({
        id: "labelAsUsername",
        parentId: "labelAs",
        title: browser.i18n.getMessage("username slash mail"),
        contexts: ["editable"]
    });
    browser.contextMenus.create({
        id: "labelAsCurrentPassword",
        parentId: "labelAs",
        title: browser.i18n.getMessage("current password"),
        contexts: ["editable", "password"]
    });
    browser.contextMenus.create({
        id: "labelAsNewPassword",
        parentId: "labelAs",
        title: browser.i18n.getMessage("new password"),
        contexts: ["page_action"]
    });
    browser.contextMenus.create({
        id: "startStopRecording",
        parentId: "topLevelItem",
        title: browser.i18n.getMessage("record"),
        contexts: ["all"]
    });
    browser.contextMenus.create({
        id: "generatePassword",
        parentId: "topLevelItem",
        title: browser.i18n.getMessage("generate_pwd"),
        contexts: ["editable", "password"]
    });
    browser.contextMenus.create({
        id: "reuseGeneratedPassword",
        parentId: "topLevelItem",
        title: browser.i18n.getMessage("reuse_pwd"),
        contexts: ["page_action"]
    });
    browser.contextMenus.onClicked.addListener(function(info, tab) {
        switch (info.menuItemId) {
            case "startStopRecording":
                // start or stop the recorder; handling the corresponding context menu changes is done
                // in toggleRecorder, because it also has to be done, when using the main menu
                toggleRecorder();
                break;
            case "generatePassword":
                // make reuseGeneratedPassword item visible
                browser.contextMenus.update("reuseGeneratedPassword", {
                    contexts: ["editable", "password"]
                });
                // send generated password to contextMenuContentScript
                browser.tabs.sendMessage(tab.id, {
                    case: "password",
                    content: passwordGenerator.generatePassword()
                });
                break;
            case "reuseGeneratedPassword":
                // make reuseGeneratedPassword item invisible
                browser.contextMenus.update(info.menuItemId, {
                    contexts: ["page_action"]
                });
                // send last generated password to contextMenuContentScript
                browser.tabs.sendMessage(tab.id, {
                    case: "password",
                    content: passwordGenerator.getLastPassword()
                });
                break;
            case "labelAsUsername":
                handleLabelAsContextMenuClick("U", tab.id);
                break;
            case "labelAsCurrentPassword":
                handleLabelAsContextMenuClick("C", tab.id);
                break;
            case "labelAsNewPassword":
                handleLabelAsContextMenuClick("N", tab.id);
                break;
        }
    });
}

/**
 * Handles clicks in the labelAs submenu of the context menu
 * @param label
 * @param tabId
 */
function handleLabelAsContextMenuClick(label, tabId) {
    // send highlight command to contextMenuContentScript
    let sending = browser.tabs.sendMessage(tabId, {
        case: "highlight"
    });
    sending.then(function(message) {
        recorder.tagTracker.setItem(message.inputNumber, label);
        // we get the number of the input element the context menu was invoked on as response
        // and send this information to the RecorderContentScript
        browser.tabs.sendMessage(tabId, {
            type: "label",
            inputNumber: message.inputNumber
        });
    }, function(error) {
        console.log(`Labeling input element failed. Error: ${error}`);
    });
}

/**
 * Starts the recorder, if it is inactive and stops it otherwise;
 * Also handles badge and context menu accordingly
 */
function toggleRecorder() {
    let recorderStatus = recorder.recorderStatus();
    if (recorderStatus) {
        badge.deactivateRecording();
        recorder.stopRecording();
        // hide labelAsNewPassword context menu item
        browser.contextMenus.update("labelAsNewPassword", {
            contexts: ["page_action"]
        });
    } else {
        badge.activateRecording();
        recorder.startRecording();
    }
    /* actual recorderStatus is now flipped after starting or stopping recorder ! */
    // update the startStopRecording item title
    let messageString = !recorderStatus ? "stop_recording" : "record";
    browser.contextMenus.update("startStopRecording", {
        title: browser.i18n.getMessage(messageString)
    });
    // hide or show labelAs submenu
    let contexts = !recorderStatus ? ["editable", "password"] : ["page_action"];
    browser.contextMenus.update("labelAs", {
        contexts: contexts
    });
}