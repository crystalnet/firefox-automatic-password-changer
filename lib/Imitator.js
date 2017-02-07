/*
 This is the heart of PasswordChanger
 Passwordchange algorithm is implemented in this class
 */
const Hashtable = require('lib/Hashtable');
const {viewFor} = require('sdk/view/core');
let windows = require('sdk/windows').browserWindows;
let window = viewFor(require('sdk/windows').browserWindows[0]);
const {Ci} = require('chrome');
let tabs = require('sdk/tabs');
const PasswordGen = require('lib/PasswordGen');
const self = require('sdk/self');
const utils = require('lib/Utils');

/**
 * Imitator class have to be instantiated with:
 * @param obj hashtable object that contains the blueprint for changing password at certain url
 * @param username the username for the account
 * @param url the url of the website where a password should be changed
 * @param languageStrings access to localization
 */
module.exports = function Imitator(obj, username, url, languageStrings) {
    let maxStepNum;
    let actualStepNum = 0;
    let lastStepNum = 0;
    let worker;
    let passwordList = null;
    let newPassword;
    let hiddenWindow = null;
    let passwordGenerator = new PasswordGen(10, 5, 5, 0);
    let eventDOMContentLoadedTriggered = false;
    const siteLoadDelay = 4000;
    const clickOrInputDelay = 1000;
    let eventLock = false;

    this.testhook = {
        returnHiddenWin: hiddenWindow,
        returnWindow: window,
        changeAlgorithm: changeAlgorithm,
        obj: function (obj2) {
            obj = obj2;
        },
        actualStepNum: function (value) {
            actualStepNum = value;
        },
        injectTabs: function (value) {
            tabs = value;
        },
        setWindow: function (value) {
            window = value;
        }
    };

    /**
     * opens a browser window
     */
    this.StartImitating = function () {
        console.log("imitating started");
        // initialize variables
        actualStepNum = 0;
        lastStepNum = 0;
        newPassword = "";
        maxStepNum = obj.length;
        passwordList = utils.getPasswordList();
        // we start imitation on site where user started recording
        let firstItem = obj.getItem(0);
        let startURL = firstItem[0] === "Click" ? firstItem[6] : firstItem[4];
        hiddenWindow = window.open(startURL, 'hiddenWindow');
        hiddenWindow = hiddenWindow
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIWebNavigation)
            .QueryInterface(Ci.nsIDocShellTreeItem).rootTreeItem
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindow);

        hiddenWindow.getBrowser().addEventListener("DOMContentLoaded", onDOMContentLoadedEventHandler);
        hiddenWindow.focus(); // this window should actually be hidden
    };

    function onDOMContentLoadedEventHandler(e) {
        // make sure changeAlgorithm is only started once for each new
        // site loading, even if DOMContentLoaded event is triggered multiple
        // times (e.g. if site has embedded iframes)
        if (e.target.isSameNode(hiddenWindow.content.document)) {
            // only checking the event target does not cover all
            // cases, so lock after seeing the first correct event
            if (!eventLock) {
                eventLock = true;
                eventDOMContentLoadedTriggered = true;
                hiddenWindow.setTimeout(function () {
                    eventLock = false;
                    changeAlgorithm();
                }, siteLoadDelay);
            }
        }
    }

    /**
     * Algorithm that performs automatic password change
     */
    function changeAlgorithm() {
        if (actualStepNum < maxStepNum) {
            let item = obj.getItem(actualStepNum);
            let nextEvent = item[0];
            let currentWebsite = hiddenWindow.content.location.href;
            let websiteTrunk = (currentWebsite.split("?"))[0];
            switch (nextEvent) {
                case "Input":
                    let tag = item[1];
                    let numberOfInputElements = item[2];
                    let positionOfInputElement = item[3];
                    let websiteURL = item[4];
                    if (utils.removeTrailingSlash(websiteTrunk) !== utils.removeTrailingSlash(websiteURL)) {
                        // we are on the wrong website -> abort
                        stopImitating("input should be filled, but we are on the wrong website\n  should be " + utils.removeTrailingSlash(websiteURL) + "\n  actually is " + utils.removeTrailingSlash(websiteTrunk));
                    } else {
                        performInput(tag, numberOfInputElements, positionOfInputElement);
                        actualStepNum++;
                    }
                    break;
                case "Click" :
                    let mustXCoord = item[1];
                    let mustYCoord = item[2];
                    let mustWindowHeight = item[3];
                    let mustWindowWidth = item[4];
                    let mustScrollTop = item[5];
                    let mustWebsiteURL = item[6];
                    let triggersSiteLoad = item[7];
                    if (utils.removeTrailingSlash(websiteTrunk) !== utils.removeTrailingSlash(mustWebsiteURL)) {
                        // we are on the wrong website -> abort
                        stopImitating("click should be performed, but we are on the wrong website\n  should be " + utils.removeTrailingSlash(mustWebsiteURL) + "\n  actually is " + utils.removeTrailingSlash(websiteTrunk));
                    } else {
                        if ((hiddenWindow.content.innerHeight != mustWindowHeight) || (hiddenWindow.content.innerWidth != mustWindowWidth)) {
                            // change size of window if necessary to match click coordinates
                            changeWindowSize(mustWindowHeight, mustWindowWidth);
                        }
                        performClick(mustXCoord, mustYCoord, mustScrollTop, triggersSiteLoad);
                        actualStepNum++;
                    }
                    break;
                default:
                    console.log("event unknown: " + nextEvent);
                    actualStepNum++;
                    changeAlgorithm();
                    break;
            }
        } else {
            stopImitating("done");
        }
    }

    /**
     * changes size of window to handle size differences due to toolbars or bookmark sidebar
     * @param newHeight new inner height of the window
     * @param newWidth new inner width of the window
     */
    function changeWindowSize(newHeight, newWidth) {
        let widthDifference = newWidth - hiddenWindow.content.innerWidth;
        let heightDifference = newHeight - hiddenWindow.content.innerHeight;
        hiddenWindow.resizeBy(widthDifference, heightDifference);
    }

    /**
     * fills in an input field
     * @param tag Indicator whether to input username, current password or new password
     * @param numberOfInputElements number of input elements we expect on the site
     * @param positionOfInputElement identifies with input element should be filled
     */
    function performInput(tag, numberOfInputElements, positionOfInputElement) {
        worker = tabs.activeTab.attach({
            contentScriptFile: self.data.url("ModifyingPageContentScript.js")
        });
        switch (tag) {
            case "U":
                worker.port.emit("fillInput", [username, numberOfInputElements, positionOfInputElement]);
                break;
            case "C":
                worker.port.emit("fillInput", [utils.getCurrentPassword(url, username, passwordList), numberOfInputElements, positionOfInputElement]);
                break;
            case "N":
                if (newPassword === "") {
                    newPassword = passwordGenerator.generatePassword();
                }
                worker.port.emit("fillInput", [newPassword, numberOfInputElements, positionOfInputElement]);
                break;
        }
        worker.port.on("errorNumberOfInputElements", function () {
            // site has changed since recording the blueprint, abort
            stopImitating("input should be filled, but site has changed since recording the blueprint");
        });
        worker.port.on("inputDone", function () {
            // input done, go on
            hiddenWindow.setTimeout(function () {
                changeAlgorithm();
            }, clickOrInputDelay);
        });
    }

    /**
     * Clicks at (x,y) position in the web page
     * @param xCoord clientX-coordinate of click event
     * @param yCoord clientY-coordinate of click event
     * @param mustScrollTop scrollTop of window element for calibrating the viewport on website
     * @param triggersSiteLoad
     */
    function performClick(xCoord, yCoord, mustScrollTop, triggersSiteLoad) {
        worker = tabs.activeTab.attach({
            contentScriptFile: self.data.url("ModifyingPageContentScript.js")
        });
        eventDOMContentLoadedTriggered = false;
        worker.port.emit("xyCoords", [xCoord, yCoord, mustScrollTop]);
        worker.port.on("clickDone", function () {
            if (triggersSiteLoad === "false")
                hiddenWindow.setTimeout(function () {
                    // click done, go on
                    changeAlgorithm();
                }, clickOrInputDelay);
        });
    }

    /**
     * intern function for stopping the process of imitation
     * removes all listener and stores new password in password manager
     * @param reason
     */
    function stopImitating(reason = "unknown") {
        console.log("imitating stopped, reason: " + reason);
        hiddenWindow.getBrowser().removeEventListener("DOMContentLoaded", onDOMContentLoadedEventHandler, false);

        // inform user if something went wrong
        if (actualStepNum !== maxStepNum) {
            clearSensibleData();
            hiddenWindow.close();

            let message = languageStrings["imitator change failed"];
            if (newPassword !== "")
                message += languageStrings.format(languageStrings["imitator change failed new password is"], newPassword);
            window.alert(message);
        }

        //store new password in password manager if there is a new password
        if (newPassword !== "") {
            // the following is mostly the same as in utils.storePasswordToFFPWManager(),
            // but we cannot use this function here, because we need asynchronous onComplete
            let oldData;
            for (let i = 0; i < passwordList.length; i++) {
                if (passwordList.getItem(i)[2] === url && passwordList.getItem(i)[0] === username) {
                    oldData = passwordList.getItem(i);
                    break;
                }
            }
            require("sdk/passwords").remove({
                username: oldData[0],
                password: oldData[1],
                url: oldData[2],
                usernameField: oldData[3],
                passwordField: oldData[4],
                formSubmitURL: oldData[5],
                onComplete: function () {
                    require("sdk/passwords").store({
                        username: oldData[0],
                        password: newPassword,
                        url: oldData[2],
                        usernameField: oldData[3],
                        passwordField: oldData[4],
                        formSubmitURL: oldData[5],
                        onComplete: function () {
                            clearSensibleData();
                            hiddenWindow.close();
                            window.alert(languageStrings["password_has_been_successfully_changed"]);
                        },
                        onError: function () {
                            clearSensibleData();
                            hiddenWindow.close();
                            window.alert(languageStrings["imitator failed to save new password old deleted"]);
                        }
                    });
                },
                onError: function () {
                    clearSensibleData();
                    hiddenWindow.close();
                    window.alert(languageStrings["imitator failed to save new password already changed"]);
                }
            });
        }
    }

    /**
     * clears all relevant variables
     */
    function clearSensibleData() {
        passwordList = null;
        newPassword = "";
    }
};