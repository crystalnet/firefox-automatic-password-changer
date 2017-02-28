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
let passwordGenerator = new PasswordGen(10, 5, 5, 0, languageStrings);

//var _ = require("sdk/l10n").get;

const panelWidth = 150;
const panelHeight = 100;

let button;
let buttonBadge;
let pwHash = new Hashtable();
let icon;
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
})();

// build context menu
let menu = contextMenu.Menu({
    label: "Password Changer",
    context: contextMenu.SelectorContext("input"),
    image: self.data.url("images/icon-16.png"),
    contentScriptFile: self.data.url("ContextMenuContentScript.js"),
    onMessage: function (message) {
        if (message[0] === "password") {
            let worker = tabs.activeTab.attach({
                contentScriptFile: self.data.url("RecorderPageContentScript.js")
            });
            let passwordToSend = message[1] === "generatePwd" ? passwordGenerator.generatePassword() : passwordGenerator.getPassword();
            worker.port.emit("PasswordContextMenuClick", message.concat([passwordToSend]));
        }
    },
    items: [
        recorder.buildContextMenu(),
        contextMenu.Item({
            label: languageStrings["generate_pwd"],
            data: "generatePwd"
        }),
        contextMenu.Item({
            label: languageStrings["reuse_pwd"],
            data: "reusePwd",
            context: contextMenu.PredicateContext(passwordGenerator.passwordSet)
        })
    ]
});

// panel is the options popup of the addon icon
let panel = panels.Panel({
    contentURL: self.data.url("optionPanel.html"),
    contentScriptFile: self.data.url("OptionPanelHandler.js"),
    onHide: handleHidePanel
});

panel.port.emit("languageStrings", languageStrings);

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
    panel.port.emit("startBuilding");
    panel.show({
        position: button
    });
    panel.resize(panelWidth, panelHeight);
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
        panel.port.emit("switchRecordbuttonLabel");
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

// fires when recording in panel has been clicked
panel.port.on("stopgorecord", toggleStopGoRecording);

// listener fires, when clicked open account list in option panel
panel.port.on("openAccountList", openAccountList);

// listener fires, when clicked open help in option panel
panel.port.on("openHelp", openHelp);

function handleHidePanel() {
    // may be needed later
    // panel.port.emit("hide");
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