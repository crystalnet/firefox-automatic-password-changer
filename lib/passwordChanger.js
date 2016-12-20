/*
 This ist the main sourcefile for the Addon
 */
//Addon-SDK
var {ActionButton} = require("sdk/ui/button/action");
var {Cc, Ci} = require('chrome');
var pageWorkers = require("sdk/page-worker");
var panels = require("sdk/panel");
var self = require("sdk/self");
var URL = require('sdk/url').URL;
var tabs = require('sdk/tabs');
var ss = require("sdk/simple-storage");
var ffpwm = require("sdk/passwords");
var {viewFor} = require("sdk/view/core");
var window = viewFor(require("sdk/windows").browserWindows[0]);

//own classes and variables
var Recorder = require('lib/Recorder');
var Imitator = require('lib/Imitator');
var Hashtable = require('lib/Hashtable');
const simpleStorageAccess = require('lib/simpleStorageAccess');
const BlueprintStorage = require('lib/BlueprintStorage');

var url = URL(tabs.activeTab.url);
var myRecorder = new Recorder();
var myHashtable = null;
var AccountlistWorker = null;
let blueprintStorage = new BlueprintStorage();

var _ = require("sdk/l10n").get;

const panelWidth = 150;
const panelHeight = 70;

//create main button of addon
if (getBrightness() > 0.5) {
    var button = ActionButton({
        id: "addonButton",
        label: "PasswortChanger",
        icon: {
            "16": "./images/icon-16.png",
            "32": "./images/icon-32.png",
            "64": "./images/icon-64.png"
        },
        badge: 'ok',
        badgeColor: "#00AAAA",
        onClick: handleClick
    });
} else {
    var button = ActionButton({
        id: "addonButton",
        label: "PasswortChanger",
        icon: {
            "16": "./images/icon_dark-16.png",
            "32": "./images/icon_dark-32.png",
            "64": "./images/icon_dark-64.png"
        },
        badge: 'ok',
        badgeColor: "#00AAAA",
        onClick: handleClick
    });
}

// panel ist das Optionsmenu mit den button für Aufzeichnen und die Accountliste
var panel = panels.Panel({
    contentURL: self.data.url("optionPanel.html"),
    contentScriptFile: self.data.url("OptionPanelHandler.js"),
    onHide: handleHidePanel
});

function getBrightness() {
    var navbar = window.document.getElementById("nav-bar");
    var windowColor = window.getComputedStyle(navbar, null).getPropertyValue("background-color");
    //TODO make the following expressions more descriptive
    var match = windowColor.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
    var R = match[1];
    var G = match[2];
    var B = match[3];
    var brightness = 0.2126 * (Math.pow((R / 255), 2.2)) + 0.7152 * (Math.pow((G / 255), 2.2)) + 0.0722 * (Math.pow((B / 255), 2.2));
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

// fires when recording in panel has been clicked
panel.port.on("stopgorecord", LetStartRecord = function () {
    panel.hide();
    // if recorder was is recording already -> stop
    if (myRecorder.RecorderIsActive()) {
        myHashtable = new Hashtable();
        myHashtable = myRecorder.StopRecording();
        console.log("ended recording");

        // save password change path in simple storage
        simpleStorageAccess.savePWCPath(myRecorder.GetWebPage4PWChange(), myHashtable);
        myHashtable = null;
        allCookies = window.content.document.cookie;
        console.log(allCookies);
    }

    // if recorder is not recording -> start
    else {
        myRecorder.StartRecording();
        console.log("started recording");
    }
});

// listener fires, when clicked open accountlist in option panel
panel.port.on("openAccountList", openAcclist = function () {

    var pwHash = new Hashtable();
    var i = 0;

    panel.hide();

    // save all urls and usernames which are stored in password manager of firefox in a hashtable
    // this is necessary because this action is asyncronous and should be done early before data is needed
    require("sdk/passwords").search({
        onComplete: function onComplete(credentials) {
            credentials.forEach(function (credential) {
                var temp = [credential.username, credential.url];
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

            // lets build Accountlist dynamically
            AccountlistWorker.port.emit("startBuildingAccountlist", pwHash);

            // listening for deleteEntry event
            AccountlistWorker.port.on("deleteThisEntry", function (urlAndName) {
                // deletes login from password manager
                deleteLoginData(urlAndName[0], urlAndName[1]);
            });

            //listening for change password event
            AccountlistWorker.port.on("changePW", function (urlAndName) {
                if (!simpleStorageAccess.hasPWCPath(urlAndName[0])) {
                    AccountlistWorker.port.emit("NoChangeWay", urlAndName[0]);
                }
                else {
                    changeAutomaticPassword(simpleStorageAccess.getPWCPath(urlAndName[0]), urlAndName[1], urlAndName[0]);
                }
            });

            //listening for startRecord event
            // opens new tab , navigates to the url and starts recording
            AccountlistWorker.port.on("startRecord", function (url) {
                tabs.activeTab.close();
                tabs.open(url);
                panel.port.emit("switchRecordbuttonLabel");
                LetStartRecord();
            });

            //listening for navigate to password change form event
            AccountlistWorker.port.on("Nav2ChangeForm", function (urlAndName) {
                if (!simpleStorageAccess.hasPWCPath(urlAndName[0])) {
                    console.log("lets navigate to change with url = " + urlAndName[0] + "and name = " + urlAndName[1]);
                    AccountlistWorker.port.emit("NoChangeWay", urlAndName[0]);
                }
                else
                    var hashtbl = simpleStorageAccess.getPWCPath(urlAndName[0]);
                if (typeof(hashtbl) !== 'undefined')
                    navigateUserToChangePWManual(hashtbl, urlAndName[1], urlAndName[0]);
            });

            //listening for Import Blueprint event
            AccountlistWorker.port.on("ImportBP", function () {
                console.log("importing ...");
                blueprintStorage.import();
            });

            //listening for Export Blueprint event
            AccountlistWorker.port.on("ExportBP", function (url) {
                if (!simpleStorageAccess.hasPWCPath(url)) {
                    AccountlistWorker.port.emit("NoChangeWay", url);
                }
                else {
                    blueprintStorage.export(url);
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

                        // build Blueprint menu dynamically
                        blueprintWorker.port.emit("startBuildingBlueprints", simpleStorageAccess.getAllPWCPaths());

                        // listening for deleteEntry event
                        // deletes entry in simple-storage and reopens the blueprint menu
                        blueprintWorker.port.on("deleteThisEntry", function (url) {
                            console.log("deleting this entry from ss: " + url);
                            simpleStorageAccess.deletePWCPath(url);
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
});

function handleHidePanel() {
    // may be later needed
    //panel.port.emit("hide");
}

/* increments badge counter of button
 can be used in future for assign alerts or messages to the user*/
function incBadge(state) {
    if (isNaN(state.badge)) {
        button.badge = 0;
    }
    button.badge = button.badge + 1;
    button.badgeColor = "#FF0000";
    console.log("button '" + state.label + "' was clicked");
}

/* resets badge counter of button */
function resetBadgeCount(state) {
    button.badge = 'ok';
    button.badgeColor = "#00AAAA";
}

/* decrements badge counter of button */
function decBadge(state) {
    if (!isNaN(button.badge)) {

    }
    else if (button.badge == 1) {
        resetBadgeCount(state);
    }
    else {
        button.badge = button.badge - 1;
    }
}

//change automatic password
/* parameter :
 hashtbl: hashtable object that contains the blueprint for changing password at certain url
 username: the username for account thats password should be changed
 url: that is the url of the website where a passowrd should be changed
 */
function changeAutomaticPassword(hashtbl, username, url) {
    var imit = null;
    var i = 0;
    var j = 0;
    var hash4AutPWChange = new Hashtable();

    // delete all Clickevents from the hashtable

    while (i < hashtbl.length) {
        console.log("hashtbl.getItem(i)[hashtbl.getItem(i).length - 1]" + hashtbl.getItem(i)[hashtbl.getItem(i).length - 1]);
        if (hashtbl.getItem(i)[hashtbl.getItem(i).length - 1] != "Click") {
            hash4AutPWChange.setItem(j, hashtbl.getItem(i));
            j++
        }
        i++;
    }

    // Create new Imitator object for changing pw atomatically
    imit = new Imitator(hash4AutPWChange, username, url);

    console.log("changing password for username: " + username + " on url: " + url);

    // start imitating
    imit.StartImitating();
}

/*
 navigates user to the form where s/he can change manually password
 parameter:
 hashtbl: hashtable object that contains the blueprint for changing password at certain url
 username: the username for account thats password should be changed
 url: that is the url of the website where a passowrd should be changed
 */
function navigateUserToChangePWManual(hashtbl, username, url) {
    var imit = null;
    var hash4Navigation = new Hashtable();
    var i = 0;
    var j = 0;

    console.log("hashtbl.length" + hashtbl.length);
    console.log("hashtbl.getItem(0)" + hashtbl.getItem(0));
    while ((i < hashtbl.length) && (hashtbl.getItem(i)[hashtbl.getItem(i).length - 1] != "SubmitPWChange")) {
        console.log("hashtbl.getItem(i)[hashtbl.getItem(i).length - 1]" + hashtbl.getItem(i)[hashtbl.getItem(i).length - 1]);
        if (hashtbl.getItem(i)[hashtbl.getItem(i).length - 1] == "SubmitLogin") {
            hash4Navigation.setItem(j, hashtbl.getItem(i));
            j++
        }
        i++;
    }

    hash4Navigation.setItem(j, [hashtbl.getItem(i)[2], "SiteChange"]);

    hash4Navigation.each(function (k, v) {
        console.log(' hash4navigation key is: ' + k + ', value is: ' + v);
    });

    imit = new Imitator(hash4Navigation, username, url);
    imit.Init();
}

// deletes login data in passwordmanager
// deletes blueprint from persistent storage if this was the last entry for this url only
// reloads accountlist
function deleteLoginData(url, username) {
    ffpwm.search({
        username: username,
        url: url,
        onComplete: function onComplete(credentials) {
            credentials.forEach(ffpwm.remove);
            console.log("deleting login data from pwmanager name: " + username + " url: " + url);

            tabs.activeTab.close();
            openAcclist();
        }
    });

    ffpwm.search({
        url: url,
        onComplete: function onComplete(credentials) {
            if (credentials.username != "") {
                simpleStorageAccess.deletePWCPath(url);
            }
        }
    });
}
/*
 function for testing
 lists all login entries which are stored in password manager
 */
function show_all_passwords() {
    require("sdk/passwords").search({
        onComplete: function onComplete(credentials) {
            credentials.forEach(function (credential) {
                console.log(credential.username);
                console.log(credential.password);
            });
        }
    });
}
