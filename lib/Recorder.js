var URL = require('sdk/url').URL;
var tabs = require('sdk/tabs');
var ffpwm = require("sdk/passwords");
var { Ci } = require('chrome');
var { viewFor } = require("sdk/view/core");
var window = viewFor(require("sdk/windows").browserWindows[0]);
var Hashtable = require('lib/Hashtable');

// variables
var orderNumber = 0;
var oldURL;
var url;
var mainWindow;
var IsActive = false;
var userWebPath;
var webPage = "";
var savedInFFPWM = false;
var existingLogin = false;

//information for passwordmanager
var password;
var username;
var form;
var passwordField;
var usernameField;
var formSubmitURL;
var formActiveURL;


module.exports = function Recorder(){

  // start logging and add listener 
  this.StartRecording = function(){

    // is recording now
    IsActive = true;

    //new Hashtable
    userWebPath = new Hashtable();
    //active url
    var url = URL(tabs.activeTab.url);

    mainWindow = window
      .QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIWebNavigation)
      .QueryInterface(Ci.nsIDocShellTreeItem).rootTreeItem
      .QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIDOMWindow);

    //event fires when url changes
    mainWindow.getBrowser().addEventListener("DOMContentLoaded",GetActiveURL, false);

    /*
    window.addEventListener('input', logInput=function (e) {
      // read inputs and ids of input elements
      var doc = window.content.document;
      if(doc != null){

        var id = "";

        if(e.target.name == ""){
          id = e.target.id;
          var data = doc.getElementById(id);
        }
        else{
          id = e.target.name;
          var data = doc.getElementsByName(id)[0];
        }

        console.log(data.value);

        userWebPath.setItem(orderNumber,[id,tabs.activeTab.url,data.value,data.type,"Input"]);
        
        //This will be the key in hashtable in simple-storage 
        webPage = getMainPageFromLink(tabs.activeTab.url);

        console.log(userWebPath.length);
        orderNumber++;
        }
    }, false);
    */

    window.addEventListener('submit', submitClick=function (e) {
      
      console.log("HEY A SUBMIT");

      console.log("form id = " + e.target.id);
      console.log("form action = " + e.target.action);
      
      form = e.target;

      var elem = form.getElementsByTagName("Input");
      var numOfPWFields = 0;

      // Set webpage -> will be the key in simple-storage for this Hashtable
      if(webPage == "")
        webPage = getMainPageFromLink(tabs.activeTab.url);

      console.log("elements= " + elem.length);

      //how many passwordfields does the form contain?
      numOfPWFields = countAllChildrenOfType(form,"password");

      console.log("THERE ARE " + numOfPWFields + " PASSWORD FIELDS IN THIS FORM");

      // save all data about login form but not password because it will be changed later
      if(numOfPWFields == 1){
        for(var i = 0; i < elem.length - 1;i++){
          
          console.log("elem type = " + elem[i+1].type);  
          console.log("elem value = " + elem[i+1].value);  
          
          if((elem[i+1].type == "password") && (elem[i+1].value != "") && (elem[i].value != "password")){
            usernameField = elem[i].name;
            username = elem[i].value;
            passwordField = elem[i+1].name;
            formSubmitURL = e.target.action;
            formActiveURL = tabs.activeTab.url;

            userWebPath.setItem(orderNumber,[form.id,tabs.activeTab.url,form.action,passwordField,usernameField,"SubmitLogin"]);

            break;
          }
        }
      }

      if(numOfPWFields > 1){
        password = getLastPasswordEntry(form);
        userWebPath.setItem(orderNumber,[form.id,tabs.activeTab.url,form.action,"SubmitPWChange"]);
      }

      
      console.log("passwordField = " + passwordField);
      console.log("password = " + password);
      console.log("usernameField = " + usernameField);
      console.log("username = " + username);
      console.log("active url = " + formActiveURL);
      console.log("formAction = " + formSubmitURL);
      

      require("sdk/passwords").search({
        username: username,
        url: url,
        onComplete: function onComplete(credentials) {
          credentials.forEach(function(credential) {
            window.alert("Dieser Login existiert bereits, bitte erst löschen!");
            userWebPath = null;
            webPage = "";
            });
          } 
        });

        // if login not existing yet in password manager
        if(userWebPath != null){
          orderNumber++;  
        }
        else{
          return;
        }
    },false);
  
  /*
    window.addEventListener('click', clickClick=function (e) {
      if(e.target.type != "submit"){
        
        var tempHash = CleanUpHashtable(userWebPath);
        tempHash.each(function(k, v) {
          console.log('key is: ' + k + ', value is: ' + v);
        });
        
        console.log("clicked at this coordinates: X:" + e.pageX + "Y: " + e.pageY);
        console.log("Clicked at page with Height: " + window.innerHeight + " Width: " + window.innerWidth);
        userWebPath.setItem(orderNumber,[tabs.activeTab.url,e.pageX,e.pageY,window.innerHeight,window.innerWidth,"Click"])
        orderNumber++;
      }

    }, false);
*/
  }

  // stop logging actions and remove all listener
  this.StopRecording = function(){
    IsActive = false;
    orderNumber = 0;

    mainWindow.getBrowser().removeEventListener("DOMContentLoaded",GetActiveURL, false);
    //window.removeEventListener('input',logInput,false);
    //window.removeEventListener('submit',logSubmitForm,false);
    window.removeEventListener('click',clickClick,false);
    window.removeEventListener('submit',submitClick,false);

    console.log("removing listener");
    if(userWebPath != null){
      userWebPath = CleanUpHashtable(userWebPath);

      userWebPath.each(function(k, v) {
        console.log('key is: ' + k + ', value is: ' + v);
      });
      console.log("errorhandling at storetopwmanager missing");
      storePasswordToFFPWManager(formActiveURL,username,password,passwordField,usernameField,formSubmitURL);
    }
    return userWebPath;
  }

  //public read only
  // true = recording
  // false = inactive
  this.RecorderIsActive = function(){
     return IsActive;
  }

  //public read only
  //returns webpage -> on this webpage we want to change pw
  this.GetWebPage4PWChange = function(){
    console.log("the page for change is : " + webPage);
    return webPage;
  }

  // Cleans up the hashtable
  // removes duplicates: if user types in a textbox every char is a new entry. But least only last value is needed
  // removes no needed websites: if user searches in google we need only the page of interest
  function CleanUpHashtable(hash){
    var result = new Hashtable();
    var i = 0;
    var oldVal = 'undefined';
    var oldval2 = 'undefined';
    hash.each(function(k, v) {
      if((v[0] != oldVal) || (v[1] != oldval2)){
        oldVal = v[0];
        oldval2 = v[1];
        result.setItem(i,v);
        i++;
      }
      else{
        result.setItem(i-1,v);
      }
    });

    //remove last click when user stops recording
    if(result.getItem(result.length - 1)[result.getItem(result.length - 1).length-1] != "Submit")
      result.removeItem(result.length - 1);

    return result;
  }


	function GetActiveURL(){
  		var newURL = tabs.activeTab.url;

  		if(oldURL != newURL){
    		console.log('active: ' + tabs.activeTab.url);
    		oldURL = tabs.activeTab.url;
        //userWebPath.setItem(orderNumber,[tabs.activeTab.url,"SiteChange"]);
        //orderNumber++;
  		}
	}

  function getMainPageFromLink(link){
    var pathArray = link.split( '/' );
    var protocol = pathArray[0];
    var host = pathArray[2];
    url = protocol + '//' + host;
    return url;
  }

  // this function searches recursively elements with certain type in nodes and childnodes 
  // node = html elemnt as start element
  // type = type of element that will counted
  // returns number of elements of type in childelements of node
  function countAllChildrenOfType(node,type){
    var result = 0;
    if (node.hasChildNodes()) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var newNode = node.childNodes[i];
          result += countAllChildrenOfType(newNode,type);  
        }
    }
    else if(node.type == type){
      return result +1;
    }
    return result;
  }

  // this function searches recursively elements with certain type in nodes and childnodes 
  // node = html elemnt as start element
  // returns last entered text to a password field
  function getLastPasswordEntry(node){
    var result = "";
    if (node.hasChildNodes()) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var newNode = node.childNodes[i];
          var temp;

          temp = getLastPasswordEntry(newNode);

          if(temp != "")
            result = temp;
        }
    }
    else if(node.type == "password"){
      return node.value;
    }
    return result;
  }

  // store new password to firefox password manager
  function storePasswordToFFPWManager(url,username,password,passwordField,usernameField,formSubmitURL){
    //var i = 0;

    /*
    for(i = 0; i < hashtable.length; i++){
      //check if event = submit and passwordfield not empty
      if((hashtable.getItem(i)[hashtable.getItem(i).length -1] == "Submit") && hashtable.getItem(i)[3] != ""){

        
        url = getMainPageFromLink(hashtable.getItem(i)[1]);
        formSubmitURL = hashtable.getItem(i)[1];
        passwordField = hashtable.getItem(i)[3];
        usernameField = hashtable.getItem(i)[4];
        
        //username = hashtable.getItem(getLastIndexOfInput(hashtable,getLastIndexOfInput(hashtable,i)))[2];
        //usernameField = hashtable.getItem(getLastIndexOfInput(hashtable,getLastIndexOfInput(hashtable,i)))[0];
        //password = hashtable.getItem(getLastIndexOfInput(hashtable,i))[2];
        //passwordField = hashtable.getItem(getLastIndexOfInput(hashtable,i))[0];
        

        break;
      }
    }
    */
      
    console.log("stored login with url: " + url + " , formSubmitURL: " + formSubmitURL + " , username: " + username + " , usernameField: " + usernameField + " , password: " + password + " , passwordField: " + passwordField);
    // save new Login 
    require("sdk/passwords").store({
      url: getMainPageFromLink(url),
      formSubmitURL: formSubmitURL,
      username: username,
      usernameField: usernameField,
      password: password,
      passwordField: passwordField
      /*onError: function onError(){
        window.alert("error occured! this login already exists");
      }*/
    });    
  }

  //ignoreClickevents at inputs
  /*
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
  */

  /*
  function prepare4StorePW(username, url){
    require("sdk/passwords").search({
      username: username,
      url: url,
      onComplete: function onComplete(credentials) {
        credentials.forEach(require("sdk/passwords").remove);
      }
    });
  }
  */
}