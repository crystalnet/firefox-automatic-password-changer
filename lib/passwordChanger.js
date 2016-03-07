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
        changeAutomaticPassword(getPWCPath(urlAndName[0]),urlAndName[1], urlAndName[0]);
      });  

      //listening for startRecord event
      AccountlistWorker.port.on("startRecord", function(url){
        tabs.activeTab.close();
        tabs.open(url);
        panel.port.emit("switchRecordbuttonLabel");
        LetStartRecord();
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
  var imit = new Imitator(hashtbl,username,url);

  console.log("changing password for username: " + username + " on url: " + url);


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


