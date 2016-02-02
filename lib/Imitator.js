var Hashtable = require('lib/Hashtable');
var { viewFor } = require("sdk/view/core");
var windows = require("sdk/windows").browserWindows;
var window = viewFor(require("sdk/windows").browserWindows[0]);
var { Ci } = require('chrome');
var URL = require('sdk/url').URL;
var tabs = require('sdk/tabs');
var maxStepNum;
var actualStepNum = 0;
var hiddenWin; // this class is working with
var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");

module.exports = function Imitator(obj){

	this.Init = function(){
		maxStepNum = obj.length;
		openNewWindow();
	}

	//opens a new tab in browser
	function openNewWindow(){
		hiddenWin = window.open('https://www.mozilla.org/de/firefox/42.0/firstrun/learnmore/','hiddenWindow');
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

			var nextEvent = obj.getItem(actualStepNum)[obj.getItem(actualStepNum).length - 1];
			console.log(nextEvent);

			switch(nextEvent){
				case "Submit": 
					var submitElement 	= obj.getItem(actualStepNum)[0];
					var mustWebsiteURL 	= obj.getItem(actualStepNum)[1];

					/*if(tabs.activeTab.url != mustWebsiteURL)
					{
						console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + mustWebsiteURL);
						changeWebsite(mustWebsiteURL);
						return;
					}*/
					performSubmit(submitElement);
					console.log("submit from element: ", submitElement);
					console.log("on Website: ", mustWebsiteURL);
					

					actualStepNum++;

					if(obj.getItem(actualStepNum)[obj.getItem(actualStepNum).length - 1] != "SiteChange"){
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
					var hiddoc = hiddenWin.content.document;
					hiddoc.elementFromPoint(mustXCoord,mustYCoord).click();
					actualStepNum++;
					changeAlgorithm(); // Attention recursion!
				break;
				case "Input" : 
					var elementID 			= obj.getItem(actualStepNum)[0];
					var lastElementID 		= obj.getItem(actualStepNum - 1)[0];
					var mustWebsiteURL 		= obj.getItem(actualStepNum)[1];
					var elementType 		= obj.getItem(actualStepNum)[3];
					var lastElementType 	= obj.getItem(actualStepNum-1)[3];
					var mustValue 			= obj.getItem(actualStepNum)[2];
					var valueOfNextElement 	= obj.getItem(actualStepNum + 1)[2];
					var valueOfLastElement 	= obj.getItem(actualStepNum - 1)[2];

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
							console.log("type new password again");
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
							console.log("type new password here");
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
							console.log("type old password here");
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
					changeAlgorithm(); // Attention recursion!
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
  	}


	// opens a website from link parameter
	function changeWebsite(link){
		console.log("Site is changing...");
		hiddenWin.content.document.location = link;
	}

	function performSubmit(elementID){
		
		var worker = tabs.activeTab.attach({
			contentScriptFile: data.url("ModifyingPageContentScript.js");
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

		var worker = tabs.activeTab.attach({
  			contentScriptFile: data.url("ModifyingPageContentScript.js")
		});

		worker.port.emit("elementID", elementID);
		worker.port.emit("inputValue", inputValue);
	}

	//fetches new password from security module or an secure place
	function fetchNewPassword(){
		return "test1234567891";
	}

	//fetches actual password i.e. for login
	function fetchActivePassword(){
		//return "test123456789";
		return "coolio1991";
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
}

