var Hashtable = require('lib/Hashtable');
var { viewFor } = require("sdk/view/core");
var windows = require("sdk/windows").browserWindows;
var window = viewFor(require("sdk/windows").browserWindows[0]);
var { Ci } = require('chrome');
var URL = require('sdk/url').URL;
var tabs = require('sdk/tabs');
var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var PasswordGen = require('lib/PasswordGen');
var self = require("sdk/self");
var pwg = new PasswordGen(10,5,5,0);
var maxStepNum;
var actualStepNum = 0;
var lastStepNum = 0;
var timeoutCounter = 0;
var hiddenWin;
var worker;
var pwList;
var oldPassword;
var newPassword = "";


module.exports = function Imitator(obj,username, url){

	this.Init = function(){
		actualStepNum = 0;
		lastStepNum = 0;
		timeoutCounter = 0;
		newPassword = "";

		GetpasswordList();
		maxStepNum = obj.length;
		openNewWindow();
		fetchNDeleteOldLoginData(url,username);
		
	}

	function listTabs() {
		var tabs = require('sdk/tabs');
  		for (let tab of tabs){
    		console.log("tab url" + tab.url);
    		console.log("tab id" + tab.id);
    		console.log("tab window.title" + tab.window.title);
    	}
    		
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

    		if(actualStepNum != lastStepNum){
    			timeoutCounter = 0;
    			lastStepNum = actualStepNum;
    		}
    		else if(timeoutCounter >= 5){
    			console.log("TIMEOUT FOR STEP" + lastStepNum);
    			stopImitating();
    		}

    		timeoutCounter++; 
    		changeAlgorithm();
    	}, false);
	
  		hiddenWin.focus(); // for testing only else hidden
  	}
  	

  	//Algorithm that performs automatic password change
  	function changeAlgorithm(){
  		//for testing only
  		sleep(2000);

		if(actualStepNum < maxStepNum){

			// delete    DELETE     DELETE    DELETE // delete    DELETE     DELETE    DELETE 
			console.log("now username is", username);
			console.log("now oldPassword is", oldPassword);
			// delete    DELETE     DELETE    DELETE // delete    DELETE     DELETE    DELETE

			var nextEvent = obj.getItem(actualStepNum)[obj.getItem(actualStepNum).length - 1];
			console.log(nextEvent);

			switch(nextEvent){
				case "SubmitLogin": 
					var formID 						= obj.getItem(actualStepNum)[0];
					var formName 					= obj.getItem(actualStepNum)[1];
					var mustWebsiteURL 				= obj.getItem(actualStepNum)[2];
					var formAction 					= obj.getItem(actualStepNum)[3];	
					var formPWFieldName 			= obj.getItem(actualStepNum)[4];
					var formPWFieldID 				= obj.getItem(actualStepNum)[5];
					var formUsernameFieldName 		= obj.getItem(actualStepNum)[6];
					var formUsernameFieldID 		= obj.getItem(actualStepNum)[7];				
					//var nextEventIndex;

					if(hiddenWin.content.location.href != mustWebsiteURL)
					{
						console.log("ChangeWebsite from "+ hiddenWin.content.location.href + "to " + mustWebsiteURL);
						changeWebsite(mustWebsiteURL);
						return;
					}

					sleep(2000);
					performSubmitLogin([formID, formName ,mustWebsiteURL, formAction, formPWFieldName, formPWFieldID, formUsernameFieldName, formUsernameFieldID, oldPassword, username]);
					
					console.log("submitLogin from element: ", formID);
					console.log("With action : " + formAction);
					console.log("on Website: ", mustWebsiteURL);
					

					actualStepNum++;

					//nextEventIndex = determineEventAfterSubmit();
					/*
					if(obj.getItem(nextEventIndex)[obj.getItem(actualStepNum).length - 1] != "SiteChange"){
						changeAlgorithm(); // Recursion
					}
					*/
				break;
				case "SubmitPWChange": 
					var formID 				= obj.getItem(actualStepNum)[0];
					var formName 			= obj.getItem(actualStepNum)[1];
					var mustWebsiteURL 		= obj.getItem(actualStepNum)[2];
					var formAction 			= obj.getItem(actualStepNum)[3];
					var numOfPWFields 		= obj.getItem(actualStepNum)[4];
					var PWInfo 				= obj.getItem(actualStepNum)[5].split("");	//array								
					
					newPassword = pwg.GeneratePassword();
					console.log("new password will be = " + newPassword);

					if(hiddenWin.content.location.href != mustWebsiteURL)
					{
						console.log("ChangeWebsite from "+ hiddenWin.content.location.href + "to " + mustWebsiteURL);
						changeWebsite(mustWebsiteURL);
						return;
					}
					performSubmitPWChange(formID,formName, mustWebsiteURL, formAction,numOfPWFields,PWInfo, oldPassword);
					console.log("submitPWChange from element: ", formID);
					console.log("action: ", formAction);
					console.log("on Website: ", mustWebsiteURL);
					

					actualStepNum++;

					//nextEventIndex = determineEventAfterSubmit();
					/*
					if(obj.getItem(nextEventIndex)[obj.getItem(actualStepNum).length - 1] != "SiteChange"){
						changeAlgorithm(); // Recursion
					}
					*/
					
				break;
				case "Submit": 
					var formID 			= obj.getItem(actualStepNum)[0];
					var formName 		= obj.getItem(actualStepNum)[1];
					var formAction 		= obj.getItem(actualStepNum)[2];
					var mustWebsite 	= obj.getItem(actualStepNum)[3];

					if(hiddenWin.content.location.href != mustWebsiteURL)
					{
						console.log("ChangeWebsite from "+ hiddenWin.content.location.href + "to " + mustWebsiteURL);
						changeWebsite(mustWebsiteURL);
						return;
					}

					performSubmitOnly(formID, mustWebsiteURL, formAction);

					actualStepNum++;
				case "Logout":
					var formID 			= obj.getItem(actualStepNum)[0];
					var formName 		= obj.getItem(actualStepNum)[1];
					var formAction 		= obj.getItem(actualStepNum)[2];
					var mustWebsite 	= obj.getItem(actualStepNum)[3];
					var hrefLink 		= obj.getItem(actualStepNum)[4];
					var element 		= obj.getItem(actualStepNum)[5];

					if(hiddenWin.content.location.href != mustWebsiteURL)
					{
						console.log("ChangeWebsite from "+ hiddenWin.content.location.href + "to " + mustWebsiteURL);
						changeWebsite(mustWebsiteURL);
						return;
					}

					performLogout(formID, formName, formAction, mustWebsiteURL, hrefLink);

					actualStepNum++;
					break;
				case "Click" :
					var mustWebsiteURL 		= obj.getItem(actualStepNum)[0];
					var mustXCoord 			= obj.getItem(actualStepNum)[1];
					var mustYCoord 			= obj.getItem(actualStepNum)[2];
					var mustWindowHeight 	= obj.getItem(actualStepNum)[3];
					var mustWindowWidth 	= obj.getItem(actualStepNum)[4];

					if(hiddenWin.content.location.href != mustWebsiteURL){
						console.log("ChangeWebsite from "+ hiddenWin.content.location.href + "to " + mustWebsiteURL);
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
				/*
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
				*/
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
			stopImitating();
		}
  	}


	// opens a website from link parameter
	function changeWebsite(link){
		console.log("Site is changing...");
		hiddenWin.content.document.location = link;
	}

	function performSubmitLogin(submitdata){//formID, formName ,mustWebsiteURL, formAction, formPWFieldName, formPWFieldID, formUsernameFieldName, formUsernameFieldID, oldPassword, username){
		console.log("performSubmitLogin");
		//console.log(formID + " " + formName + " " + mustWebsiteURL + " " + formAction + " " + formPWFieldName + " " + formPWFieldID + " " + formUsernameFieldName + " " + formUsernameFieldID + " " +oldPassword + " " + username);
		worker = tabs.activeTab.attach({
			contentScriptFile: self.data.url("ModifyingPageContentScript.js")
		});

		//console.log("sending submitLoginData to content script: " + formID + " " + formName + " " + mustWebsiteURL + " " + formAction + " " + formPWFieldName + " " + formPWFieldID + " " + formUsernameFieldName + " " + formUsernameFieldID + " " + password + " " + username);
		worker.port.emit("submitLoginData",submitdata);// [formID, formName ,mustWebsiteURL, formAction, formPWFieldName, formPWFieldID, formUsernameFieldName, formUsernameFieldID, oldPassword, username]);
	}

	function performSubmitPWChange(formID,formName, mustWebsiteURL, formAction,numOfPWFields,PWInfo, oldPassword){
		worker = tabs.activeTab.attach({
			contentScriptFile: self.data.url("ModifyingPageContentScript.js")
		});

		console.log("sending submitPWChangeData to content script");
		worker.port.emit("submitPWChangeData", [formID,formName, mustWebsiteURL, formAction,numOfPWFields,PWInfo, oldPassword, newPassword]);
	}

	function performSubmitOnly(formID, formWebsite, formAction){
		
		worker = tabs.activeTab.attach({
			contentScriptFile: self.data.url("ModifyingPageContentScript.js")
		});

		worker.port.emit("submitOnlyData", [formID, formWebsite, formAction]);
	}

	function performLogout(formID, formName, formAction, mustWebsiteURL, hrefLink){
		
		worker = tabs.activeTab.attach({
			contentScriptFile: self.data.url("ModifyingPageContentScript.js")
		});

		worker.port.emit("LogoutData", [formID, formWebsite, formAction]);
	}

	//changes size of window
	function changeWindowSize(newHeight, newWidth){
		console.log("Size of window is changing");
		hiddenWin.resizeTo(newWidth,newHeight);
	}

	//performs input in an input field by attaching content script to website and passing the parameters
	function performInput(inputValue, elementID){

		worker = tabs.activeTab.attach({
  			contentScriptFile: self.data.url("ModifyingPageContentScript.js")
		});

		worker.port.emit("elementID", elementID);
		worker.port.emit("inputValue", inputValue);
	}

	// Clicks at (x,y) position in the webpage
	function performClick(xCoord, yCoord){

		worker = tabs.activeTab.attach({
  			contentScriptFile: self.data.url("ModifyingPageContentScript.js")
		});

		worker.port.emit("xCoord", xCoord);
		worker.port.emit("yCoord", yCoord);
	}

	//fetches new password from security module or an secure place
	function fetchNewPassword(){
		return "test123456789";
	}

	/*
	//fetches actual password i.e. for login
	function fetchActivePassword(){
		//return "test123456789";
		return "test1234567891";
	}
	*/

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
	function fetchNDeleteOldLoginData(url,username){
		/* hier wird das alte passwort geholt und der eintrag aus dem PW manager gelöscht
		activePW = GetActivePW 
		active username = getActiveUsername
		0) extrahiere aus hash den usernamen des logins
		1) suche nach logindaten mit username 
		2) sichere username und passwort
		3) lösche logindaten aus pwmaager
		4) fertig
		 */

		 /*
		 console.log("NOW IN FETCHLOGINANDDELETE");
		for(i = 0; i < obj.length; i++){
			if(obj.getItem(i)[obj.getItem(i).length -1] == "Submit"){
		        //username = obj.getItem(getLastIndexOfInput(obj,getLastIndexOfInput(obj,i)))[2];
		        url = getMainPageFromLink(obj.getItem(i)[1]);
		        break;
		    }
    	}
    	*/
		
    	sleep(2000);
    	console.log("now username is", username);
    	console.log("now url is", url);
    	console.log("länge von pwList ist " + pwList.length);

    	show_all_passwords();
    	for(var i = 0; i < pwList.length; i++){
    		console.log("password ist " + pwList.getItem(i)[1]);
    	}

    	for(var i = 0; i < pwList.length; i++){
    		if((pwList.getItem(i)[2] == url) && pwList.getItem(i)[0] == username){
    			oldPassword = pwList.getItem(i)[1];

    			if(isPWChange(obj)){
	    			require("sdk/passwords").search({
			  			username: username,
			  			url: url,
			  			onComplete: function onComplete(credentials) {
						  	console.log("PASSWORD === ", credentials.password);
						    credentials.forEach(require("sdk/passwords").remove);
			  			}, 
			  			onError: function onError(){
						  	console.log("no match for username", username);
						  	console.log("no match for url", url);
						}
					});
	    		}
				break;
    		}
    	}
		
		console.log("now username is", username);
		console.log("now oldPassword is", oldPassword);
	}

	//determines if the hashtable contains a full path for password change
	// return true if hashtable contains a full password change path 
	//return false if in hashtable is no submitPWChange- Event
	function isPWChange(hash){
		for(var i = 0; i < hash.length;i++){
			if(hash.getItem(i)[hash.getItem(i).length - 1] == "SubmitPWChange")
				return true;
		}

		return false;
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
        console.log("de scheisse url",credential.url);
        });
      }
    });
  }

	function GetpasswordList(){
	 	pwList = new Hashtable();
	  	var i = 0;
	  	require("sdk/passwords").search({
	    	onComplete: function onComplete(credentials) {
	      		credentials.forEach(function(credential) {        
	        		console.log(credential.username);
	        		console.log(credential.password);

	        		var temp = [credential.username,credential.password,credential.url,credential.usernameField,credential.passwordField,credential.formSubmitURL];

	        		pwList.setItem(i,temp);
	        		i++;
	      		});
	    	}
	  });
	}

	function stopImitating(){
		hiddenWin.getBrowser().removeEventListener("DOMContentLoaded",DomContentLoadedEvent,false);

			console.log("WE ARE READY");

			for(var i = actualStepNum; i < obj.length;i++){
				if(obj.getItem(i)[obj.getItem(i).length-1] == "SubmitPWChange"){
					window.alert("Bei der Änderung des Passwords ist ein Fehler unterlaufen");
					return;
				}
			}

			if(newPassword != ""){
				var oldData;
				for(var i = 0; i < pwList.length; i++){
					if(pwList.getItem(i)[2] == url){
						oldData = pwList.getItem(i);
						break;
					}

				}

				
				require("sdk/passwords").store({
					username: oldData[0],
					password: newPassword,
					url: oldData[2],
					usernameField: oldData[3],
					passwordField: oldData[4],
					formSubmitURL: oldData[5],
				});
			}
			
			for(var i = 0; i < obj.length;i++){
				if(obj.getItem(i)[obj.getItem(i).length-1] == "SubmitPWChange"){
					window.alert("Passwort wurde erfolgreich geändert");

					console.log("logout with " + GetLogoutURL(getMainPageFromLink(hiddenWin.content.location.href)));
					

					hiddenWin = hiddenWin.open(GetLogoutURL(getMainPageFromLink(hiddenWin.content.location.href)));
					hiddenWin.close();
				}
				else{
					
				}
			}

			
			

			actualStepNum = 0;
			lastStepNum = 0;
			timeoutCounter = 0;

			
			// prüfen ob noch pwchangesubmit events abzuarbeiten sind -> wenn ja dann fail sonst success
			// change the pw in password manager
			/* ENDE DES ALGORITHMUS UND RETURN NEWPASSWORD oder NULL */
			// if pwChange return newpassword
			// else return ""
	}

	//Returns a URL for Logging out 
	function GetLogoutURL(url) {
  		var parts = url.split('//');
		  var logoutURL = parts[0] + "//foobar@" + parts[1];
		  
		  return logoutURL;
	}
}

