/*
 This is the heart of PasswordChanger
 Passwordchange algorithm is implemented in this class
 */
var Hashtable = require('lib/Hashtable');
var {viewFor} = require('sdk/view/core');
var windows = require('sdk/windows').browserWindows;
var window = viewFor(require('sdk/windows').browserWindows[0]);
var {Ci} = require('chrome');
var tabs = require('sdk/tabs');
var PasswordGen = require('lib/PasswordGen');
var self = require('sdk/self');
var utils = require('lib/Utils');

/*
 Imitator class have to be instantiated with:
 obj: hashtable that contains blueprint for website
 username: is the username for logging in in the account
 url: the url of the website where password should be changed
 */
module.exports = function Imitator(obj, username, url, languageStrings) {
    var maxStepNum;
    var actualStepNum = 0;
    var lastStepNum = 0;
    var worker;
    var pwList = null;
    var newPassword;
    var hiddenWin = null;
    var pwg = new PasswordGen(10, 5, 5, 0);
    var eventDOMContentLoadedTriggered = false;
    let siteLoadDelay = 4000;
    let clickOrInputDelay = 1000;
    let eventLock = false;

    this.testhook = {
        returnHiddenWin: hiddenWin,
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

    /*
     opens a browser window
     */
    this.StartImitating = function () {
        console.log("imitating started");
        // initialize variables
        actualStepNum = 0;
        lastStepNum = 0;
        newPassword = "";
        maxStepNum = obj.length;
        pwList = utils.getPasswordList();
        hiddenWin = window.open(url, 'hiddenWindow');
        hiddenWin = hiddenWin
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIWebNavigation)
            .QueryInterface(Ci.nsIDocShellTreeItem).rootTreeItem
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindow);

        hiddenWin.getBrowser().addEventListener("DOMContentLoaded", DomContentLoadedEvent = function (e) {
            // make sure changeAlgorithm is only started once for each new
            // site loading, even if DOMContentLoaded event is triggered multiple
            // times (e.g. if site has embedded iframes)
            if (e.target.isSameNode(hiddenWin.content.document)) {
                // only checking the event target does not cover all
                // cases, so lock after seeing the first correct event
                if (!eventLock) {
                    eventLock = true;
                    eventDOMContentLoadedTriggered = true;
                    hiddenWin.setTimeout(function () {
                        eventLock = false;
                        changeAlgorithm();
                    }, siteLoadDelay);
                }
            }
        });
        hiddenWin.focus(); // this window should actually be hidden
    };

    /*
     Algorithm that performs automatic password change
     */
    function changeAlgorithm() {
        if (actualStepNum < maxStepNum) {
            var item = obj.getItem(actualStepNum);
            var nextEvent = item[0];
            var currentWebsite = hiddenWin.content.location.href;
            var websiteTrunk = (currentWebsite.split("?"))[0];
            switch (nextEvent) {
                case "Input":
                    var tag = item[1];
                    var numberOfInputElements = item[2];
                    var positionOfInputElement = item[3];
                    var websiteURL = item[4];
                    if (utils.removeTrailingSlash(websiteTrunk) != utils.removeTrailingSlash(websiteURL)) {
                        // we are on the wrong website -> abort
                        stopImitating("input should be filled, but we are on the wrong website\n  should be " + utils.removeTrailingSlash(mustWebsiteURL) + "\n  actually is " + utils.removeTrailingSlash(websiteTrunk));
                    } else {
                        performInput(tag, numberOfInputElements, positionOfInputElement);
                        actualStepNum++;
                    }
                    break;
                case "Click" :
                    var mustXCoord = item[1];
                    var mustYCoord = item[2];
                    var mustWindowHeight = item[3];
                    var mustWindowWidth = item[4];
                    var mustScrollTop = item[5];
                    var mustWebsiteURL = item[6];
                    let triggersSiteLoad = item[7];
                    if (utils.removeTrailingSlash(websiteTrunk) != utils.removeTrailingSlash(mustWebsiteURL)) {
                        // we are on the wrong website -> abort
                        stopImitating("click should be performed, but we are on the wrong website\n  should be " + utils.removeTrailingSlash(mustWebsiteURL) + "\n  actually is " + utils.removeTrailingSlash(websiteTrunk));
                    } else {
                        if ((hiddenWin.innerHeight != mustWindowHeight) || (hiddenWin.innerWidth != mustWindowWidth)) {
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

    /*
     changes size of window
     newHeight: new height of the window
     newWidth: new width of the window
     */
    function changeWindowSize(newHeight, newWidth) {
        hiddenWin.resizeTo(newWidth, newHeight);
    }

    /*
     fills in an input field
     tag: Indicator whether to input username, current password or new password
     numberOfInputElements: number of input elements we expect on the site
     positionOfInputElement: identifies with input element should be filled
     */
    function performInput(tag, numberOfInputElements, positionOfInputElement) {
        worker = tabs.activeTab.attach({
            contentScriptFile: [self.data.url("ModifyingPageContentScript.js"), self.data.url("jquery.min.js")]
        });
        switch (tag) {
            case "U":
                worker.port.emit("fillInput", [username, numberOfInputElements, positionOfInputElement]);
                break;
            case "C":
                worker.port.emit("fillInput", [utils.getCurrentPassword(url, username, pwList), numberOfInputElements, positionOfInputElement]);
                break;
            case "N":
                if (newPassword === "") {
                    newPassword = pwg.generatePassword();
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
            hiddenWin.setTimeout(function () {
                changeAlgorithm();
            }, clickOrInputDelay);
        });
    }

    /*
     Clicks at (x,y) position in the web page
     xCoord: clientX-coordinate of click event
     yCoord: clientY-coordinate of click event
     mustScrollTop: scrollTop of window element for calibrating the viewport on website
     */
    function performClick(xCoord, yCoord, mustScrollTop, triggersSiteLoad) {
        worker = tabs.activeTab.attach({
            contentScriptFile: [self.data.url("ModifyingPageContentScript.js"), self.data.url("jquery.min.js")]
        });
        eventDOMContentLoadedTriggered = false;
        worker.port.emit("xyCoords", [xCoord, yCoord, mustScrollTop]);
        worker.port.on("clickDone", function () {
            if (triggersSiteLoad === "false")
                hiddenWin.setTimeout(function () {
                    // click done, go on
                    changeAlgorithm();
                }, clickOrInputDelay);
        });
    }

    /*
     intern function for stopping the process of imitation
     removes all listener
     stores new password in password manager
     */
    function stopImitating(reason = "unknown") {
        console.log("imitating stopped, reason: " + reason);
        hiddenWin.getBrowser().removeEventListener("DOMContentLoaded", DomContentLoadedEvent, false);

        // inform user if something went wrong
        if (actualStepNum !== maxStepNum) {
            clearSensibleData();
            hiddenWin.close();

            let message = languageStrings["imitator change failed"];
            if (newPassword !== "")
                message += languageStrings.format(languageStrings["imitator change failed new password is"], newPassword);
            window.alert(message);
        }

        //store new password in password manager if there is a new password
        if (newPassword !== "") {
            // the following is mostly the same as in utils.storePasswordToFFPWManager(),
            // but we cannot use this function here, because we need asynchronous onComplete
            var oldData;
            for (var i = 0; i < pwList.length; i++) {
                if (pwList.getItem(i)[2] == url && pwList.getItem(i)[0] == username) {
                    oldData = pwList.getItem(i);
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
                            hiddenWin.close();
                            window.alert(languageStrings["password_has_been_successfully_changed"]);
                        },
                        onError: function (error) {
                            clearSensibleData();
                            hiddenWin.close();
                            window.alert(languageStrings["imitator failed to save new password old deleted"]);
                        }
                    });
                },
                onError: function () {
                    clearSensibleData();
                    hiddenWin.close();
                    window.alert(languageStrings["imitator failed to save new password already changed"]);
                }
            });
        }
    }

    /*
     clears all relevant variables
     */
    function clearSensibleData() {
        pwList = null;
        newPassword = "";
    }
};