/*
This is the heart of PasswordChanger 
Passwordchange algorithm is implemented in this class
*/
var Hashtable = require('lib/Hashtable');
var { viewFor } = require('sdk/view/core');
var windows = require('sdk/windows').browserWindows;
var window = viewFor(require('sdk/windows').browserWindows[0]);
var { Ci } = require('chrome');
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
module.exports = function Imitator(obj, username, url){
    var maxStepNum;
    var actualStepNum = 0;
    var lastStepNum = 0;
    var worker;
    var pwList = null;
    var newPassword;
    var hiddenWin = null;
    var pwg = new PasswordGen(10,5,5,0);
    var eventDOMContentLoadedTriggered = false;
    var delay = 3000;
    var delay2 = 4000;

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
	this.StartImitating = function() {
		console.log("imitating started");
		// initialize variables
        actualStepNum = 0;
        lastStepNum = 0;
        newPassword = "";
        maxStepNum = obj.length;
        pwList = utils.getPasswordList();
		hiddenWin = window.open(url,'hiddenWindow');
		hiddenWin = hiddenWin
	      .QueryInterface(Ci.nsIInterfaceRequestor)
	      .getInterface(Ci.nsIWebNavigation)
	      .QueryInterface(Ci.nsIDocShellTreeItem).rootTreeItem
	      .QueryInterface(Ci.nsIInterfaceRequestor)
	      .getInterface(Ci.nsIDOMWindow);

        hiddenWin.getBrowser().addEventListener("DOMContentLoaded", DomContentLoadedEvent=function(){
            eventDOMContentLoadedTriggered = true;
            hiddenWin.setTimeout(function() {
                changeAlgorithm();
            }, delay);
		});
  		hiddenWin.focus(); // this window should actually be hidden
	};

	/*
	 Algorithm that performs automatic password change
	*/
	function changeAlgorithm() {
		if(actualStepNum < maxStepNum) {
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
						console.error("changeAlgo, Input case, item " + actualStepNum + "\n  website was " + utils.removeTrailingSlash(websiteTrunk) + "\n  should have been " + utils.removeTrailingSlash(websiteURL))
						stopImitating();
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
                    if (utils.removeTrailingSlash(websiteTrunk) != utils.removeTrailingSlash(mustWebsiteURL)) {
                        // we are on the wrong website -> abort
                        console.error("changeAlgo, Input case, item " + actualStepNum + "\n  website was " + utils.removeTrailingSlash(websiteTrunk) + "\n  should have been " + utils.removeTrailingSlash(websiteURL))
                        stopImitating();
                    } else {
                        if ((hiddenWin.innerHeight != mustWindowHeight) || (hiddenWin.innerWidth != mustWindowWidth)) {
                            // change size of window if necessary to match click coordinates
                            changeWindowSize(mustWindowHeight, mustWindowWidth);
                        }
                        performClick(mustXCoord, mustYCoord, mustScrollTop);
                        actualStepNum++;
					}
					break;
				default:
					console.error("event unknown: " + nextEvent);
					actualStepNum++;
					changeAlgorithm();
                    break;
			}
		} else {
			console.error("changeAlgo, actualStepNum < maxStepNum");
            stopImitating();
		}
	}

	/*
	 changes size of window
	 newHeight: new height of the window
	 newWidth: new width of the window
	*/
	function changeWindowSize(newHeight, newWidth){
		hiddenWin.resizeTo(newWidth,newHeight);
	}

	/*
	 fills in an input field
	 tag: Indicator whether to input username, current password or new password
	 numberOfInputElements: number of input elements we expect on the site
	 positionOfInputElement: identifies with input element should be filled
	*/
	function performInput(tag, numberOfInputElements, positionOfInputElement){
		worker = tabs.activeTab.attach({
  			contentScriptFile: [self.data.url("ModifyingPageContentScript.js"),self.data.url("jquery.min.js")]
		});
		switch(tag) {
            case "U":
                worker.port.emit("fillInput", [username, numberOfInputElements, positionOfInputElement]);
                break;
            case "C":
                worker.port.emit("fillInput", [utils.getCurrentPassword(url, username, pwList), numberOfInputElements, positionOfInputElement]);
                break;
			case "N":
                if(newPassword === ""){
                	newPassword = pwg.generatePassword();
                }
                worker.port.emit("fillInput", [newPassword, numberOfInputElements, positionOfInputElement]);
                break;
        }
		worker.port.on("errorNumberOfInputElements", function() {
            // site has changed since recording the blueprint, abort
			console.error("performInput, errorNumberOfInputElements");
            stopImitating();
        });
        worker.port.on("inputDone", function() {
            // input done, go on
			//changeAlgorithm();
            hiddenWin.setTimeout(function() {
                changeAlgorithm();
            }, delay);
        });
	}

	/*
	 Clicks at (x,y) position in the web page
	 xCoord: clientX-coordinate of click event
	 yCoord: clientY-coordinate of click event
	 mustScrollTop: scrollTop of window element for calibrating the viewport on website
	*/
	function performClick(xCoord, yCoord,mustScrollTop){
		worker = tabs.activeTab.attach({
  			contentScriptFile: [self.data.url("ModifyingPageContentScript.js"),self.data.url("jquery.min.js")]
		});
        eventDOMContentLoadedTriggered = false;
		worker.port.emit("xyCoords", [xCoord,yCoord,mustScrollTop]);
		worker.port.on("clickDone", function() {
            hiddenWin.setTimeout(function() {
            	if(!eventDOMContentLoadedTriggered)
                	// click done, but document did not change -> 'manually' restart changeAlgorithm()
            		changeAlgorithm();
            }, delay2);
		});
	}

	/*
	 intern function for stopping the process of imitation
	 removes all listener
	 stores new password in password manager
	*/
	function stopImitating(){
        console.log("imitating stopped");
		hiddenWin.getBrowser().removeEventListener("DOMContentLoaded",DomContentLoadedEvent,false);

		// inform user if something went wrong
		if(actualStepNum !== maxStepNum){
            clearSensibleData();
            hiddenWin.close();
            //TODO define languageString
			window.alert("Bei der Änderung des Passwords ist ein Fehler unterlaufen. Es könnte trotzdem geändert worden sein, ist in diesem Fall ist die Änderung aber nicht im Passwort-Manager eingetragen worden.");
		}

		//store new password in password manager if there is a new password
		if(newPassword !== ""){
			// the following is mostly the same as in utils.storePasswordToFFPWManager(),
			// but we cannot use this function here, because we need asynchronous onComplete
			var oldData;
			for(var i = 0; i < pwList.length; i++){
				if(pwList.getItem(i)[2] == url && pwList.getItem(i)[0] == username) {
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
                onComplete: function() {
                    require("sdk/passwords").store({
                        username: oldData[0],
                        password: newPassword,
                        url: oldData[2],
                        usernameField: oldData[3],
                        passwordField: oldData[4],
                        formSubmitURL: oldData[5],
                        onComplete: function(){
                            clearSensibleData();
                            hiddenWin.close();
                            //TODO define languageString
                            window.alert("Passwort wurde erfolgreich geändert.");
                        },
						onError: function(error) {
                            clearSensibleData();
                            hiddenWin.close();
                            //TODO define languageString
                            window.alert("Das alte Passwort wurde gelöscht, aber das neue konnte nicht eingetragen werden. Nutzen sie die Passwort-Reset Funktion der Webseite.");
						}
                    });
                },
                onError: function() {
                    clearSensibleData();
                    hiddenWin.close();
                    //TODO define languageString
                    window.alert("Das Passwort wurde wahrscheinlich geändert, konnte aber nicht im Passwort.Manager eingetragen werden. Nutzen sie die Passwort-Reset Funktion der Webseite.");
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