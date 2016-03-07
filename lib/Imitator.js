var Hashtable = require('lib/Hashtable');
var { viewFor } = require("sdk/view/core");
var windows = require("sdk/windows").browserWindows;
var window = viewFor(require("sdk/windows").browserWindows[0]);
var { Ci } = require('chrome');
var URL = require('sdk/url').URL;
var tabs = require('sdk/tabs');
var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var maxStepNum;
var actualStepNum = 0;
var hiddenWin;
var worker;
var username;
var oldPassword;


module.exports = function Imitator(obj,username, url){

	this.Init = function(){
		maxStepNum = obj.length;
		openNewWindow();
		fetchNDeleteOldLoginData(obj);
	}

	//opens a new tab in browser
	function openNewWindow(){
		hiddenWin = window.open(url,'hiddenWindow');
		hiddenWin = hiddenWin
	      .QueryInterface(Ci.nsIInterfaceRequestor)
	      .getInterface(Ci.nsIWebNavigation)
	      .QueryInterface(Ci.nsIDocShellTreeItem).rootTreeItem
	      .QueryInterface(Ci.nsIInterfaceRequestor)
	      .getInterface(Ci.nsIDOMWindow);

    	//event fires when url changes and new js get access to DOM
    	hiddenWin.getBrowser().addEventListener("DOMContentLoaded",DomContentLoadedEvent = function(){
    		console.log("window is loaded!");
    		changeAlgorithm();
    	}, false);
	
  		hiddenWin.focus(); // for testing only else hidden
  	}
  	

  	//Algorithm that performs automatic password change
  	function changeAlgorithm(){
		if(actualStepNum <= maxStepNum){

			// delete    DELETE     DELETE    DELETE // delete    DELETE     DELETE    DELETE 
			console.log("now username is", username);
			console.log("now oldPassword is", oldPassword);
			// delete    DELETE     DELETE    DELETE // delete    DELETE     DELETE    DELETE

			var nextEvent = obj.getItem(actualStepNum)[obj.getItem(actualStepNum).length - 1];
			console.log(nextEvent);

			switch(nextEvent){
				case "Submit": 
					var submitElement 	= obj.getItem(actualStepNum)[0];
					var mustWebsiteURL 	= obj.getItem(actualStepNum)[1];
					var nextEventIndex;

					if(tabs.activeTab.url != mustWebsiteURL)
					{
						console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + mustWebsiteURL);
						changeWebsite(mustWebsiteURL);
						return;
					}
					performSubmit(submitElement);
					console.log("submit from element: ", submitElement);
					console.log("on Website: ", mustWebsiteURL);
					

					actualStepNum++;

					nextEventIndex = determineEventAfterSubmit();

					if(obj.getItem(nextEventIndex)[obj.getItem(actualStepNum).length - 1] != "SiteChange"){
						changeAlgorithm(); // Recursion
					}
					
				break;
				case "Click" :
					var mustWebsiteURL 		= obj.getItem(actualStepNum)[0];
					var mustXCoord 			= obj.getItem(actualStepNum)[1];
					var mustYCoord 			= obj.getItem(actualStepNum)[2];
					var mustWindowHeight 	= obj.getItem(actualStepNum)[3];
					var mustWindowWidth 	= obj.getItem(actualStepNum)[4];

					if(tabs.activeTab.url != mustWebsiteURL){
						console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + mustWebsiteURL);
						changeWebsite(mustWebsiteURL);
						return;
					}
					console.log(hiddenWin.innerHeight + " " + hiddenWin.innerWidth);
					console.log(mustWindowHeight + " " + mustWindowWidth);

					if((hiddenWin.innerHeight != mustWindowHeight) || (hiddenWin.innerWidth != mustWindowWidth)){
						changeWindowSize(mustWindowHeight,mustWindowWidth);
					}

					console.log("click at coordinates X: " + mustXCoord + " Y : " + mustYCoord);
					console.log("on Website: ", mustWebsiteURL);
					
					performClick(mustXCoord,mustYCoord);
					actualStepNum++;
					changeAlgorithm(); // Attention recursion! VERMEIDEN!!!!!!!!!!!!
				break;
				case "Input" : 
					var lastValidEventIndex = getLastIndexOfInput(obj,actualStepNum);
					var nextValidEventIndex = getNextIndexOfInput();

					var elementID 			= obj.getItem(actualStepNum)[0];
					var lastElementID 		= obj.getItem(lastValidEventIndex)[0];
					var mustWebsiteURL 		= obj.getItem(actualStepNum)[1];
					var elementType 		= obj.getItem(actualStepNum)[3];
					var lastElementType 	= obj.getItem(lastValidEventIndex)[3];
					var mustValue 			= obj.getItem(actualStepNum)[2];
					var valueOfNextElement 	= obj.getItem(nextValidEventIndex)[2];
					var valueOfLastElement 	= obj.getItem(lastValidEventIndex)[2];
					

					if(tabs.activeTab.url != mustWebsiteURL)
					{
						console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + mustWebsiteURL);
						changeWebsite(mustWebsiteURL);
						return;
					}
					if(elementType == "password"){
						if((valueOfLastElement == mustValue) && (lastElementType == elementType) && (lastElementID != elementID)){
							if(tabs.activeTab.url != mustWebsiteURL)
							{
								console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + mustWebsiteURL);
								changeWebsite(mustWebsiteURL);
								return;
							}
							// type new pw again
							console.log("fetch new pw again and type new password again at ", elementID);
							var pw = fetchNewPassword();
							performInput(pw,elementID);
							
						}
						else if(mustValue == valueOfNextElement){
							if(tabs.activeTab.url != mustWebsiteURL)
							{
								console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + mustWebsiteURL);
								changeWebsite(mustWebsiteURL);
								return;
							}
							//type new pw
							console.log("fetch new pw and type new password here at ", elementID);
							var pw = fetchNewPassword();
							performInput(pw,elementID);
							// hit enter
						}
						else{
							if(tabs.activeTab.url != mustWebsiteURL)
							{
								console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + mustWebsiteURL);
								changeWebsite(mustWebsiteURL);
								return;
							}
							// type old pw
							console.log("fetch active pw and type old password here at ", elementID);
							var pw = fetchActivePassword();
							performInput(pw,elementID);
						}
					}
					else{

						if(tabs.activeTab.url != mustWebsiteURL)
						{
							console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + mustWebsiteURL);
							changeWebsite(mustWebsiteURL);
							return;
						}

						performInput(mustValue,elementID);
						console.log("type to element: ", elementID);
						console.log("on Website: ", mustWebsiteURL);
						console.log("a value of: ", mustValue);
						console.log("of type:", elementType);
					}
					actualStepNum++;
					changeAlgorithm(); // Attention recursion! VERMEIDEN
				break;
				case "SiteChange" : 
					var mustWebsiteURL = obj.getItem(actualStepNum)[0];
					console.log("website change to ", mustWebsiteURL);
					changeWebsite(mustWebsiteURL);
					actualStepNum++;
				break;
				default: console.log("event unknown: ", nextEvent);
				break;
			}	
		}
		else{
			hiddenWin.getBrowser().removeEventListener("DOMContentLoaded",DomContentLoadedEvent,false);

			/* ENDE DES ALGORITHMUS UND RETURN NEWPASSWORD oder NULL */
		}
  	}


	// opens a website from link parameter
	function changeWebsite(link){
		console.log("Site is changing...");
		hiddenWin.content.document.location = link;
	}

	function performSubmit(elementID){
		
		worker = tabs.activeTab.attach({
			contentScriptFile: data.url("ModifyingPageContentScript.js")
		});

		worker.port.emit("submitElementID", elementID);
	}

	//changes size of window
	function changeWindowSize(newHeight, newWidth){
		console.log("Size of window is changing");
		hiddenWin.resizeTo(newWidth,newHeight);
	}

	//performs input in an input field by attaching content script to website and passing the parameters
	function performInput(inputValue, elementID){

		worker = tabs.activeTab.attach({
  			contentScriptFile: data.url("ModifyingPageContentScript.js")
		});

		worker.port.emit("elementID", elementID);
		worker.port.emit("inputValue", inputValue);
	}

	// Clicks at (x,y) position in the webpage
	function performClick(xCoord, yCoord){

		worker = tabs.activeTab.attach({
  			contentScriptFile: data.url("ModifyingPageContentScript.js")
		});

		worker.port.emit("xCoord", xCoord);
		worker.port.emit("yCoord", yCoord);
	}

	//fetches new password from security module or an secure place
	function fetchNewPassword(){
		return "test123456789";
	}

	//fetches actual password i.e. for login
	function fetchActivePassword(){
		//return "test123456789";
		return "test1234567891";
	}

	function endPasswordChanging(){
		hiddenWin.getBrowser().removeEventListener("DOMContentLoaded",DomContentLoadedEvent, false);
	}

	function sleep(milliseconds) {
  		var start = new Date().getTime();
  		for (var i = 0; i < 1e7; i++) {
    		if ((new Date().getTime() - start) > milliseconds){
      			break;
    		}
  		}
	}

	//ignoreClickevents at inputs
	function getLastIndexOfInput(obj,actualStepNum){
		var i = 1;
		for(i = 1; i < actualStepNum; i++){
			if(obj.getItem(actualStepNum-i)[obj.getItem(actualStepNum-i).length - 1] == 'Input')
			{
				break;
			}
		}
		console.log("LastindexofInput = ", actualStepNum-i);
		return actualStepNum-i;
	}

	function getNextIndexOfInput(){
		var i = 1;
		for(i = 1; (i + actualStepNum) < (obj.length - 1); i++){
			if(obj.getItem(actualStepNum+i)[obj.getItem(actualStepNum+i).length - 1] == 'Input')
			{
				break;
			}
		}

		console.log("NextindexofInput = ", actualStepNum+i);
		return actualStepNum+i;
	}

	//ignore Click - events
	function determineEventAfterSubmit(){
		var i = 0;
		for(i = 1; (i+ actualStepNum) < obj.length; i++){
			if(obj.getItem(actualStepNum+i)[obj.getItem(actualStepNum+i).length - 1] != 'Click')
			{
				break;
			}
		}
		console.log("Nextindexaftersubmit = ", actualStepNum+i);
		return actualStepNum+i;
	}

	/* 
	fetch old data from password manager of firefox 
	and delete the logindataentry for writing new logindata
	*/ 
	function fetchNDeleteOldLoginData(obj,username){
		var url;
		/* hier wird das alte passwort geholt und der eintrag aus dem PW manager gelöscht
		activePW = GetActivePW 
		active username = getActiveUsername
		0) extrahiere aus hash den usernamen des logins
		1) suche nach logindaten mit username 
		2) sichere username und passwort
		3) lösche logindaten aus pwmaager
		4) fertig
		 */

		 console.log("NOW IN FETCHLOGINANDDELETE");
		for(i = 0; i < obj.length; i++){
			if(obj.getItem(i)[obj.getItem(i).length -1] == "Submit"){
		        //username = obj.getItem(getLastIndexOfInput(obj,getLastIndexOfInput(obj,i)))[2];
		        url = getMainPageFromLink(obj.getItem(i)[1]);
		        break;
		    }
    	}
    	console.log("now username is", username);
    	console.log("now url is", url);

    	show_all_passwords();

    	require("sdk/passwords").search({
		  username: username,
		  url: url,
		  onComplete: function onComplete(credentials) {
		  	oldPassword = credentials.password;
		  	console.log("PASSWORD === ", credentials.password);
		    credentials.forEach(require("sdk/passwords").remove);
		  }, 
		  onError: function onError(){
		  	console.log("no match for username", username);
		  	console.log("no match for url", url);
		  }
		});
		
		console.log("now username is", username);
		console.log("now oldPassword is", oldPassword);
	}

	function getMainPageFromLink(link){
	    var pathArray = link.split( '/' );
	    var protocol = pathArray[0];
	    var host = pathArray[2];
	    url = protocol + '//' + host;
	    return url;
	  }

	  function show_all_passwords() {
  require("sdk/passwords").search({
    onComplete: function onComplete(credentials) {
      credentials.forEach(function(credential) {
        console.log("de scheisse name",credential.username);
        console.log("de scheisse passwort",credential.password);
        });
      }
    });
  }
}

