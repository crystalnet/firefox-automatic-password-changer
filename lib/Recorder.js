/*
 This is the recorder class that can be used to record blueprints
 */
let tabs = require('sdk/tabs');
const {Ci} = require('chrome');
const {viewFor} = require('sdk/view/core');
const Hashtable = require('lib/Hashtable');
const contextMenu = require('sdk/context-menu');
const self = require('sdk/self');
const utils = require('lib/Utils');

let window = viewFor(require('sdk/windows').browserWindows[0]);

module.exports = function Recorder(lang) {
    let languageStrings = lang;
    let orderNumber = 0;
    let isActive = false;
    let userWebPath = null;
    let webPage = "";
    let pwList = null;
    let RecordingMenu;
    let worker;
    let currentWebsite = "";
    let eventDOMContentLoadedfired = false;
    let loginDone = false;
    let tagTracker = null;
    let scrollPosition = 0;
    let clickTempStore = null;

    // information for password manager
    let loginData = {
        password: "",
        username: "",
        passwordField: "",
        usernameField: "",
        formSubmitURL: "",
        formActiveURL: ""
    };

    // set local variable to const module to allow injection for tests
    //let tabs = tabs;

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

    /**
     start logging and add listener
     */
    this.StartRecording = function () {
        console.log("recording started");
        // is recording now
        isActive = true;

        // new Hashtables
        userWebPath = new Hashtable();
        tagTracker = new Hashtable();

        // reset webPage here, because the value is still needed after a stopRecording call.
        webPage = "";

        // get passwords from PM
        // password list is later used after recording stopped when storing the new password
        pwList = utils.getPasswordList();

        // build a context menu and attach script
        buildContextMenu(false);

        // event listener for click event
        // initial listener, because side is already loaded when recording starts
        window.content.document.addEventListener('click', onClickEventHandler, false);
        window.addEventListener('DOMContentLoaded', onDOMContentLoadedEventHandler, false);
    };

    function onDOMContentLoadedEventHandler(e) {
        if (e.target.isSameNode(window.content.document)) {
            eventDOMContentLoadedfired = true;
            // reattach event listeners every time site loads new document
            registerEventHandlers();
            scrollPosition = 0;
            currentWebsite = window.content.location.href;
            if (loginData.username !== "") {
                loginDone = true;
                // when login is done, the user should not have the option to tag an input element with
                // the tag "U" for username anymore, as we would collect wrong information in this case
                destroyContextMenu();
                buildContextMenu(true);
            }
            // we need a fresh tagTracker, as there are other input elements on the new page
            tagTracker.clear();
            if (clickTempStore !== null) {
                // if temporary click storage is not null, last click did trigger site load
                clickTempStore[1][clickTempStore[1].length - 1] = "true";
                userWebPath.setItem(clickTempStore[0], clickTempStore[1]);
                clickTempStore = null;
            }
        }
    }

    /**
     handles click events
     */
    function onClickEventHandler(e) {
        let scrollTop = scrollPosition;
        if (!eventDOMContentLoadedfired) {
            // special case when "DOMContentLoaded" event does not bubble up to window object on site load
            if (utils.getMainPageFromLink(currentWebsite) !== utils.getMainPageFromLink(window.content.location.href)) {
                scrollPosition = window.content.document.documentElement.scrollTop;
                if (clickTempStore !== null) {
                    clickTempStore[1][clickTempStore[1].length - 1] = "true";
                    userWebPath.setItem(clickTempStore[0], clickTempStore[1]);
                    clickTempStore = null;
                }
            }
            currentWebsite = window.content.location.href;
        }
        eventDOMContentLoadedfired = false;
        // cut of arguments of website string
        let websiteTrunk = currentWebsite.split("?");
        // ignore right button click, which is used for context menu
        if (e.button !== 2) {
            // clear temporary click storage first, if last click did not trigger site load
            if (clickTempStore !== null)
                userWebPath.setItem(clickTempStore[0], clickTempStore[1]);
            clickTempStore = [orderNumber, ["Click", e.clientX, e.clientY, window.innerHeight, window.innerWidth, scrollTop, websiteTrunk[0], "false"]];
            orderNumber++;
        }
    }

    /**
     handles scroll events
     */
    function onScrollEventHandler() {
        scrollPosition = window.content.document.documentElement.scrollTop;
    }

    /**
     handles blur events
     */
    function onBlurEventHandler(e) {
        let node = e.target;
        // nodeNumber is the position of the node inside the collection of all
        // input elements; we use this number to identify the node on the page
        let nodeNumber;
        let inputs = window.content.document.getElementsByTagName("input");
        for (let i = 0; i < inputs.length; i++) {
            if (inputs[i].isSameNode(node)) {
                nodeNumber = i;
                break;
            }
        }
        let tag = tagTracker.getItem(nodeNumber);
        if (!eventDOMContentLoadedfired && utils.getMainPageFromLink(currentWebsite) !== utils.getMainPageFromLink(window.content.location.href)) {
            // special case when "DOMContentLoaded" event does not bubble up to window object on site load
            scrollPosition = window.content.document.documentElement.scrollTop;
            if (clickTempStore !== null) {
                clickTempStore[1][clickTempStore[1].length - 1] = "true";
                userWebPath.setItem(clickTempStore[0], clickTempStore[1]);
                clickTempStore = null;
            }
        }
        let websiteTrunk = (tabs.activeTab.url.split("?"))[0];
        // clear temporary click storage if necessary before setting input item
        if (clickTempStore !== null) {
            userWebPath.setItem(clickTempStore[0], clickTempStore[1]);
            clickTempStore = null;
        }
        // we might set duplicate entries for an input element at this point, if the user
        // focuses an input element more than once (to correct a wrongly typed password for
        // example); these duplicates are removed after recording, so that we only have one
        // "Input" entry in the blueprint for each input element
        userWebPath.setItem(orderNumber, ["Input", tag, inputs.length, nodeNumber, websiteTrunk]);
        orderNumber++;
        // store values we need for changing the password after recording stopped
        if (tag === "U" && !loginDone) {
            loginData.formSubmitURL = node.form.action;
            loginData.formActiveURL = utils.getMainPageFromLink(websiteTrunk);
            loginData.username = node.value;
            loginData.usernameField = node.name;
            // this will be the key in hashtable in simple-storage
            webPage = utils.getMainPageFromLink(websiteTrunk);
        }
        if (tag === "C" && !loginDone) {
            loginData.passwordField = node.name;
        }
        if (tag === "N") {
            loginData.password = node.value;
        }
    }

    /**
     stops logging actions and remove all listener
     returns a blueprint as hashtable
     */
    this.StopRecording = function () {
        console.log("recording stopped");
        destroyContextMenu();
        window.content.document.removeEventListener('click', onClickEventHandler, false);
        window.content.document.removeEventListener('scroll', onScrollEventHandler, false);
        window.removeEventListener("DOMContentLoaded", onDOMContentLoadedEventHandler, false);

        // save last click, if not yet done
        if (clickTempStore !== null)
            userWebPath.setItem(clickTempStore[0], clickTempStore[1]);

        let resultPath = null;
        if (userWebPath !== null) {
            userWebPath = CleanUpHashtable(userWebPath);
            if (sanityCheck(userWebPath)) {
                resultPath = userWebPath;
                // store password in password manager
                console.log("storing new password...");
                utils.storePasswordToFFPWManager(loginData.formActiveURL, loginData.username, loginData.password, loginData.passwordField, loginData.usernameField, loginData.formSubmitURL, pwList);
            }
        }

        // clear all variables as recorder is only instantiated
        // once by the add-on and reused for each recording
        orderNumber = 0;
        isActive = false;
        userWebPath = null;
        pwList = null;
        loginData = {
            password: "",
            username: "",
            passwordField:"",
            usernameField: "",
            formSubmitURL:"",
            formActiveURL:""
        };
        eventDOMContentLoadedfired = false;
        loginDone = false;
        scrollPosition = 0;
        tagTracker.clear();
        clickTempStore = null;

        return resultPath;
    };

    /*
     performs a sanityCheck on the path of user actions recorded
     returns true, if blueprint has at least one item where the user tagged an input element as new
     password and it happens at least one site load after filling in the new password (excludes most cases where
     the user typed in a new password, tagged the input element and then stops recording without submitting
     the password change); also a new password has to be known by the recorder (excludes cases where the
     user tagged an input element as new password, but did not type in anything); this sanity check is not
     bulletproof: if the user types in a new password, tags the input element and then changes the site
     without submitting the password change, the recorder would store the new password in the password manager
     and save a blueprint; this case is
     */
    function sanityCheck(userWebPath) {
        let conditionMet = false;
        let hasNewPasswordInputEntry = false;
        userWebPath.each(function (k, v) {
            if (v[0] === "Click" && v[7] === "true" && hasNewPasswordInputEntry)
                conditionMet = true;
            if (v[0] === "Input" && v[1] === "N")
                hasNewPasswordInputEntry = true;
        });
        return conditionMet && loginData.password !== "";
    }

    /**
     * read-only access to the isActive property
     * @return {boolean} true if the recorder is currently recording, false if the recorder is inactive.
     */
    this.RecorderIsActive = function () {
        return isActive;
    };

    /**
     * read-only access to the GetWebPage4PWChange property
     * (used in passwordChanger.js when storing a new blueprint)
     * @return {string} the webpage on which the password is changed.
     */
    this.GetWebPage = function () {
        return webPage;
    };

    /**
     Cleans up the hashtable
     */
    function CleanUpHashtable(hash) {
        function arraysEqual(a, b) {
            if (a === b)
                return true;
            if ((a == null || b == null) || (a.length != b.length))
                return false;

            for (let i = 0; i < a.length; ++i) {
                if (a[i] !== b[i])
                    return false;
            }
            return true;
        }

        // remove duplicate entries (e.g. user clicked twice on the same spot)
        let temp = new Hashtable();
        let i = 0;
        hash.each(function (k, v) {
            let noDuplicateEntry = true;
            hash.each(function (k2, v2) {
                if (k2 > k && arraysEqual(v, v2)) {
                    noDuplicateEntry = false;
                }
            });
            if (noDuplicateEntry) {
                temp.setItem(i, v);
                i++;
            }
        });
        // remove unnecessary entries
        // we can have multiple entries for an input element between site load events, if the
        // user first tagged wrongly and then corrected his choice; we only keep the last one
        let result = new Hashtable();
        i = 0;
        let lastSiteLoadClickKey = -1;
        temp.each(function (k, v) {
            if (v[0] === "Input") {
                let olderEntryFound = false;
                let key;
                result.each(function (k3, v3) {
                    if (v3[0] === "Input") {
                        // for all input items that came after the last site load, but before the current item
                        // we are looking at right now (implicit, because the are stored in result already),
                        // check if position of input element on the site is the same -> same element, but older entry
                        if (v[3] === v3[3] && k3 > lastSiteLoadClickKey) {
                            olderEntryFound = true;
                            key = k3;
                        }
                    }
                });
                if (olderEntryFound && typeof key !== 'undefined') {
                    // override older entry
                    result.removeItem(key);
                    result.setItem(key, v);
                } else {
                    result.setItem(i, v);
                    i++;
                }
            } else {
                // else case is for click items
                if (v[7] === "true")
                    lastSiteLoadClickKey = i;
                result.setItem(i, v);
                i++;
            }
        });
        return result;
    }

    /**
     adds new entries to the context menu
     */
    function buildContextMenu(loginDone) {
        let items = [];
        if (loginDone) {
            items = [
                contextMenu.Item({label: languageStrings["current password"], data: "currentPassword"}),
                contextMenu.Item({label: languageStrings["new password"], data: "newPassword"})
            ];
        } else {
            items = [
                contextMenu.Item({label: languageStrings["username slash mail"], data: "usernameOrEmail"}),
                contextMenu.Item({label: languageStrings["current password"], data: "currentPassword"})
            ];
        }

        RecordingMenu = contextMenu.Menu({
            label: languageStrings['tag as'] + ":",
            contentScriptFile: self.data.url("ContextMenuContentScript.js"),
            onMessage: function (m) {
                // process the message
                setInputBlurEventHandler(m);
                // highlight tagged input element
                sendDataToWorker(m);
            },
            items: items
        });
    }

    /**
     setting of parameters when a input field is marked via context menu
     */
    function setInputBlurEventHandler(m) {
        let inputs = window.content.document.getElementsByTagName("input");
        tagTracker.setItem(m[0], m[1]);
        inputs[m[0]].addEventListener("blur", onBlurEventHandler, false);
    }

    /**
     sends data that comes from ContextMenuScript to RecordersPageContentScript for highlighting input elements
     */
    function sendDataToWorker(m) {
        worker = tabs.activeTab.attach({
            contentScriptFile: self.data.url("RecorderPageContentScript.js")
        });
        worker.port.emit("ContextMenuClick", m);
    }

    /**
     destroys added entries from contextmenu again
     */
    function destroyContextMenu() {
        RecordingMenu.destroy();
    }

    /**
     registers all necessary event handlers on the document object of the window
     */
    function registerEventHandlers() {
        window.content.document.removeEventListener('click', onClickEventHandler, false);
        window.content.document.addEventListener('click', onClickEventHandler, false);
        window.content.document.removeEventListener('scroll', onScrollEventHandler, false);
        window.content.document.addEventListener('scroll', onScrollEventHandler, false);
        // special case for google button which prevents bubbling of click event up to the document
        let googleAccountButton = window.content.document.querySelector("a[href^='https://accounts.google.com/SignOutOptions']");
        if (googleAccountButton !== null) {
            googleAccountButton.removeEventListener('click', onClickEventHandler, false);
            googleAccountButton.addEventListener('click', onClickEventHandler, false);
        }
    }
};