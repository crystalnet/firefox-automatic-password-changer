/*
 This ist the main source file for the addon
 */

// addon-sdk
const {ActionButton} = require("sdk/ui/button/action");
const panels = require("sdk/panel");
const self = require("sdk/self");
const URL = require('sdk/url').URL;
const tabs = require('sdk/tabs');
const ss = require("sdk/simple-storage");
const ffpwm = require("sdk/passwords");
const {viewFor} = require("sdk/view/core");
let window = viewFor(require("sdk/windows").browserWindows[0]);
const utils = require('lib/Utils');

// own classes and variables
const Recorder = require('lib/Recorder');
const Imitator = require('lib/Imitator');
const Hashtable = require('lib/Hashtable');

const {Translator, LANGUAGE} = require('lib/Translator');
const languageStrings = Translator(window.navigator.language || window.navigator.userLanguage);
const blueprintStorageAccess = require('lib/blueprintStorageAccess');
blueprintStorageAccess.setLanguageStrings(languageStrings);

let url = URL(tabs.activeTab.url);
let myRecorder = new Recorder(languageStrings);
let myHashtable = null;
let AccountlistWorker = null;

//var _ = require("sdk/l10n").get;

const panelWidth = 150;
const panelHeight = 70;

let button;
let pwHash = new Hashtable();

(function init() {
    // create main button of the addon
    let icon;
    //pwHash = loadPasswordList();
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
        label: "PasswortChanger",
        icon: icon,
        //badge: ' ',
        badgeColor: "red",
        onClick: handleClick
    });


})();

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
function handleClick(state) {
    panel.port.emit("startBuilding");
    panel.show({
        position: button
    });
    panel.resize(panelWidth, panelHeight);
    //button.icon = "./images/stop.png";
}

function toggleStopGoRecording() {
    panel.hide();
    // if recorder was is recording already -> stop
    if (myRecorder.RecorderIsActive()) {
        myHashtable = myRecorder.StopRecording();
        console.log("ended recording");

        // save password change path in simple storage
        blueprintStorageAccess.saveBlueprint(myRecorder.GetWebPage(), myHashtable);
        myHashtable = null;
        let allCookies = window.content.document.cookie;
        console.log(allCookies);
        // deletes the badge when not recording
        button.badge = null;
    }

    // if recorder is not recording -> start
    else {
        myRecorder.StartRecording();
        console.log("started recording");
        // change the badge to red, when recording
        button.badge = ' ';
    }
}

function loadPasswordList() {
    //let pwHash = new Hashtable();
    let i = 0;

    panel.hide();

    // save all urls and usernames which are stored in password manager of firefox in a hashtable
    // this is necessary because this action is asyncronous and should be done early before data is needed
    require("sdk/passwords").search({
        onComplete: function onComplete(credentials) {
            // sort credentials by URL in ascending order
            credentials.sort(function (a, b) {
                return (a.url).localeCompare(b.url)
            });
            credentials.forEach(function (credential) {
                let temp = [credential.username, credential.url];
                pwHash.setItem(i, temp);
                i++;
            });
        }
    });
    return pwHash;
}
function openAccountList() {
    pwHash = loadPasswordList();

    // opens a new tab with all accounts which are stores in password manager
    tabs.open({
        url: self.data.url("Accountlist.html"),
        isPinned: false,
        onReady: function onOpen(tab) {
            // attaching script to the accountlist tab
            AccountlistWorker = tab.attach({
                contentScriptFile: [self.data.url("external/jquery.min.js"), self.data.url("external/jquery-ui.min.js"), self.data.url("AccountlistContentScript.js")]
            });

            // sends language strings to account list
            AccountlistWorker.port.emit("languageStrings", languageStrings);

            // lets build Accountlist dynamically
            AccountlistWorker.port.emit("startBuildingAccountlist", [pwHash, Object.keys(blueprintStorageAccess.getAllBlueprints().items)]);

            //listening for change password event
            AccountlistWorker.port.on("changePW", function (urlAndName) {
                if (!blueprintStorageAccess.hasBlueprint(urlAndName[0])) {
                    AccountlistWorker.port.emit("NoChangeWay", urlAndName[0]);
                }
                else {
                    changeAutomaticPassword(blueprintStorageAccess.getBlueprint(urlAndName[0]), urlAndName[1], urlAndName[0]);
                }
            });

            //listening for startRecord event
            // opens new tab , navigates to the url and starts recording
            AccountlistWorker.port.on("startRecord", function (url) {
                tabs.open(url);
                panel.port.emit("switchRecordbuttonLabel");
                toggleStopGoRecording();
            });

            //listening for navigate to password change form event
            AccountlistWorker.port.on("Nav2ChangeForm", function (urlAndName) {
                let blueprint = blueprintStorageAccess.getBlueprint(urlAndName[0]);
                if (typeof(blueprint) !== 'undefined')
                    navigateUserToChangePWManual(blueprint);
            });

            //listening for Import Blueprint event
            AccountlistWorker.port.on("ImportBP", function () {
                console.log("importing ...");
                //TODO only reopen account list if a blueprint was actually imported
                blueprintStorageAccess.importBlueprint();
                //TODO reload account list
            });

            //listening for Export Blueprint event
            AccountlistWorker.port.on("ExportBP", function (url) {
                if (!blueprintStorageAccess.hasBlueprint(url)) {
                    AccountlistWorker.port.emit("NoChangeWay", url);
                }
                else {
                    blueprintStorageAccess.exportBlueprint(url);
                }
            });

            //listening for delete blueprint event
            AccountlistWorker.port.on("deleteBlueprint", function (url) {
                if (blueprintStorageAccess.hasBlueprint(url)) {
                    blueprintStorageAccess.removeBlueprint(url);
                    // TODO reload account list
                }
            });
        },
        onClose: function onClosing() {
            AccountlistWorker.port.emit("closing");
        }
    });
}

// fires when recording in panel has been clicked
panel.port.on("stopgorecord", toggleStopGoRecording);

// listener fires, when clicked open account list in option panel
panel.port.on("openAccountList", openAccountList);

function handleHidePanel() {
    // may be later needed
    //panel.port.emit("hide");
}

/** increments badge counter of button
 can be used in future for assign alerts or messages to the user */
function incBadge(state) {
    if (isNaN(state.badge)) {
        button.badge = 0;
    }
    button.badge = button.badge + 1;
    button.badgeColor = "#FF0000";
    console.log("button '" + state.label + "' was clicked");
}

/** resets badge counter of button */
function resetBadgeCount(state) {
    button.badge = 'ok';
    button.badgeColor = "#00AAAA";
}

/** decrements badge counter of button */
function decBadge(state) {
    if (!isNaN(button.badge)) {

    }
    else if (button.badge === 1) {
        resetBadgeCount(state);
    }
    else {
        button.badge = button.badge - 1;
    }
}

/**
 * change automatic password
 * @param blueprint hashtable object that contains the blueprint for changing password at certain url
 * @param username the username for the account
 * @param url the url of the website where a password should be changed
 */
function changeAutomaticPassword(blueprint, username, url) {
    // Create new Imitator object for changing pw automatically
    let imitator = new Imitator(blueprint, username, url, languageStrings);

    console.log("changing password for username: " + username + " on url: " + url);

    // start imitating
    imitator.StartImitating();
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