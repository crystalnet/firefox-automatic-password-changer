var Hashtable = require('../lib/Hashtable');
var { viewFor } = require("sdk/view/core");
var windows = require("sdk/windows").browserWindows;
var window = viewFor(require("sdk/windows").browserWindows[0]);
var { Ci } = require('chrome');
var URL = require('sdk/url').URL;
var tabs = require('sdk/tabs');
var maxStepNum;
var actualStepNum = 0;
var hiddenWin; // this class is working with

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
			

			switch(nextEvent){
				case "Submit": 
					if(tabs.activeTab.url != obj.getItem(actualStepNum)[1])
					{
						console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + obj.getItem(actualStepNum)[1]);
						changeWebsite(obj.getItem(actualStepNum)[1]);
						return;
					}
					console.log("submit from element: ", obj.getItem(actualStepNum)[0]);
					console.log("on Website: ", obj.getItem(actualStepNum)[1]);
					actualStepNum++;
					
				break;
				case "Click" :
					if(tabs.activeTab.url != obj.getItem(actualStepNum)[0])
					{
						console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + obj.getItem(actualStepNum)[1]);
						changeWebsite(obj.getItem(actualStepNum)[0]);
						return;
					}
					console.log("clicked at coordinates X: " + obj.getItem(actualStepNum)[1] + " Y : " + obj.getItem(actualStepNum)[2]);
					console.log("on Website: ", obj.getItem(actualStepNum)[0]);
					actualStepNum++;
					changeAlgorithm(); // Attention recursion!
				break;
				case "Input" : 
					if(tabs.activeTab.url != obj.getItem(actualStepNum)[1])
					{
						console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + obj.getItem(actualStepNum)[1]);
						changeWebsite(obj.getItem(actualStepNum)[1]);
						return;
					}
					if(obj.getItem(actualStepNum)[3] == "password"){
						if((obj.getItem(actualStepNum-1)[2] == obj.getItem(actualStepNum)[2]) && (obj.getItem(actualStepNum-1)[3] == obj.getItem(actualStepNum)[3]) && (obj.getItem(actualStepNum-1)[0] != obj.getItem(actualStepNum)[0])){
							if(tabs.activeTab.url != obj.getItem(actualStepNum)[1])
							{
								console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + obj.getItem(actualStepNum)[1]);
								changeWebsite(obj.getItem(actualStepNum)[1]);
								return;
							}
							// type new pw again
							console.log("type new password again");
							var pw = fetchNewPassword();
							performInput(pw,obj.getItem(actualStepNum)[0]);
							
						}
						else if(obj.getItem(actualStepNum)[2] == obj.getItem(actualStepNum + 1)[2]){
							if(tabs.activeTab.url != obj.getItem(actualStepNum)[1])
							{
								console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + obj.getItem(actualStepNum)[1]);
								changeWebsite(obj.getItem(actualStepNum)[1]);
								return;
							}
							//type new pw
							console.log("type new password here");
							var pw = fetchNewPassword();
							performInput(pw,obj.getItem(actualStepNum)[0]);
							// hit enter
						}
						else{
							if(tabs.activeTab.url != obj.getItem(actualStepNum)[1])
							{
								console.log("ChangeWebsite from "+ tabs.activeTab.url + "to " + obj.getItem(actualStepNum)[1]);
								changeWebsite(obj.getItem(actualStepNum)[1]);
								return;
							}
							// type old pw
							console.log("type old password here");
							var pw = fetchActivePassword();
							performInput(pw,obj.getItem(actualStepNum)[0]);
						}
					}
					//---------> action is happening
					else{
						performInput(obj.getItem(actualStepNum)[2],obj.getItem(actualStepNum)[0]);

						console.log("type to element: ", obj.getItem(actualStepNum)[0]);
						console.log("on Website: ", obj.getItem(actualStepNum)[1]);
						console.log("a value of: ", obj.getItem(actualStepNum)[2]);
						console.log("of type:", obj.getItem(actualStepNum)[3]);
					}
					//--------->
					actualStepNum++;
					changeAlgorithm(); // Attention recursion!
				break;
				case "SiteChange" : 
					console.log("website change to ", obj.getItem(actualStepNum)[0]);
					changeWebsite(obj.getItem(actualStepNum)[0]);
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

	//performs input in an input field
	function performInput(inputValue, elementID){
		var doc = window.content.document;
      	if(doc != null){
      		if(doc.getElementsByName(elementID)[0] != null)
				var data = doc.getElementsByName(elementID)[0];
        	else
          		var data = doc.getElementById(elementID);
        }
        data.value = inputValue;
	}

	//fetches new password from security module or an secure place
	function fetchNewPassword(){
		return "test12345678911";
	}

	//fetches actual password i.e. for login
	function fetchActivePassword(){
		return "test1234567891";
	}

	function endPasswordChanging(){
		hiddenWin.getBrowser().removeEventListener("DOMContentLoaded",DomContentLoadedEvent, false);
	}
}