/*
 This is the recorder class that can be used for recording blaupausen
 */
var tabs = require('sdk/tabs');
var {Ci} = require('chrome');
var {viewFor} = require('sdk/view/core');
var window = viewFor(require('sdk/windows').browserWindows[0]);
var Hashtable = require('lib/Hashtable');
var cm = require('sdk/context-menu');
var self = require('sdk/self');
var utils = require('lib/Utils');
var pageMod = require("sdk/page-mod");

module.exports = function Recorder() {
    // variables
    var orderNumber = 0;
    var isActive = false;
    var userWebPath = null;
    var webPage = "";
    var pwList = null;
    var RecordingMenu;
    var worker;
    var currentWebsite = "";
    var eventDOMContentLoadedfired = false;
    var loginDone = false;
    var tagTracker = null;

    // information for passwordmanager
    var password = "";
    var username = "";
    var passwordField = "";
    var usernameField = "";
    var formSubmitURL = "";
    var formActiveURL = "";

    this.testhook = {
        onClick: onClickEventHandler,
        setMessageValues: setInputBlurEventHandler,
        injectUserWebPath: function (value) {
            userWebPath = value;
        },
        injectWindow: function (value) {
            window = value;
        },
        injectTabs: function (value) {
            tabs = value;
        }
    };

    // start logging and add listener
    this.StartRecording = function () {
        console.log("recording started");
        // is recording now
        isActive = true;

        // new Hashtables
        userWebPath = new Hashtable();
        tagTracker = new Hashtable();

        // get passwords from PM
        // password list is later used after recording stopped when storing the new password
        pwList = utils.getPasswordList();

        // build a context menu and attach script
        buildContextMenu(false);

        // This will be the key in hashtable in simple-storage
        webPage = utils.getMainPageFromLink(tabs.activeTab.url);

        // event listener for click event
        // initial listener, because side is already loaded when recording starts
        window.content.document.addEventListener('click', onClickEventHandler, false);
        window.addEventListener('DOMContentLoaded', function() {
            // reattach every time side loads new document
            window.content.document.removeEventListener('click', onClickEventHandler, false);
            window.content.document.addEventListener('click', onClickEventHandler, false);
            currentWebsite = window.content.location.href;
            eventDOMContentLoadedfired = true;
            if(username !== "") {
                // when login is done, the user should not have the option to tag an input element with
                // the tag "U" for username anymore, as we would collect wrong information in this case
                destroyContextMenu();
                buildContextMenu(true);
                loginDone = true;
            }
            // special case for google button which prevents bubbling of click event up to to the document
            var googleAccountButton = window.content.document.querySelector("a[href^='https://accounts.google.com/SignOutOptions']");
            googleAccountButton.removeEventListener('click', onClickEventHandler, false);
            googleAccountButton.addEventListener('click', onClickEventHandler, false);
            // we need a fresh tagTracker, as there sre other input elements on the new page
            tagTracker.clear();
        }, false);
    };

    function onClickEventHandler(e) {
        if(!eventDOMContentLoadedfired) {
            currentWebsite = window.content.location.href;
        }
        eventDOMContentLoadedfired = false;
        // cut of arguments of website string
        var websiteTrunk = currentWebsite.split("?");
        // ignore right button click, which is used for context menu
        if(e.button !== 2) {
            userWebPath.setItem(orderNumber, ["Click", e.clientX, e.clientY, window.innerHeight, window.innerWidth, window.content.document.documentElement.scrollTop, websiteTrunk[0]]);
            orderNumber++;
        }
    }

    function onBlurEventHandler(e) {
        var node = e.target;
        // nodeNumber is the position of the node inside the collection of all
        // input elements; we use this number to identify the node on the page
        var nodeNumber;
        var inputs = window.content.document.getElementsByTagName("input");
        for (var i = 0; i < inputs.length; i++) {
            if(inputs[i].isSameNode(node)) {
                nodeNumber = i;
                break;
            }
        }
        var tag = tagTracker.getItem(nodeNumber);
        var websiteTrunk = (tabs.activeTab.url.split("?"))[0];
        // we might set duplicate entries for an input element at this point, if the user
        // focuses an input element more than once (to correct a wrongly typed password for
        // example); these duplicates are removed after recording, so that we only have one
        // "Input" entry in the blueprint for each input element
        userWebPath.setItem(orderNumber, ["Input", tag, inputs.length, nodeNumber, websiteTrunk]);
        orderNumber++;
        // store values we need for changing the password after recording stopped
        if(tag === "U") {
            formSubmitURL = node.form.action;
            formActiveURL = utils.getMainPageFromLink(websiteTrunk);
            username = node.value;
            if(!loginDone)
                usernameField = node.name;
        }
        if(tag === "C" && !loginDone) {
            passwordField = node.name;
        }
        if(tag === "N") {
            password = node.value;
        }
    }

    // stops logging actions and remove all listener
    // returns a blueprint as hashtable
    this.StopRecording = function () {
        console.log("recording stopped");
        destroyContextMenu();
        window.content.document.removeEventListener('click', onClickEventHandler, false);

        if (userWebPath != null) {
            userWebPath = CleanUpHashtable(userWebPath);

            // store password in password manager
            console.log("storing new password...");
            utils.storePasswordToFFPWManager(formActiveURL, username, password, passwordField, usernameField, formSubmitURL, pwList);
        }
        var resultPath = userWebPath;

        // clear all variables
        orderNumber = 0;
        isActive = false;
        userWebPath = null;
        pwList = null;
        password = "";
        username = "";
        passwordField = "";
        usernameField = "";
        formSubmitURL = "";
        formActiveURL = "";
        eventDOMContentLoadedfired = false;
        loginDone = false;
        tagTracker.clear();
        return resultPath;
    };

    // public read only
    // returns true = recording
    // returns false = inactive
    this.RecorderIsActive = function () {
        return isActive;
    };

    // public read only
    // returns webpage -> on this webpage we want to change pw
    // used in passwordChanger.js when storing a new blueprint
    this.GetWebPage4PWChange = function () {
        var webPage4Change = webPage;
        webPage = "";
        //TODO if read only once is intended, make it explicit e.g. rename to something like "pop..."
        return webPage4Change;
    };

    // Cleans up the hashtable
    function CleanUpHashtable(hash) {
        function arraysEqual(a, b) {
            if (a === b)
                return true;
            if ((a == null || b == null) || (a.length != b.length))
                return false;

            for (var i = 0; i < a.length; ++i) {
                if (a[i] !== b[i])
                    return false;
            }
            return true;
        }

        var temp = new Hashtable();
        var result = new Hashtable();
        var i = 0;

        // remove duplicate entries (e.g. user clicked twice on the same spot)
        hash.each(function(k, v) {
            var noDuplicateEntry = true;
            temp.each(function(k2, v2) {
               if(arraysEqual(v, v2)) {
                   noDuplicateEntry = false;
               }
            });
            if(noDuplicateEntry) {
                temp.setItem(i, v);
                i++;
            }
        });

        // remove unnecessary entries
        // we can have multiple entries for an input element, if the user first
        // tagged wrongly and then corrected his choice; we only keep the last one
        i = 0;
        temp.each(function(k, v) {
            if(v[0] === "Input") {
                var noNewerEntry = true;
                var key;
                result.each(function(k2, v2) {
                    // check if position of input element on the site is the same -> same element
                    if(v[3] === v2[3] && k > k2) {
                        noNewerEntry = false;
                        key = k2;
                    }
                });
                if(noNewerEntry) {
                    result.setItem(i, v);
                    i++;
                } else {
                    result.removeItem(key);
                    result.setItem(key, v);
                }
            } else {
                result.setItem(i, v);
                i++;
            }
        });

        return result;
    }

    // adds new entries to the context menu
    function buildContextMenu(loginDone) {
        if(loginDone) {
            RecordingMenu = cm.Menu({
                label: "Markieren als:",
                contentScriptFile: self.data.url("ContextMenuContentScript.js"),
                onMessage: function (m) {
                    console.log("thats the event " + m[0]);
                    // process the message
                    setInputBlurEventHandler(m);
                    // highlight tagged input element
                    sendDataToWorker(m);
                },
                items: [
                    cm.Item({label: "Aktuelles Passwort", data: "currentPassword"}),
                    cm.Item({label: "Neues Passwort", data: "newPassword"})
                ]
            });
        } else {
            RecordingMenu = cm.Menu({
                label: "Markieren als:",
                contentScriptFile: self.data.url("ContextMenuContentScript.js"),
                onMessage: function (m) {
                    console.log("thats the event " + m[0]);
                    // process the message
                    setInputBlurEventHandler(m);
                    // highlight tagged input element
                    sendDataToWorker(m);
                },
                items: [
                    cm.Item({label: "Benutzername/Email", data: "usernameOrEmail"}),
                    cm.Item({label: "Aktuelles Passwort", data: "currentPassword"})
                ]
            });
        }
    }

    // setting of parameters when a input field is marked via context menu
    function setInputBlurEventHandler(m) {
        var inputs = window.content.document.getElementsByTagName("input");
        tagTracker.setItem(m[0], m[1]);
        inputs[m[0]].addEventListener("blur", onBlurEventHandler, false);
    }

    // sends data that comes from ContextMenuScript to RecordersPageContentScript for highlighting input elements
    function sendDataToWorker(m) {
        worker = tabs.activeTab.attach({
            contentScriptFile: self.data.url("RecorderPageContentScript.js")
        });
        worker.port.emit("ContextMenuClick", m);
    }

    // destroys added entries from contextmenu again
    function destroyContextMenu() {
        RecordingMenu.destroy();
    }
};