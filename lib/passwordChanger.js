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

// own classes and variables
const Recorder = require('lib/Recorder');
const Imitator = require('lib/Imitator');
const Hashtable = require('lib/Hashtable');

const {Translator, LANGUAGE} = require('lib/Translator');
const languageStrings = Translator(LANGUAGE.usa);
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

(function init() {
    // create main button of the addon
    let icon;

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
        badge: 'ok',
        badgeColor: "#00AAAA",
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
        }

        // if recorder is not recording -> start
        else {
            myRecorder.StartRecording();
            console.log("started recording");
        }
}

function openAccountList() {

    let pwHash = new Hashtable();
    let i = 0;

    panel.hide();

    // save all urls and usernames which are stored in password manager of firefox in a hashtable
    // this is necessary because this action is asyncronous and should be done early before data is needed
    require("sdk/passwords").search({
        onComplete: function onComplete(credentials) {
            credentials.forEach(function (credential) {
                let temp = [credential.username, credential.url];
                pwHash.setItem(i, temp);
                i++;
            });
        }
    });

    // opens a new tab with all accounts which are stores in password manager
    tabs.open({
        url: self.data.url("Accountlist.html"),
        isPinned: false,
        onReady: function onOpen(tab) {
            // attaching script to the accountlist tab
            AccountlistWorker = tab.attach({
                contentScriptFile: [self.data.url("jquery.min.js"), self.data.url("jquery-ui.min.js"), self.data.url("AccountlistContentScript.js")]
            });

            // sends language strings to account list
            AccountlistWorker.port.emit("languageStrings", languageStrings);

            // lets build Accountlist dynamically
            AccountlistWorker.port.emit("startBuildingAccountlist", pwHash);

            // listening for deleteEntry event
            AccountlistWorker.port.on("deleteThisEntry", function (urlAndName) {
                // deletes login from password manager
                deleteLoginData(urlAndName[0], urlAndName[1]);
            });

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
                tabs.activeTab.close();
                tabs.open(url);
                panel.port.emit("switchRecordbuttonLabel");
                toggleStopGoRecording();
            });

            //listening for navigate to password change form event
            AccountlistWorker.port.on("Nav2ChangeForm", function (urlAndName) {
                let blueprint;
                if (!blueprintStorageAccess.hasBlueprint(urlAndName[0])) {
                    console.log("lets navigate to change with url = " + urlAndName[0] + "and name = " + urlAndName[1]);
                    AccountlistWorker.port.emit("NoChangeWay", urlAndName[0]);
                }
                else
                    blueprint = blueprintStorageAccess.getBlueprint(urlAndName[0]);
                if (typeof(blueprint) !== 'undefined')
                    navigateUserToChangePWManual(blueprint, urlAndName[1], urlAndName[0]);
            });

            //listening for Import Blueprint event
            AccountlistWorker.port.on("ImportBP", function () {
                console.log("importing ...");
                blueprintStorageAccess.importBlueprint();
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

            // listening when user clicked on button to open the blueprint menu
            AccountlistWorker.port.on("OpenBlueprints", openBlueprints = function () {
                tabs.open({
                    url: self.data.url("Blueprints.html"),

                    onReady: function onOpen(tab) {
                        let blueprintWorker = tab.attach({
                            contentScriptFile: [self.data.url("jquery.min.js"), self.data.url("jquery-ui.min.js"), self.data.url("BlaupauseContentScript.js")]
                        });

                        blueprintWorker.port.emit("languageStrings", languageStrings);

                        // build Blueprint menu dynamically
                        blueprintWorker.port.emit("startBuildingBlueprints", blueprintStorageAccess.getAllBlueprints());

                        // listening for deleteEntry event
                        // deletes entry in simple-storage and reopens the blueprint menu
                        blueprintWorker.port.on("deleteThisEntry", function (url) {
                            console.log("deleting this entry from ss: " + url);
                            blueprintStorageAccess.removeBlueprint(url);
                            tabs.activeTab.close();
                            openBlueprints();
                        });
                    }
                });
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
 * @param username the username for the account
 * @param url the url of the website where a password should be changed
 */
function navigateUserToChangePWManual(hashtbl, username, url) {
    let hash4Navigation = new Hashtable();
    let i = 0;
    let j = 0;

    console.log("hashtbl.length" + hashtbl.length);
    console.log("hashtbl.getItem(0)" + hashtbl.getItem(0));
    while ((i < hashtbl.length) && (hashtbl.getItem(i)[hashtbl.getItem(i).length - 1] != "SubmitPWChange")) {
        console.log("hashtbl.getItem(i)[hashtbl.getItem(i).length - 1]" + hashtbl.getItem(i)[hashtbl.getItem(i).length - 1]);
        if (hashtbl.getItem(i)[hashtbl.getItem(i).length - 1] === "SubmitLogin") {
            hash4Navigation.setItem(j, hashtbl.getItem(i));
            j++
        }
        i++;
    }

    hash4Navigation.setItem(j, [hashtbl.getItem(i)[2], "SiteChange"]);

    hash4Navigation.each(function (k, v) {
        console.log(' hash4navigation key is: ' + k + ', value is: ' + v);
    });

    let imitator = new Imitator(hash4Navigation, username, url);
    imitator.StartImitating();
}

/**
 * deletes login data in the password manager
 * deletes blueprint from persistent storage if this was the last entry for this url only
 * reloads account list
 */
function deleteLoginData(url, username) {
    ffpwm.search({
        username: username,
        url: url,
        onComplete: function onComplete(credentials) {
            credentials.forEach(ffpwm.remove);
            console.log("deleting login data from pwmanager name: " + username + " url: " + url);

            tabs.activeTab.close();
            openAccountList();
        }
    });

    ffpwm.search({
        url: url,
        onComplete: function onComplete(credentials) {
            if (credentials.username != "") {
                blueprintStorageAccess.removeBlueprint(url);
            }
        }
    });
}