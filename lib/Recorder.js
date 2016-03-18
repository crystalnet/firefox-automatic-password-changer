var URL = require('sdk/url').URL;
var tabs = require('sdk/tabs');
var ffpwm = require("sdk/passwords");
var { Ci } = require('chrome');
var { viewFor } = require("sdk/view/core");
var window = viewFor(require("sdk/windows").browserWindows[0]);
var Hashtable = require('lib/Hashtable');
var cm = require("sdk/context-menu");
var self = require("sdk/self");

// variables
var orderNumber = 0;
var oldURL = "";
var url = "";
var mainWindow;
var IsActive = false;
var userWebPath;
var webPage = "";
var savedInFFPWM = false;
var existingLogin = false;
var pwList = null;
//information for passwordmanager
var password = "";
var username = "";
var form = null;
var passwordField = "";
var usernameField = "";
var formSubmitURL = "";
var formActiveURL = "";
var RecordingMenu;
var worker;
var Logout = null;
var PWInfo = "";

//flags
var newPasswordFieldSet = false;
var newPasswordFieldID = "";
var newPasswordFieldName = "";
var actualPasswordFieldSet = false;
var UsernameEmailFieldSet = false;
var usernameFieldID = "";
var passwordFieldID = "";


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

    //get passwords from PM
    GetpasswordList();

    //event fires when url changes
    mainWindow.getBrowser().addEventListener("DOMContentLoaded",GetActiveURL, false);

    buildContextmenu();
    
    


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
      
      console.log("HEY A SUBMIT 1");

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

      console.log("######actualPasswordFieldSet = " + actualPasswordFieldSet);
      console.log("######UsernameEmailFieldSet = " + UsernameEmailFieldSet);
      console.log("######newPasswordFieldSet = " + newPasswordFieldSet);
      console.log("######passwortField = " + passwordField);
      console.log("######passwordFieldID = " + passwordFieldID);
      console.log("######usernameField = " + usernameField);
      console.log("######usernameFieldID = " + usernameFieldID);


      if(actualPasswordFieldSet && UsernameEmailFieldSet && !newPasswordFieldSet){
        console.log("this is a login form with 110 in ordernumber " + orderNumber);
        console.log("test with 1" + form.id + " 2" + form.name + " 3" + tabs.activeTab.url + " 4" + form.action + " 5" + passwordField + " 6" + passwordFieldID + " 7"+usernameField+" 8"+usernameFieldID);
        userWebPath.setItem(orderNumber,[form.id,form.name,tabs.activeTab.url,form.action,passwordField,passwordFieldID,usernameField,usernameFieldID,"SubmitLogin"]);  
        console.log("hier gehts weiter mit 110");
        actualPasswordFieldSet = false;
        UsernameEmailFieldSet = false;
        console.log("usernameField = " + usernameField);
        username = window.content.document.getElementsByName(usernameField)[0].value;
        PWInfo = "";
        orderNumber ++;
      }
      else if(actualPasswordFieldSet && !UsernameEmailFieldSet && !newPasswordFieldSet){
        console.log("this is a part of a login form with 100");
        userWebPath.setItem(orderNumber,[form.id,form.name,tabs.activeTab.url,form.action,passwordField,passwordFieldID,"","","SubmitLogin"]);  
        actualPasswordFieldSet = false;
        PWInfo = "";
        orderNumber ++;
      }
      else if(UsernameEmailFieldSet && !actualPasswordFieldSet && !newPasswordFieldSet){
        console.log("this is a part of a login form with 010");
        userWebPath.setItem(orderNumber,[form.id,form.name,tabs.activeTab.url,form.action,"","",usernameField,usernameFieldID,"SubmitLogin"]);  
        UsernameEmailFieldSet = false;
        username = form.getElementsByName(usernameField)[0].value;
        console.log("username ist nun " + username);
        console.log("mit dem namen  " + usernameField);
        PWInfo = "";
        orderNumber ++;
      }
      else if(actualPasswordFieldSet && newPasswordFieldSet && !UsernameEmailFieldSet){
        console.log("this is a passwordchange form with 101 with number " + orderNumber);
        console.log("test with 1" + form.id + " 2" + form.name + " 3" + tabs.activeTab.url + " 4" + numOfPWFields + " 5" + PWInfo);
        userWebPath.setItem(orderNumber,[form.id,form.name,tabs.activeTab.url,form.action,numOfPWFields,PWInfo,"SubmitPWChange"]); 
        PWInfo = "";
        orderNumber ++; 
        console.log("hier gehts weiter mit 101");
        actualPasswordFieldSet = false;
        newPasswordFieldSet = false;
        console.log(getLastPasswordEntry(form));
        console.log("newPasswordFieldName = " + newPasswordFieldName);
        console.log("form.getElementsByName(newPasswordFieldName)[0].value; = " + window.content.document.getElementsByName(newPasswordFieldName)[0].value);


        if(newPasswordFieldID != ""){
          console.log("wir sind bei 1");
          password = window.content.document.getElementById(newPasswordFieldID).value;
        }
        else if(newPasswordFieldName != ""){
          console.log("wir sind bei 2");
          password = window.content.document.getElementsByName(newPasswordFieldName)[0].value;
        }
        else{
          console.log("wir sind bei 3");
          password = getLastPasswordEntry(form);
          console.log("passwort ist nun" + passwort); 
        }
        console.log("passwort ist nun" + passwort); 
        console.log("mit dem Namen " + newPasswordFieldName);
        
      }
      else if(newPasswordFieldSet && !actualPasswordFieldSet && !UsernameEmailFieldSet){
        console.log("this is a passwordchange form und es wird das 001");
        userWebPath.setItem(orderNumber,[form.id,form.name,tabs.activeTab.url,form.action,newPasswordFieldName, newPasswordFieldID,numOfPWFields,PWInfo,"SubmitPWChange"]);
        newPasswordFieldSet = false;
        if(newPasswordFieldID != "")
          password = window.content.document.getElementById(newPasswordFieldID).value;
        else if(newPasswordFieldName != "")
          password = window.content.document.getElementsByName(newPasswordFieldName).value;
        else
          password = getLastPasswordEntry(form);
        console.log("passwort ist nun" + passwort);
        console.log("mit dem Namen " + newPasswordFieldName);
        PWInfo = "";
        orderNumber ++;
      }
      else if(!newPasswordFieldSet && !actualPasswordFieldSet && !UsernameEmailFieldSet){
        userWebPath.setItem(orderNumber,[form.id,form.name,tabs.activeTab.url,form.action,"SubmitOnly"]);
        orderNumber ++;
      }
      console.log("webpathlength " + userWebPath.length);
      // save all data about login form but not password because it will be changed later
      /*
      if((numOfPWFields == 1) && (elem.length > 1)){
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
      else if((numOfPWFields == 1) && (elem.length == 1)){
        password = getLastPasswordEntry(form);
        userWebPath.setItem(orderNumber,[form.id,tabs.activeTab.url,form.action,"SubmitPWChange"]);
      }

      if(numOfPWFields > 1){
        password = getLastPasswordEntry(form);
        userWebPath.setItem(orderNumber,[form.id,tabs.activeTab.url,form.action,"SubmitPWChange"]);
      }

      if(numOfPWFields == 0){
        userWebPath.setItem(orderNumber,[form.id,tabs.activeTab.url,form.action,"Submit"]);
      }
      */

      console.log("passwordField = " + passwordField);
      console.log("password = " + password);
      console.log("usernameField = " + usernameField);
      console.log("username = " + username);
      console.log("active url = " + formActiveURL);
      console.log("formAction = " + formSubmitURL);
    },false);
  
  
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
        
        if(Logout != null){
          userWebPath.setItem(orderNumber,[m[1],m[2],m[3],tabs.activeTab.url,m[4],m[5],m[0]]);
          orderNumber++;
          Logout = null;
        }
        
      }
      else if(e.target.type == "submit"){
        console.log("HEY A SUBMIT 2");

      console.log("form id = " + e.target.id);
      console.log("form action = " + e.target.action);
      
      form = e.target;

      var elem = form.getElementsByTagName("Input");
      var numOfPWFields = 0;

      if(webPage == "")
        webPage = getMainPageFromLink(tabs.activeTab.url);

      // Set webpage -> will be the key in simple-storage for this Hashtable
      if(webPage == "")
        webPage = getMainPageFromLink(tabs.activeTab.url);

      console.log("elements= " + elem.length);

      //how many passwordfields does the form contain?
      numOfPWFields = countAllChildrenOfType(form,"password");
      if (numOfPWFields == 0){
        return;
      }

      console.log("THERE ARE " + numOfPWFields + " PASSWORD FIELDS IN THIS FORM");

      console.log("######actualPasswordFieldSet = " + actualPasswordFieldSet);
      console.log("######UsernameEmailFieldSet = " + UsernameEmailFieldSet);
      console.log("######newPasswordFieldSet = " + newPasswordFieldSet);
      console.log("######passwortField = " + passwordField);
      console.log("######passwordFieldID = " + passwordFieldID);
      console.log("######usernameField = " + usernameField);
      console.log("######usernameFieldID = " + usernameFieldID);


      if(actualPasswordFieldSet && UsernameEmailFieldSet && !newPasswordFieldSet){
        console.log("this is a login form with 110 in ordernumber " + orderNumber);
        userWebPath.setItem(orderNumber,[form.id,form.name,tabs.activeTab.url,form.action,passwordField,passwordFieldID,usernameField,usernameFieldID,"SubmitLogin"]);  
        actualPasswordFieldSet = false;
        UsernameEmailFieldSet = false;
        PWInfo = "";
        orderNumber ++;
      }
      else if(actualPasswordFieldSet && !UsernameEmailFieldSet && !newPasswordFieldSet){
        console.log("this is a part of a login form with 100");
        userWebPath.setItem(orderNumber,[form.id,form.name,tabs.activeTab.url,form.action,passwordField,passwordFieldID,"","","SubmitLogin"]);  
        actualPasswordFieldSet = false;
        PWInfo = "";
        orderNumber ++;
      }
      else if(UsernameEmailFieldSet && !actualPasswordFieldSet && !newPasswordFieldSet){
        console.log("this is a part of a login form with 010");
        userWebPath.setItem(orderNumber,[form.id,form.name,tabs.activeTab.url,form.action,"","",usernameField,usernameFieldID,"SubmitLogin"]);  
        UsernameEmailFieldSet = false;
        PWInfo = "";
        orderNumber ++;
      }

      if(actualPasswordFieldSet && newPasswordFieldSet && !UsernameEmailFieldSet){
        console.log("this is a passwordchange form with 101");
        userWebPath.setItem(orderNumber,[form.id,form.name,tabs.activeTab.url,form.action,newPasswordFieldName, newPasswordFieldID,numOfPWFields,PWInfo,"SubmitPWChange"]);  
        actualPasswordFieldSet = false;
        newPasswordFieldSet = false;
        if(newPasswordFieldID != "")
          password = window.content.document.getElementById(newPasswordFieldID).value;
        else
          password = window.content.document.getElementsByName(newPasswordFieldName).value;
        PWInfo = "";
        orderNumber ++;
      }
      else if(newPasswordFieldSet && !actualPasswordFieldSet && !UsernameEmailFieldSet){
        console.log("this is a passwordchange form und es wird das 001");
        userWebPath.setItem(orderNumber,[form.id,form.name,tabs.activeTab.url,form.action,newPasswordFieldName, newPasswordFieldID,numOfPWFields,PWInfo,"SubmitPWChange"]);
        newPasswordFieldSet = false;
        if(newPasswordFieldID != "")
          password = window.content.document.getElementById(newPasswordFieldID).value;
        else
          password = window.content.document.getElementsByName(newPasswordFieldName).value;
        PWInfo = "";
        orderNumber ++;
      }
      console.log("webpathlength " + userWebPath.length);
        /*
        console.log("form id = " + e.target.form.id);
        console.log("form action = " + e.target.form.action);
        console.log("HEY THATS A SUBMIT WITHOUT SUBMITEVENT");

        form = e.target.form;

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
      if((numOfPWFields == 1) && (elem.length > 1)){
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

      else if((numOfPWFields == 1) && (elem.length == 1)){
        password = getLastPasswordEntry(form);
        userWebPath.setItem(orderNumber,[form.id,tabs.activeTab.url,form.action,"SubmitPWChange"]);
      }

      if(numOfPWFields > 1){
        password = getLastPasswordEntry(form);
        userWebPath.setItem(orderNumber,[form.id,tabs.activeTab.url,form.action,"SubmitPWChange"]);
      }

      if(numOfPWFields == 0){
        userWebPath.setItem(orderNumber,[form.id,tabs.activeTab.url,form.action,"Submit"]);
      }

      
      console.log("passwordField = " + passwordField);
      console.log("password = " + password);
      console.log("usernameField = " + usernameField);
      console.log("username = " + username);
      console.log("active url = " + formActiveURL);
      console.log("formAction = " + formSubmitURL);

        // if login not existing yet in password manager
        if(userWebPath != null){
          orderNumber++;  
        }
        else{
          return;
        }
        */
      }

    }, false);

  }

  // stop logging actions and remove all listener
  this.StopRecording = function(){
    IsActive = false;
    orderNumber = 0;
    var resultPath;
    destroyContextmenu();
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
    resultPath = userWebPath;

    // clear all variables
    orderNumber = 0;
    oldURL = "";
    url = "";
    mainWindow;
    IsActive = false;
    userWebPath = null;
    savedInFFPWM = false;
    existingLogin = false;
    pwList = null;
    password = "";
    username = "";
    form = null;
    passwordField = "";
    usernameField = "";
    formSubmitURL = "";
    formActiveURL = "";
    newPasswordFieldSet = false;
    newPasswordFieldName = "";
    newPasswordFieldID = "";
    passwordFieldID = "";
    actualPasswordFieldSet = false;
    UsernameEmailFieldSet = false;
    UsernameEmailFieldID = "";
    Logout = null;
    return resultPath;
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
    var webPage4Change = webPage;
    console.log("the page for change is : " + webPage);
    webPage = "";

    return webPage4Change;
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
    if((result.length != 0) && (result.getItem(result.length - 1)[result.getItem(result.length - 1).length-1] != "Submit"))
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
    console.log("before saving check 1" + password + " 2" + passwordField + " 3" + usernameField + " 4" + username + " 5" + formActiveURL + " 6" + formSubmitURL);
    if((passwordField == "") || (password == "") || (usernameField == "") || (username == "") || (formActiveURL == "") || (formSubmitURL == "")){
        return;
    }

    var pwExists = false;
    var oldPW;
    for(var i = 0; i < pwList.length;i++){
      console.log("if " + pwList.getItem(i)[0] + " == " + getMainPageFromLink(url) + " && " + pwList.getItem(i)[2] + " == " + username);
      if((pwList.getItem(i)[2] == getMainPageFromLink(url)) && (pwList.getItem(i)[0] == username)){
        pwExists = true;
        oldPW = pwList.getItem(i)[1];
      }
    }
    console.log("pw already exists" + pwExists);
    console.log("stored login with url: " + url + " , formSubmitURL: " + formSubmitURL + " , username: " + username + " , usernameField: " + usernameField + " , password: " + password + " , passwordField: " + passwordField);
    // save new Login 
    if(pwExists){
      require("sdk/passwords").remove({
        url: getMainPageFromLink(url),
            formSubmitURL: formSubmitURL,
            username: username,
            usernameField: usernameField,
            password: oldPW,
            passwordField: passwordField,
        onComplete: function onComplete() {
          require("sdk/passwords").store({
            url: getMainPageFromLink(url),
            formSubmitURL: formSubmitURL,
            username: username,
            usernameField: usernameField,
            password: password,
            passwordField: passwordField
          })
        },
        onError: function onError(){
          console.log("kein login gefunden mit username " + username + " und url = " + getMainPageFromLink(url));
        }
      });
    }
    else{
      require("sdk/passwords").store({
        url: getMainPageFromLink(url),
        formSubmitURL: formSubmitURL,
        username: username,
        usernameField: usernameField,
        password: password,
        passwordField: passwordField
      });
    }
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

  function buildContextmenu(){
    RecordingMenu = cm.Menu({
        label: "Markieren als:",
        contentScriptFile: self.data.url("ContextMenuScript.js"),
        onMessage: function(m){
          console.log("thats the event" + m[0]);
          
          setMessageValues(m);
          sendDataToWorker(m);
        },
        items: [
          cm.Item({ label: "Benutzername/Email", data: "BE1" }),
          cm.Item({ label: "Aktuelles Passwort", data: "AP2" }),
          cm.Item({ label: "Neues Passwort", data: "NP3" }),
          cm.Item({ label: "Logout-Knopf", data: "Logout" })
        ]
      });
  }

  function setMessageValues(m){
    switch(m[0]){
      case "BE1": 
        if(usernameField == "")
          usernameField = m[4];
        if(usernameFieldID == "")
          usernameFieldID = m[3];
        if(formSubmitURL == "")
          formSubmitURL = m[6];
        if(formActiveURL == "")
          formActiveURL = tabs.activeTab.url;
        console.log("wir sind im BE1 block und usernamebalabal ist nun true");
        UsernameEmailFieldSet = true;
        break;
      case "AP2": 
        if(passwordField == "")
          passwordField = m[4];
        actualPasswordFieldSet = true;
        if(formSubmitURL == "")
          formSubmitURL = m[6];
        if(formActiveURL == "")
          formActiveURL = tabs.activeTab.url;
        if(passwordFieldID == "")
          passwordFieldID = m[3];
        PWInfo = PWInfo + "A";
        break;
      case "NP3": 
        PWInfo = PWInfo + "N";
        if(newPasswordFieldName == "")
          newPasswordFieldName = m[4];
        if(newPasswordFieldID = "")
          newPasswordFieldID = m[3];
        if(formSubmitURL == "")
          formSubmitURL = m[6];
        if(formActiveURL == "")
          formActiveURL = tabs.activeTab.url;
        newPasswordFieldSet = true;
        break;
      case "Logout": 
        Logout = m;
        break;      
    }
  }

  function sendDataToWorker(m){
    worker = tabs.activeTab.attach({
      contentScriptFile: self.data.url("RecorderPageContentScript.js")
    });

    worker.port.emit("ContextMenuClick",m);
  }
  function destroyContextmenu(){
    RecordingMenu.destroy();
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