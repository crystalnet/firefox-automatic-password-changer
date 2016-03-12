var { ActionButton } = require("sdk/ui/button/action");
var pageWorkers = require("sdk/page-worker");
var panels = require("sdk/panel"); 
var self = require("sdk/self");
var Recorder = require('lib/Recorder');
var Imitator = require('lib/Imitator');
var Hashtable = require('lib/Hashtable');
var URL = require('sdk/url').URL;
var tabs = require('sdk/tabs');
var ss = require("sdk/simple-storage");
var ffpwm = require("sdk/passwords");
var url = URL(tabs.activeTab.url);
var myRecorder = new Recorder();
var myHashtable;
var AccountlistWorker = null;



const panelWidth = 150;
const panelHeight = 90;

// just for testing -------------------------------------------------

require("sdk/passwords").store({
    url: "https://de.wikipedia.org",
    formSubmitURL: "https://de.wikipedia.org/w/index.php?title=Spezial:Anmelden&action=submitlogin&type=login&returnto=Wikipedia:Hauptseite",
    username: "tutest1234",
    usernameField: "wpName",
    password: "test1234567891",
    passwordField: "wpPassword"
  });

  require("sdk/passwords").store({
    url: "http://www.example.com",
    formSubmitURL: "http://login.example.com",
    username: "joe",
    usernameField: "uname",
    password: "SeCrEt123",
    passwordField: "pword"
  });
  require("sdk/passwords").store({
    url: "http://www.example.de",
    formSubmitURL: "http://login.example.de",
    username: "hank",
    usernameField: "hisname",
    password: "anothersecret",
    passwordField: "pass"
  });
  require("sdk/passwords").store({
    url: "http://www.example.ru",
    formSubmitURL: "http://login.example.ru",
    username: "gera",
    usernameField: "myname",
    password: "mysecret",
    passwordField: "parolj"
  });

  if(ss.storage.PWCPaths == null){ // if storage is empty
    ss.storage.PWCPaths = new Hashtable();
  }

  var example = new Hashtable();
  example.setItem(0,["https://www.wikipedia.org/","SiteChange"]);
  example.setItem(1,["https://www.wikipedia.org/",272,173,582,957,"Click"]);
  example.setItem(2,["https://de.wikipedia.org/wiki/Wikipedia:Hauptseite","SiteChange"]);
  example.setItem(3,["https://de.wikipedia.org/wiki/Wikipedia:Hauptseite",897,19,582,957,"Click"]);
  example.setItem(4,["https://de.wikipedia.org/w/index.php?title=Spezial:Anmelden&returnto=Wikipedia%3AHauptseite","SiteChange"]);
  example.setItem(5,["https://de.wikipedia.org/w/index.php?title=Spezial:Anmelden&returnto=Wikipedia%3AHauptseite",226,337,582,957,"Click"]);
  example.setItem(6,["","https://de.wikipedia.org/w/index.php?title=Spezial:Anmelden&returnto=Wikipedia%3AHauptseite","https://de.wikipedia.org/w/index.php?title=Spezial:Anmelden&action=submitlogin&type=login&returnto=Wikipedia:Hauptseite","wpPassword","wpName","SubmitLogin"]);
  example.setItem(7,["https://de.wikipedia.org/wiki/Wikipedia:Hauptseite","SiteChange"]);
  example.setItem(8,["https://de.wikipedia.org/wiki/Wikipedia:Hauptseite",636,15,582,957,"Click"]);
  example.setItem(9,["https://de.wikipedia.org/wiki/Spezial:Einstellungen","SiteChange"]);
  example.setItem(10,["https://de.wikipedia.org/wiki/Spezial:Einstellungen",420,521,582,957,"Click"]);
  example.setItem(11,["https://de.wikipedia.org/w/index.php?title=Spezial:Passwort_%C3%A4ndern&returnto=Spezial%3AEinstellungen","SiteChange"]);
  example.setItem(12,["https://de.wikipedia.org/w/index.php?title=Spezial:Passwort_%C3%A4ndern&returnto=Spezial%3AEinstellungen",314,315,582,957,"Click"]);
  example.setItem(13,["https://de.wikipedia.org/w/index.php?title=Spezial:Passwort_%C3%A4ndern&returnto=Spezial%3AEinstellungen",296,408,582,957,"Click"]);
  example.setItem(14,["https://de.wikipedia.org/w/index.php?title=Spezial:Passwort_%C3%A4ndern&returnto=Spezial%3AEinstellungen",342,488,582,957,"Click"]);
  example.setItem(15,["mw-resetpass-form","https://de.wikipedia.org/w/index.php?title=Spezial:Passwort_%C3%A4ndern&returnto=Spezial%3AEinstellungen","https://de.wikipedia.org/wiki/Spezial:Passwort_%C3%A4ndern","SubmitPWChange"]);
  example.setItem(16,["https://de.wikipedia.org/wiki/Spezial:Passwort_%C3%A4ndern","SiteChange"]);
  example.setItem(17,["https://de.wikipedia.org/wiki/Spezial:Passwort_%C3%A4ndern",899,19,582,957,"Click"]);
  example.setItem(18,["https://de.wikipedia.org/w/index.php?title=Spezial:Abmelden&returnto=Spezial%3AEinstellungen","SiteChange"]);
  example.setItem(19,["https://de.wikipedia.org/w/index.php?title=Spezial:Abmelden&returnto=Spezial%3AEinstellungen",894,67,582,957,"Click"]);
  ss.storage.PWCPaths.setItem("https://de.wikipedia.org",example);
  //--------------------------------------------------------------------

//main button for addon
var button = ActionButton({
  id: "addonButton",
  label: "PasswortChanger",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png"
  },
  badge: 'ok',
  badgeColor: "#00AAAA",
  onClick: handleClick
});

// Panel as option menu for main button
var panel = panels.Panel({
  contentURL: self.data.url("optionPanel.html"),
  contentScriptFile: self.data.url("OptionPanelHandler.js"),
  onHide:handleHidePanel
});

// handle click on main button
function handleClick(state){
  panel.port.emit("startBuilding");
  panel.show({
    position: button
  });
  panel.resize(panelWidth,panelHeight); 
}

// listen for show event and send message to panel
panel.on("show", function(){
  panel.port.emit("show");
});

// fires when recording in panel has been clicked
panel.port.on("stopgorecord", LetStartRecord = function(){
  if(myRecorder.RecorderIsActive()){
    myHashtable = new Hashtable();
    myHashtable = myRecorder.StopRecording();
    console.log("ended recording");

    show_all_passwords(); //------------------DELETE_ME

    if(myRecorder.GetWebPage4PWChange() != ""){
      savePWCPath(myRecorder.GetWebPage4PWChange(),myHashtable);  
    }   
    else{
      console.log("No password change done");
    }
  }
  else{
    myRecorder.StartRecording();
    show_all_passwords();//------------------DELETE_ME
    console.log("started recording");
  }
});

panel.port.on("openAccountList", openAcclist = function(){

  var pwHash = new Hashtable();
  var i = 0;
  require("sdk/passwords").search({
    onComplete: function onComplete(credentials) {
      credentials.forEach(function(credential) {        
        console.log(credential.username);
        console.log(credential.password);

        var temp = [credential.username,credential.password,credential.url];

        pwHash.setItem(i,temp);
        i++;
        });
      }
    });

  tabs.open({
    url: self.data.url("Accountlist.html"),
    isPinned: true,
    onReady: function onOpen(tab) {
      AccountlistWorker = tab.attach({
        contentScriptFile: [self.data.url("jquery.min.js"),self.data.url("jquery-ui.min.js"),self.data.url("AccountlistContentScript.js")]
      });

      // let build Accountlist dynamically
      AccountlistWorker.port.emit("startBuildingAccountlist", pwHash);

      // listening for deleteEntry event
      AccountlistWorker.port.on("deleteThisEntry", function(urlAndName){
        console.log("here we are: url: " + urlAndName[0] + " name: " + urlAndName[1]);
        deleteLoginData(urlAndName[0],urlAndName[1]);
      });

      //listening for change password event 
      AccountlistWorker.port.on("changePW", function(urlAndName){
        if(typeof(getPWCPath(urlAndName[0])) === "undefined"){ // if addon does not know the path for changing
          AccountlistWorker.port.emit("NoChangeWay", urlAndName[0]);
        }
        else {
          changeAutomaticPassword(getPWCPath(urlAndName[0]),urlAndName[1], urlAndName[0]);
        }
      });  

      //listening for startRecord event
      AccountlistWorker.port.on("startRecord", function(url){
        tabs.activeTab.close();
        tabs.open(url);
        panel.port.emit("switchRecordbuttonLabel");
        LetStartRecord();
      });
      
      //listening for navigate to password change form event
      AccountlistWorker.port.on("Nav2ChangeForm", function(urlAndName){
        if(typeof(getPWCPath(urlAndName[0])) === "undefined"){ // if addon does not know the path for changing
          AccountlistWorker.port.emit("NoChangeWay", urlAndName[0]);
        }
        else 
          // TODO HERE NEW HASHTABLE ONLY UNTIL CHANGE PW FORM 

        console.log("function not implemented yet.");
        navigateUserToChangePWManual(getPWCPath(urlAndName[0]),urlAndName[1], urlAndName[0]);
          //changeAutomaticPassword(getPWCPath(urlAndName[0]),urlAndName[1], urlAndName[0]);
      });

    },
    onClose: function onClosing(){
      AccountlistWorker.port.emit("closing");
    }
  });
});

function handleHidePanel(){
  //panel.port.emit("hide");
}

/* increments badge counter of button */
function incBadge(state) {
  if (isNaN(state.badge)) {
    button.badge = 0;
  }
  button.badge = button.badge + 1;
  button.badgeColor = "#FF0000";
  console.log("button '" + state.label + "' was clicked");
}

/* resets badge counter of button */
function resetBadgeCount(state){
  button.badge = 'ok';
  button.badgeColor = "#00AAAA";
}

/* decrements badge counter of button */
function decBadge(state){
  if(!isNaN(button.badge)){

  }
  else if(button.badge == 1){
      resetBadgeCount(state);
  }
  else{
    button.badge = button.badge - 1;
  }
}

//change automatic password
function changeAutomaticPassword(hashtbl, username, url){
  // TODO Hashtable anpassen, sodass unnötige Felder gelöscht werden
  var imit = new Imitator(hashtbl,username,url);

  console.log("changing password for username: " + username + " on url: " + url);


  imit.Init();
}

function navigateUserToChangePWManual(hashtbl, username, url){
  var hash4Navigation = new Hashtable();
  var i = 0;
  var j = 0;
  console.log("navigating user to change pw for username: " + username + " on url: " + url);

  
  while((hashtbl.getItem(i)[hashtbl.getItem(i).length - 1] != "SubmitPWChange") && (i < hashtbl.length)){
    if(hashtbl.getItem(i)[hashtbl.getItem(i).length - 1] == "SubmitLogin"){
      hash4Navigation.setItem(j,hashtbl.getItem(i));
      j++  
    }
    i++;
  }

  hash4Navigation.setItem(j,[hashtbl.getItem(i)[1],"SiteChange"])

  var imit = new Imitator(hash4Navigation,username,url);
  imit.Init();
}

//persistent storage of hashtable objects in simple-storage, only accessible from addon
function savePWCPath(key4Obj,myObject){
  if(ss.storage.PWCPaths == null){ // if storage is empty
    ss.storage.PWCPaths = new Hashtable();
  }
  ss.storage.PWCPaths.setItem(key4Obj,myObject);
  
  console.log("data stored");

  ss.storage.PWCPaths.each(function(k, v) {
      console.log('key is: ' + k + ', value is: ' + v);
      v.each(function(k, v) {
        console.log('key is: ' + k + ', value is: ' + v);
      });
    });
}

//gets url as key4Obj 
// returns hashtable object with password-change-path
function getPWCPath(key4Obj){
  var resultHash;
  if(ss.storage.PWCPaths == null){ // if storage is empty
    return;
  }
  resultHash = ss.storage.PWCPaths.getItem(key4Obj);
  return resultHash;
}

// remove elements from persistent storage
// key4obj is basisurl from password-change-path
function deletePWCPath(key4Obj){
  if(ss.storage.PWCPaths == null){ // if storage is empty
    return;
  }
  ss.storage.PWCPaths.removeItem(key4Obj);
}

// deletes login data passwordmanager
// deletes password-change-path from persistent storage if this was the last entry for this url only
// reloads accountlist 
function deleteLoginData(url, username){
  ffpwm.search({
      username: username,
      url: url,
      onComplete: function onComplete(credentials) {
        credentials.forEach(ffpwm.remove);
        console.log("deleting login data from pwmanager name: " + username + " url: " + url);

        tabs.activeTab.close();
        openAcclist();
      }
    });

  ffpwm.search({
      url: url,
      onComplete: function onComplete(credentials) {
        if(credentials.username != ""){
          deletePWCPath(url);
        }
      }
    });
}


function show_all_passwords() {
  require("sdk/passwords").search({
    onComplete: function onComplete(credentials) {
      credentials.forEach(function(credential) {
        console.log(credential.username);
        console.log(credential.password);
        });
      }
    });
  }



