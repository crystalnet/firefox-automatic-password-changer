/*
This is the heart of PasswordChanger 
Passwordchange algorithm is implemented in this class
*/
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


var worker;
var pwList = null;
var oldPassword;
var newPassword = "";
var oldData = [];
var hiddenWin = null;

var Translator = require('lib/Translator');
var LANG = {
	//gbr: 0,
	//esp: 1,
	usa: 2,
	//fra: 3,
	//ita: 4,
	//chn: 5,
	deu: 6
};

var languageStrings = Translator(LANG.deu);

// Imitator class have to be instantiated with:
// obj: hashtable that contains blueprint for website 
// username: is the username for logging in in the account
// url: the url of the website where password should be changed
module.exports = function Imitator(obj,username, url){
	this.testhook = {
		openNewWindow: openNewWindow,
		getNextIndexOfInput: getNextIndexOfInput,
		getLastIndexOfInput: getLastIndexOfInput,
		getMainPageFromLink: getMainPageFromLink,
		delete_cookie: delete_cookie,
		sleep: sleep,
		GetpasswordList: GetpasswordList,
		returnHiddenWin: hiddenWin,
		returnWindow: window,
		changeWebsite: changeWebsite,
		changeAlgorithm: changeAlgorithm,
        determineEventAfterSubmit: determineEventAfterSubmit,
        isPWChange: isPWChange,
		obj: function (obj2) {
			obj = obj2;
		},
		actualStepNum: function (value) {
			actualStepNum = value;
		},
		injectTabs: function (value) {
			tabs = value;
		},
		setHiddenWin: function (value) {
			hiddenWin = value;
		},
		setWindow: function (value) {
			window = value;
		}
	};

	this.Init = function(){
		actualStepNum = 0;
		lastStepNum = 0;
		timeoutCounter = 0;
		newPassword = "";

		GetpasswordList();
		
		while(obj.getItem(obj.length-1)[obj.getItem(obj.length-1).length-1] == "Click"){
	      obj.removeItem(obj.length-1);
	    }

		maxStepNum = obj.length;
		openNewWindow();
		fetchNDeleteOldLoginData(url,username);

	};

	/*
	this function from mozilla docs is buggy
	that is the reason for changing passwords in active tab and not in a hidden window
	*/
	function listTabs() {
		var tabs = require('sdk/tabs');
  		for (let tab of tabs){
    		console.log("tab url" + tab.url);
    		console.log("tab id" + tab.id);
    		console.log("tab window.title" + tab.window.title);
    	}

	}

	//opens a window of browser
	function openNewWindow() {
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
    		console.log(actualStepNum + " " + maxStepNum);
    		console.log(obj);
			// check if algorithm is hanging up at a step
    		if(actualStepNum != lastStepNum){
    			timeoutCounter = 0;
    			lastStepNum = actualStepNum;
    		}
    		else if(timeoutCounter >= 10){
    			console.log("TIMEOUT FOR STEP" + lastStepNum);
    			stopImitating();
    		}

    		timeoutCounter++; 
    		changeAlgorithm();
    	}, false);
	
  		hiddenWin.focus(); // this window should be hidden 

	}

	//Algorithm that performs automatic password change
	function changeAlgorithm() {
  		
  		sleep(2000);

		if(actualStepNum < maxStepNum){

			var nextEvent = obj.getItem(actualStepNum)[obj.getItem(actualStepNum).length - 1];
			console.log(nextEvent);
			//TODO: Check if the automat is working correctly
			switch (nextEvent) {
				case "SubmitLogin":
					var formID = obj.getItem(actualStepNum)[0];
					var formName = obj.getItem(actualStepNum)[1];
					var mustWebsiteURL = obj.getItem(actualStepNum)[2];
					var formAction = obj.getItem(actualStepNum)[3];
					var formPWFieldName = obj.getItem(actualStepNum)[4];
					var formPWFieldID = obj.getItem(actualStepNum)[5];
					var formUsernameFieldName = obj.getItem(actualStepNum)[6];
					var formUsernameFieldID = obj.getItem(actualStepNum)[7];
					//var nextEventIndex;

					if (hiddenWin.content.location.href != mustWebsiteURL) {
						console.log("ChangeWebsite from " + hiddenWin.content.location.href + "to " + mustWebsiteURL);
						changeWebsite(mustWebsiteURL);
						return;
					}

					sleep(2000);
					actualStepNum++;
					performSubmitLogin([formID, formName, mustWebsiteURL, formAction, formPWFieldName, formPWFieldID, formUsernameFieldName, formUsernameFieldID, oldPassword, username]);

					break;
				case "SubmitPWChange":
					var formID = obj.getItem(actualStepNum)[0];
					var formName = obj.getItem(actualStepNum)[1];
					var mustWebsiteURL = obj.getItem(actualStepNum)[2];
					var formAction = obj.getItem(actualStepNum)[3];
					var numOfPWFields = obj.getItem(actualStepNum)[4];
					var PWInfo = obj.getItem(actualStepNum)[5].split("");	//array

					// generate new password
					newPassword = pwg.GeneratePassword();
					console.log("new password will be = " + newPassword);

					// if website is wrong -> change 
					if (hiddenWin.content.location.href != mustWebsiteURL) {
						console.log("ChangeWebsite from " + hiddenWin.content.location.href + "to " + mustWebsiteURL);
						changeWebsite(mustWebsiteURL);
						return;
					}

					actualStepNum++;
					performSubmitPWChange([formID, formName, mustWebsiteURL, formAction, numOfPWFields, PWInfo, oldPassword, newPassword]);

					break;
				case "Submit":
					var formID = obj.getItem(actualStepNum)[0];
					var formName = obj.getItem(actualStepNum)[1];
					var formAction = obj.getItem(actualStepNum)[2];
					var mustWebsite = obj.getItem(actualStepNum)[3];

					if (hiddenWin.content.location.href != mustWebsiteURL) {
						changeWebsite(mustWebsiteURL);
						return;
					}

					performSubmitOnly(formID, mustWebsiteURL, formAction);

					actualStepNum++;
					break;
				case "Logout":
					var formID = obj.getItem(actualStepNum)[0];
					var formName = obj.getItem(actualStepNum)[1];
					var formAction = obj.getItem(actualStepNum)[2];
					var mustWebsiteURL = obj.getItem(actualStepNum)[3];
					var hrefLink = obj.getItem(actualStepNum)[4];

					if (hiddenWin.content.location.href != mustWebsiteURL) {
						changeWebsite(mustWebsite);
						return;
					}

					performLogout(formID, formName, formAction, mustWebsiteURL, hrefLink);

					actualStepNum++;
					break;
				case "Click" :
					var mustWebsiteURL = obj.getItem(actualStepNum)[0];
					var mustXCoord = obj.getItem(actualStepNum)[1];
					var mustYCoord = obj.getItem(actualStepNum)[2];
					var mustWindowHeight = obj.getItem(actualStepNum)[3];
					var mustWindowWidth = obj.getItem(actualStepNum)[4];
					var mustScrollTop = obj.getItem(actualStepNum)[5];

					if (hiddenWin.content.location.href != mustWebsiteURL) {
						changeWebsite(mustWebsiteURL);
						return;
					}

					if ((hiddenWin.innerHeight != mustWindowHeight) || (hiddenWin.innerWidth != mustWindowWidth)) {
						changeWindowSize(mustWindowHeight, mustWindowWidth);
					}

					actualStepNum++;
					performClick(mustXCoord, mustYCoord, mustScrollTop);

					break;
				{
				//TODO It looks like the manual passwortchange event exists. Check how and if it has to be completed
					// the Input event exists but there was no need for that in this version
					// maybe neede in future
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
				}
				case "SiteChange" : 
					var mustWebsiteURL = obj.getItem(actualStepNum)[0];
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
	function changeWebsite(link) {
		console.log("Site is changing...");
		hiddenWin.content.document.location = link;
	}
	/*
	this funcion performs the submit of login forms on websites 
	submitdata = [formID, formName ,mustWebsiteURL, formAction, formPWFieldName, formPWFieldID, formUsernameFieldName, formUsernameFieldID, oldPassword, username)]
	*/
	function performSubmitLogin(submitdata){
		console.log("performSubmitLogin");
		//attach a contentscript to website with submit form
		worker = tabs.activeTab.attach({
			contentScriptFile: [self.data.url("ModifyingPageContentScript.js"),self.data.url("jquery.min.js")]
		});

		worker.port.emit("submitLoginData",submitdata);// [formID, formName ,mustWebsiteURL, formAction, formPWFieldName, formPWFieldID, formUsernameFieldName, formUsernameFieldID, oldPassword, username]);
		
	}

	/*
	this function performs submit of password change forms
	data : [formID,formName, mustWebsiteURL, formAction,numOfPWFields,PWInfo, oldPassword, newPassword]
	*/
	function performSubmitPWChange(data){
		worker = tabs.activeTab.attach({
			contentScriptFile: [self.data.url("ModifyingPageContentScript.js"),self.data.url("jquery.min.js")]
		});

		console.log("sending submitPWChangeData to content script");

		worker.port.emit("submitPWChangeData", data);
		worker.port.on("SubmitPWReady", function(){
			changeAlgorithm();
		});

	}

	/*
	this function performs all submit that are not for login or password change forms
	formID: the id-attribut-value of the form
	formWebsite: website where the form is 
	formAction: action-attribute-value of form
	*/
	function performSubmitOnly(formID, formWebsite, formAction){
		
		worker = tabs.activeTab.attach({
			contentScriptFile: [self.data.url("ModifyingPageContentScript.js"),self.data.url("jquery.min.js")]
		});

		worker.port.emit("submitOnlyData", [formID, formWebsite, formAction]);
	}

	/*
	this function performs logout forms
	formID: the id-attribut-value of the form
	formName: the name-attribut-value of the form
	mustWebsiteURL: website where the form is 
	formAction: action-attribute-value of form
	hrefLink: href-attribut-value of form
	*/
	function performLogout(formID, formName, formAction, mustWebsiteURL, hrefLink){
		
		worker = tabs.activeTab.attach({
			contentScriptFile: [self.data.url("ModifyingPageContentScript.js"),self.data.url("jquery.min.js")]
		});

		worker.port.emit("LogoutData", [formID, formName, formAction, mustWebsiteURL, hrefLink]);
		worker.port.emit("LogoutData", [formID, formName, formAction, mustWebsiteURL, hrefLink]);
	}

	//changes size of window
	// newHeight: new height of the window
	// newWidth: new width of the window
	function changeWindowSize(newHeight, newWidth){
		hiddenWin.resizeTo(newWidth,newHeight);
	}

	// not needed in this version of addon 
	//performs input in an input field by attaching content script to website and passing the parameters
	// inputValue: value that the input html element will get
	// elementID: id-attribut-value of input element
	function performInput(inputValue, elementID){

		worker = tabs.activeTab.attach({
  			contentScriptFile: [self.data.url("ModifyingPageContentScript.js"),self.data.url("jquery.min.js")]
		});

		worker.port.emit("elementID", elementID);
		worker.port.emit("inputValue", inputValue);
	}


	// Clicks at (x,y) position in the webpage
	//xCoord: clientX-coordinate of clickevent
	//yCoord: clientY-coordinate of clickevent
	//mustScrollTop: scrolltop of windowelement for calibrating the viewport on website
	function performClick(xCoord, yCoord,mustScrollTop){
		console.log("performing click ");
		worker = tabs.activeTab.attach({
  			contentScriptFile: [self.data.url("ModifyingPageContentScript.js"),self.data.url("jquery.min.js")]
		});

		worker.port.emit("xyCoords", [xCoord,yCoord,mustScrollTop]);

		worker.port.on("clickReady",function(){
			changeAlgorithm();
		});
		
	}

	// this function waits for milliseconds
	// necessary fot not triggering an detection abuse mechanism on websites
	function sleep(milliseconds) {
  		var start = new Date().getTime();
  		for (var i = 0; i < 1e7; i++) {
    		if ((new Date().getTime() - start) > milliseconds){
      			break;
    		}
  		}
	}
	// returns the index of the last input events in hashtable
	// obj: hashtable with blueprint
	// actualStepNum: actual index in hashtable
	function getLastIndexOfInput(obj,actualStepNum){
		var i = 1;
		for(i = 1; i < actualStepNum; i++){
			if(obj.getItem(actualStepNum-i)[obj.getItem(actualStepNum-i).length - 1] == 'Input')
			{
				break;
			}
		}
		return actualStepNum-i;
	}

	// returns the index of the next input events in hashtable
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
	//returns index of obj that is not a clickevent
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
	url: url of website where password should be changed
	username: username of login 
	*/ 
	function fetchNDeleteOldLoginData(url,username){
		
    	sleep(2000);
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
	}

	//determines if the hashtable contains a full path for password change
	// return true if hashtable contains a full password change path 
	//return false if in hashtable is no submitPWChange- Event
	// hash: hashtable with blueprint -> obj 
	function isPWChange(hash){
		for(var i = 0; i < hash.length;i++){
			if(hash.getItem(i)[hash.getItem(i).length - 1] == "SubmitPWChange")
				return true;
		}

		return false;
	}

	// returns the first part of a link -> example: https://www.facebook.com/settings/password -> https://www.facebook.com
	function getMainPageFromLink(link) {
	    var pathArray = link.split( '/' );
	    var protocol = pathArray[0];
	    var host = pathArray[2];
	    url = protocol + '//' + host;
	    return url;
	}

	// Helperfunction for printing all logins in passwordmanager
	  function show_all_passwords() {
		  require("sdk/passwords").search({
		    onComplete: function onComplete(credentials) {
		      credentials.forEach(function(credential) {
				  //TODO replace "scheisse"
		        console.log("de scheisse name",credential.username);
		        console.log("de scheisse passwort",credential.password);
		        console.log("de scheisse url",credential.url);
		        });
		      }
	    	});
	  }

	/*
	saves all logins in a hashtable
	necessary because this process is asyncronous an can take much time
	on the fly it is faster to work with a hashtable with logins than the passwordmanager itself
	*/
	function GetpasswordList() {
		if(pwList != null)
			return;

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
	//for testing
	this.returnPasswordList = function returnPasswordList() {
		return pwList;
	};

	// intern function for stoping the process of imitation 
	// removes all listener
	// stores new password in passwordmanager
	// checking if change was successful
	function stopImitating(){
		hiddenWin.getBrowser().removeEventListener("DOMContentLoaded",DomContentLoadedEvent,false);

			console.log("Stoping imitation");

			// if there is still a passwordchange event in hashtable 
			for(var i = actualStepNum; i < obj.length;i++){
				if(obj.getItem(i)[obj.getItem(i).length-1] == "SubmitPWChange"){
					window.alert(languageStrings["a_problem_appeared_when_changing_password"]);
					return;
				}
			}

			//store new password in passwordmanager if the is a new password
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
					onComplete: function onComplete(){
						var cookies = window.content.document.cookie.split(";");
						for(var i = 0; i < cookies.length-1;i++){
							console.log("cookie"+cookies[i]);
						}
						delete_cookie(cookies[cookies.length-1].split("=")[0]);
						console.log("namecookie" + cookies[cookies.length-1].split("=")[0]);
						hiddenWin.close();
						window.content.alert(languageStrings["password_has_been_successfully_changed"]);
						
					}
				});

				pwList = null;
			}
			
			actualStepNum = 0;
			lastStepNum = 0;
			timeoutCounter = 0;
	}
	/*
	 deletes a cookie by name
	 */
	function delete_cookie(name) {
		console.log(window.content.document.cookie);
		window.content.document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	}
};
