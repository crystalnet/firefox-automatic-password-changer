/*
 This ist the main source file for the addon
 */

// addon-sdk
const {ActionButton} = require("sdk/ui/button/action");
const panels = require("sdk/panel");
const self = require("sdk/self");
const URL = require('sdk/url').URL;
const tabs = require('sdk/tabs');
const contextMenu = require('sdk/context-menu');
const {viewFor} = require("sdk/view/core");
let window = viewFor(require("sdk/windows").browserWindows[0]);

// own classes and variables
const utils = require('lib/Utils');
const Badge = require('lib/Badge');
const Recorder = require('lib/Recorder');
const Imitator = require('lib/Imitator');
const Hashtable = require('lib/Hashtable');
const PasswordGen = require('lib/PasswordGen');
const {Translator} = require('lib/Translator');
const languageStrings = Translator(window.navigator.language || window.navigator.userLanguage);
const blueprintStorageAccess = require('lib/blueprintStorageAccess');
blueprintStorageAccess.setLanguageStrings(languageStrings);

let url = URL(tabs.activeTab.url);
let recorder = new Recorder(languageStrings);
let hashtable = null;
let passwordGenerator = new PasswordGen(12, 5, 5, 2, languageStrings);

let button;
let buttonBadge;
let pwHash = new Hashtable();
let icon;
let panel;
let menu;
let panelWidth = 200;
let panelHeight = 105;
let infoMessagesAdded = [];
let infoMessagesDismissed = [];
let infoMessages;

(function init() {
    // create main button of the addon
    if (getBrightness() > 0.5) {
        icon = {
            "16": "./images/icon-16.png",
            "32": "./images/icon-32.png",
            "64": "./images/icon-64.png"
        };
    }
    else {
        icon = {
            "16": "./images/icon_dark-16.png",
            "32": "./images/icon_dark-32.png",
            "64": "./images/icon_dark-64.png"
        };
    }
    button = ActionButton({
        id: "addonButton",
        label: "Passwort Changer",
        icon: icon,
        onClick: handleClick
    });
    buttonBadge = new Badge(button);
    loadPasswordList();
    // panel is the options popup of the addon icon
    panel = panels.Panel({
        contentURL: self.data.url("optionPanel.html"),
        contentScriptFile: self.data.url("OptionPanelHandler.js"),
        width: panelWidth,
        height: panelHeight
    });
    panel.port.emit("languageStrings", languageStrings);
    panel.port.emit("startBuilding");
    panel.port.on("stopgorecord", toggleStopGoRecording);
    panel.port.on("openAccountList", openAccountList);
    panel.port.on("openHelp", openHelp);
    panel.port.on("removeMessage", function(message) {
       removeInfoMessagePanel(message[0]);
    });
    panel.port.on("visitWebsite", function(message) {
        panel.hide();
        tabs.open(message[0]);
    });
    // build context menu
    menu = contextMenu.Menu({
        label: "Password Changer",
        image: self.data.url("images/icon-16.png"),
        contentScriptFile: self.data.url("ContextMenuContentScript.js"),
        onMessage: function (message) {
            switch (message[0]) {
                case "password":
                    let worker = tabs.activeTab.attach({
                        contentScriptFile: self.data.url("RecorderPageContentScript.js")
                    });
                    let passwordToSend = message[1] === "generatePwd" ? passwordGenerator.generatePassword() : passwordGenerator.getPassword();
                    worker.port.emit("PasswordContextMenuClick", message.concat([passwordToSend]));
                    break;
                case "startStopRecord":
                    panel.port.emit("switchRecordButtonLabel");
                    toggleStopGoRecording();
                    break;
            }
        },
        items: [
            recorder.buildContextMenu(),
            contextMenu.Item({
                label: languageStrings["record"],
                data: "startRecording",
                context: contextMenu.PredicateContext(function() {return !recorder.recorderIsActive();})
            }),
            contextMenu.Item({
                label: languageStrings["stop_recording"],
                data: "stopRecording",
                context: contextMenu.PredicateContext(recorder.recorderIsActive)
            }),
            contextMenu.Item({
                label: languageStrings["generate_pwd"],
                data: "generatePwd",
                context: contextMenu.SelectorContext("input")
            }),
            contextMenu.Item({
                label: languageStrings["reuse_pwd"],
                data: "reusePwd",
                context: [
                    contextMenu.PredicateContext(passwordGenerator.passwordSet),
                    contextMenu.SelectorContext("input")
                ]
            })
        ]
    });
    // TODO We might want to query the webservice periodically instead of doing it once on start up
    // window.setTimeout(function() {
    //     queryInfoWebservice();
    // }, 2000);
})();

// gets info messages for domains from a webservice
function queryInfoWebservice() {
    // TODO When the webservice is running in the future, do a request here to get info messages for domains
    // use dummy JSON data for now to showcase functionality
    // infoMessages = JSON.parse('{"http://fc2.com":["Password hash values have been leaked in March 2017.",1],"https://signin.ebay.de":["Password hash values have been leaked in December 2016.",2]}');
    // infoMessages = JSON.parse('{"http://fc2.com":["Password hash values have been leaked in March 2017.",1],"https://www.amazon.de":["Amazon has released a press statement advising its customers to change their password.",2]}');
    infoMessages = JSON.parse('{"http://fc2.com":["Password hash values have been leaked in March 2017.",1],"https://www.amazon.de":["Amazon has released a press statement advising its customers to change their password.",2],"https://imgur.com":["Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",3],"https://accounts.google.com":["Google sold account data to russian hackers. Shame on you, Google!",4]}');
    let numberOfMessages = 0;
    for (let domain in infoMessages) {
        // count relevant messages
        if (infoMessages.hasOwnProperty(domain) && utils.hasLoginForDomain(domain, pwHash)) {
            numberOfMessages++;
        }
    }
    buttonBadge.set(numberOfMessages);
}

function setInfoMessagePanel(domain, message, messageGUID) {
    if (infoMessagesAdded.indexOf(messageGUID) === -1 && infoMessagesDismissed.indexOf(messageGUID) === -1 && utils.hasLoginForDomain(domain, pwHash)) {
        // message has not been added yet in the current session and was not dismissed by the user in the past
        // additionally we only show messages for domains the user has an account for
        infoMessagesAdded.push(messageGUID);
        panelHeight += 104;
        panel.resize(320, panelHeight);
        panel.port.emit("infoMessage", [domain, message, messageGUID]);
    }
}

function removeInfoMessagePanel(messageGUID) {
    let badgeCount = buttonBadge.decrement();
    infoMessagesDismissed.push(messageGUID);
    panelHeight -= 104;
    if(badgeCount > 0)
        panel.resize(320, panelHeight);
    else
        panel.resize(150, panelHeight);
}

function getBrightness() {
    let navbar = window.document.getElementById("nav-bar");
    let windowColor = window.getComputedStyle(navbar, null).getPropertyValue("background-color");
    //TODO make the following expressions more descriptive
    let match = windowColor.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
    let R = match[1];
    let G = match[2];
    let B = match[3];
    let brightness = 0.2126 * (Math.pow((R / 255), 2.2)) + 0.7152 * (Math.pow((G / 255), 2.2)) + 0.0722 * (Math.pow((B / 255), 2.2));
    console.log("Farbe: " + brightness);
    return brightness;
}

// handle click on main button and shows the option panel
function handleClick() {
    // iterate over infoMessages and append an entry to the options panel for each message
    for (let domain in infoMessages) {
        if (infoMessages.hasOwnProperty(domain)) {
            let data = infoMessages[domain];
            setInfoMessagePanel(domain, data[0], data[1]);
        }
    }
    panel.show({
        position: button
    });
}

function toggleStopGoRecording() {
    panel.hide();
    // if recorder was is recording already -> stop
    if (recorder.recorderIsActive()) {
        hashtable = recorder.stopRecording();
        console.log("ended recording");

        // save password change path in simple storage
        blueprintStorageAccess.saveBlueprint(recorder.getWebPage(), hashtable);
        hashtable = null;
        let allCookies = window.content.document.cookie;
        console.log(allCookies);
        buttonBadge.deactivateRecording();
    }

    // if recorder is not recording -> start
    else {
        recorder.startRecording();
        console.log("started recording");
        buttonBadge.activateRecording();
    }
}

function loadPasswordList() {
    pwHash.clear();
    let i = 0;

    // save all urls and usernames which are stored in password manager of firefox in a hashtable
    // this is necessary because this action is asyncronous and should be done early before data is needed
    require("sdk/passwords").search({
        onComplete: function onComplete(credentials) {
            credentials.forEach(function (credential) {
                pwHash.setItem(i, [credential.username, credential.url]);
                i++;
            });
        }
    });
}
function openAccountList() {
    loadPasswordList();
    panel.hide();
    // opens a new tab with all accounts which are stores in password manager
    tabs.open({
        url: self.data.url("Accountlist.html"),
        isPinned: false,
        onReady: attachAccountListWorker
    });
}

function openHelp() {
    panel.hide();
    tabs.open({
        url: self.data.url(languageStrings["help-link"]),
        isPinned: false
    })
}

/**
 * Attach content scripts and setup message handling
 * @param tab the tab for Accountlist.html
 * @return {*}
 */
function attachAccountListWorker(tab) {
    // attaching script to the accountlist tab
    let accountListWorker = tab.attach({
        contentScriptFile: [self.data.url("external/jquery.min.js"), self.data.url("external/jquery-ui.min.js"), self.data.url("sharedUtils.js"), self.data.url("AccountlistContentScript.js")]
    });
    // sends language strings to account list
    accountListWorker.port.emit("languageStrings", languageStrings);

    // lets build Accountlist dynamically
    accountListWorker.port.emit("startBuildingAccountlist", [pwHash, Object.keys(blueprintStorageAccess.getAllBlueprints().items)]);

    // listening for change password event
    accountListWorker.port.on("changePW", function (urlAndName) {
        changeAutomaticPassword(blueprintStorageAccess.getBlueprint(urlAndName[0]), urlAndName[1], urlAndName[0]);
    });

    // listening for startRecord event
    // opens new tab , navigates to the url and starts recording
    accountListWorker.port.on("startRecord", function (url) {
        tabs.activeTab.close();
        tabs.open(url);
        panel.port.emit("switchRecordButtonLabel");
        toggleStopGoRecording();
    });

    // listening for navigate to password change form event
    accountListWorker.port.on("Nav2ChangeForm", function (urlAndName) {
        let blueprint = blueprintStorageAccess.getBlueprint(urlAndName[0]);
        if (typeof(blueprint) !== 'undefined')
            navigateUserToChangePWManual(blueprint);
    });

    // listening for Import Blueprint event
    accountListWorker.port.on("ImportBP", function () {
        console.log("importing ...");
        let importStatus = blueprintStorageAccess.importBlueprint();
        if (importStatus) {
            tabs.activeTab.reload();
            window.alert(languageStrings["blueprint imported"]);
        }
    });

    // listening for Export Blueprint event
    accountListWorker.port.on("ExportBP", function (url) {
        if (blueprintStorageAccess.hasBlueprint(url)) {
            blueprintStorageAccess.exportBlueprint(url);
        }
    });

    // listening for delete blueprint event
    accountListWorker.port.on("deleteBlueprint", function (url) {
        if (blueprintStorageAccess.hasBlueprint(url)) {
            let deleteStatus = blueprintStorageAccess.removeBlueprint(url);
            if (deleteStatus)
                tabs.activeTab.reload();
        }
    });
    return accountListWorker;
}

/**
 * change automatic password
 * @param blueprint hashtable object that contains the blueprint for changing password at certain url
 * @param username the username for the account
 * @param url the url of the website where a password should be changed
 */
function changeAutomaticPassword(blueprint, username, url) {
    // Create new Imitator object for changing pw automatically
    let imitator = new Imitator(blueprint, username, url, languageStrings, passwordGenerator);

    console.log("changing password for username: " + username + " on url: " + url);

    // start imitating
    imitator.startImitating();
}

/**
 * navigates user to the form where s/he can change manually password
 * @param hashtbl hashtable object that contains the blueprint for changing password at certain url
 */
function navigateUserToChangePWManual(hashtbl) {
    let url;
    for (let i = 0; i < hashtbl.length; i++) {
        let item = hashtbl.getItem(i);
        if (item[1] === "N") {
            url = item[4];
            break;
        }
    }
    tabs.open(url);
}