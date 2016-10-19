/*
This ist the main sourcefile for the Addon
*/

//Addon-SDK
var { ActionButton } = require("sdk/ui/button/action");
var { Cc, Ci } = require('chrome');
var pageWorkers = require("sdk/page-worker");
var panels = require("sdk/panel");
var self = require("sdk/self");
var URL = require('sdk/url').URL;
var tabs = require('sdk/tabs');
var ss = require("sdk/simple-storage");
var ffpwm = require("sdk/passwords");
var { viewFor } = require("sdk/view/core");
var window = viewFor(require("sdk/windows").browserWindows[0]);

//own classes and variables
var Recorder = require('lib/Recorder');
var Imitator = require('lib/Imitator');
var Hashtable = require('lib/Hashtable');
var url = URL(tabs.activeTab.url);
var myRecorder = new Recorder();
var myHashtable = null;
var AccountlistWorker = null;

var _ = require("sdk/l10n").get;

const panelWidth = 150;
const panelHeight = 70;

   if(!ss.storage.PWCPaths){ // if storage is empty
    PWCPaths = new Hashtable();
  }
  else{
    var it = ss.storage.PWCPaths.items;
    var myh = new Hashtable();
    var strOut = "";
    for(property in ss.storage.PWCPaths.items){
      var tempHash = new Hashtable();
      for(var i = 0; i < ss.storage.PWCPaths.items[property].length;i++){
        tempHash.setItem(i,ss.storage.PWCPaths.items[property].items[i]);
      }
      myh.setItem(property,tempHash);
    }
    delete ss.storage.PWCPaths;
    ss.storage.PWCPaths = myh;
  }

//create main button of addon
if(getBrightness() > 0.5) {
    var button = ActionButton({
      id: "addonButton",
      label: "PasswortChanger",
      icon: {
        "16": "./images/icon-16.png",
        "32": "./images/icon-32.png",
        "64": "./images/icon-64.png"
      },
      badge: 'ok',
      badgeColor: "#00AAAA",
      onClick: handleClick
    });
} else {
    var button = ActionButton({
      id: "addonButton",
      label: "PasswortChanger",
      icon: {
        "16": "./images/icon_dark-16.png",
        "32": "./images/icon_dark-32.png",
        "64": "./images/icon_dark-64.png"
      },
      badge: 'ok',
      badgeColor: "#00AAAA",
      onClick: handleClick
    });
}

// panel ist das Optionsmenu mit den button für Aufzeichnen und die Accountliste
var panel = panels.Panel({
  contentURL: self.data.url("OptionPanel.html"),
  contentScriptFile: self.data.url("OptionPanelHandler.js"),
  onHide:handleHidePanel
});

function getBrightness(){
    var navbar = window.document.getElementById("nav-bar");
    var windowColor = window.getComputedStyle(navbar,null).getPropertyValue("background-color");
    var match = windowColor.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
    var R = match[1];
    var G = match[2];
    var B = match[3];
    var brightness = 0.2126 * (Math.pow((R / 255),2.2)) + 0.7152 * (Math.pow((G / 255),2.2)) + 0.0722 * (Math.pow((B / 255),2.2));
    console.log("Farbe: " + brightness);
    return brightness;
}

// handle click on main button and shows the option panel
function handleClick(state){
  panel.port.emit("startBuilding");
  panel.show({
    position: button
  });
  panel.resize(panelWidth,panelHeight);
  //button.icon = "./images/stop.png";
}

// fires when recording in panel has been clicked
panel.port.on("stopgorecord", LetStartRecord = function(){
  panel.hide();
  // if recorder was is recording already -> stop
  if(myRecorder.RecorderIsActive()){
    myHashtable = new Hashtable();
    myHashtable = myRecorder.StopRecording();
    console.log("ended recording");

    // save password change path in simple storage
    savePWCPath(myRecorder.GetWebPage4PWChange(),myHashtable);
    myHashtable = null;
    allCookies = window.content.document.cookie;
    console.log(allCookies);
  }

  // if recorder is not recording -> start
  else{
    myRecorder.StartRecording();
    console.log("started recording");
  }
});

// listener fires, when clicked open accountlist in option panel
panel.port.on("openAccountList", openAcclist = function(){

  var pwHash = new Hashtable();
  var i = 0;

  panel.hide();

  // save all urls and usernames which are stored in password manager of firefox in a hashtable
  // this is necessary because this action is asyncronous and should be done early before data is needed
  require("sdk/passwords").search({
    onComplete: function onComplete(credentials) {
      credentials.forEach(function(credential) {
        var temp = [credential.username,credential.url];
        pwHash.setItem(i,temp);
        i++;
        });
      }
    });

  // opens a new tab with all accounts which are stores in password manager
  tabs.open({
    url: self.data.url("Accountlist.html"),
    isPinned: false,
    onReady: function onOpen(tab) {
      // attaching script to the accountlist tab
      AccountlistWorker = tab.attach({
        contentScriptFile: [self.data.url("jquery.min.js"),self.data.url("jquery-ui.min.js"),self.data.url("AccountlistContentScript.js")]
      });

      // lets build Accountlist dynamically
      AccountlistWorker.port.emit("startBuildingAccountlist", pwHash);

      // listening for deleteEntry event
      AccountlistWorker.port.on("deleteThisEntry", function(urlAndName){
        // deletes login from password manager
        deleteLoginData(urlAndName[0],urlAndName[1]);
      });

      //listening for change password event
      AccountlistWorker.port.on("changePW", function(urlAndName){
        if(typeof(getPWCPath(urlAndName[0])) === "undefined"){ // if addon does not know the path for changing yet
          AccountlistWorker.port.emit("NoChangeWay", urlAndName[0]);
        }
        else {
          changeAutomaticPassword(getPWCPath(urlAndName[0]),urlAndName[1], urlAndName[0]);
        }
      });

      //listening for startRecord event
      // opens new tab , navigates to the url and starts recording
      AccountlistWorker.port.on("startRecord", function(url){
        tabs.activeTab.close();
        tabs.open(url);
        panel.port.emit("switchRecordbuttonLabel");
        LetStartRecord();
      });

      //listening for navigate to password change form event
      AccountlistWorker.port.on("Nav2ChangeForm", function(urlAndName){
        if(typeof(getPWCPath(urlAndName[0])) === "undefined"){ // if addon does not know the path for changing
          console.log("lets navigate to change with url = " + urlAndName[0] + "and name = " + urlAndName[1]);
          AccountlistWorker.port.emit("NoChangeWay", urlAndName[0]);
        }
        else
        var hashtbl = getPWCPath(urlAndName[0]);
        if(typeof(hashtbl) !== 'undefined')
          navigateUserToChangePWManual(hashtbl,urlAndName[1], urlAndName[0]);
      });

      //listening for Import Blueprint event
      AccountlistWorker.port.on("ImportBP", function(){
        console.log("Import läuft");
        importNewBlueprint();
      });

      //listening for Export Blueprint event
      AccountlistWorker.port.on("ExportBP", function(url){
        if(typeof(getPWCPath(url)) === "undefined"){ // if addon does not know the path for changing
          AccountlistWorker.port.emit("NoChangeWay", url);
        }
        else{
          var bp = getPWCPath(url);
          bp.setItem(bp.length,url);
          createNewBPFile(bp,url);
        }
      });

      // listening when user clicked on button to open the blueprint menu
      AccountlistWorker.port.on("OpenBlueprints",openBlueprints = function(){
        tabs.open({
          url: self.data.url("Blueprints.html"),

          onReady: function onOpen(tab) {
            BlueprintWorker = tab.attach({
              contentScriptFile: [self.data.url("jquery.min.js"),self.data.url("jquery-ui.min.js"),self.data.url("BlaupauseContentScript.js")]
            });

            // let build Blueprint menu dynamically
            BlueprintWorker.port.emit("startBuildingBlueprints", ss.storage.PWCPaths);

            // listening for deleteEntry event
            // deletes entry in simple-storage and reopens the blueprint menu
            BlueprintWorker.port.on("deleteThisEntry", function(url){
              console.log("deleting this entry from ss: " + url);
              deletePWCPath(url);
              tabs.activeTab.close();
              openBlueprints();
            });
          }
        });
      });
    },
    onClose: function onClosing(){
      AccountlistWorker.port.emit("closing");
    }
  });
});

function handleHidePanel(){
  // may be later needed
  //panel.port.emit("hide");
}

/* increments badge counter of button
can be used in future for assign alerts or messages to the user*/
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
  /* parameter :
  hashtbl: hashtable object that contains the blueprint for changing password at certain url
  username: the username for account thats password should be changed
  url: that is the url of the website where a passowrd should be changed
  */
function changeAutomaticPassword(hashtbl, username, url){
  var imit = null;
  var i = 0;
  var j = 0;
  var hash4AutPWChange = new Hashtable();

  // delete all Clickevents from the hashtable

  while(i < hashtbl.length){
     console.log("hashtbl.getItem(i)[hashtbl.getItem(i).length - 1]"+ hashtbl.getItem(i)[hashtbl.getItem(i).length - 1]);
    if(hashtbl.getItem(i)[hashtbl.getItem(i).length - 1] != "Click"){
      hash4AutPWChange.setItem(j,hashtbl.getItem(i));
      j++
    }
    i++;
  }

  // Create new Imitator object for changing pw atomatically
  imit = new Imitator(hash4AutPWChange,username,url);

  console.log("changing password for username: " + username + " on url: " + url);

  // start imitating
  imit.Init();
}

/*
navigates user to the form where s/he can change manually password
parameter:
hashtbl: hashtable object that contains the blueprint for changing password at certain url
username: the username for account thats password should be changed
url: that is the url of the website where a passowrd should be changed
*/
function navigateUserToChangePWManual(hashtbl, username, url){
  var imit = null;
  var hash4Navigation = new Hashtable();
  var i = 0;
  var j = 0;

  console.log("hashtbl.length"+ hashtbl.length);
  console.log("hashtbl.getItem(0)"+ hashtbl.getItem(0));
  while((i < hashtbl.length) && (hashtbl.getItem(i)[hashtbl.getItem(i).length - 1] != "SubmitPWChange")){
     console.log("hashtbl.getItem(i)[hashtbl.getItem(i).length - 1]"+ hashtbl.getItem(i)[hashtbl.getItem(i).length - 1]);
    if(hashtbl.getItem(i)[hashtbl.getItem(i).length - 1] == "SubmitLogin"){
      hash4Navigation.setItem(j,hashtbl.getItem(i));
      j++
    }
    i++;
  }

  hash4Navigation.setItem(j,[hashtbl.getItem(i)[2],"SiteChange"])

   hash4Navigation.each(function(k, v) {
          console.log(' hash4navigation key is: ' + k + ', value is: ' + v);
        });

  imit = new Imitator(hash4Navigation,username,url);
  imit.Init();
}


//persistent storage of hashtable objects in simple-storage, only accessible from addon
/*
saves a blueprint-entry in simple-storage
paramter:
key4Obj: url of website where password should be changed
myObject: Hashtable that contains the blueprint for password change
*/
function savePWCPath(key4Obj,myObject){
  var PWCPaths;
  console.log("save key4Obj = " + key4Obj + " and myObject" + myObject + "in simple-storage");
  if(!ss.storage.PWCPaths){ // if storage is empty
    PWCPaths = new Hashtable();

  }
  else{
    PWCPaths = ss.storage.PWCPaths;
  }

  PWCPaths.setItem(key4Obj,myObject);
  ss.storage.PWCPaths = PWCPaths;

  ss.storage.PWCPaths.each(function(k, v) {
      console.log('key in pwcpath is: ' + k + ', value is: ' + v);
      v.each(function(k, v) {
        console.log('key in pwcpath in element is: ' + k + ', value is: ' + v);
      });
    });
}
// parameter
// key4Obj: url that is used as key in simple-storage for a hashtable with blueprint
// returns hashtable object with blueprint
function getPWCPath(key4Obj){
  var PWCPaths;

  if(!ss.storage.PWCPaths){ // if storage is empty
    return;
  }

  PWCPaths = ss.storage.PWCPaths;
  return PWCPaths.getItem(key4Obj);;
}

// remove elements from persistent storage
// key4obj is basisurl from password-change-path
function deletePWCPath(key4Obj){
  var PWCPaths;
  if(!ss.storage.PWCPaths){ // if storage is empty
    return;
  }
  PWCPaths = ss.storage.PWCPaths;
  PWCPaths.removeItem(key4Obj);
  ss.storage.PWCPaths = PWCPaths;

}

// deletes login data in passwordmanager
// deletes blueprint from persistent storage if this was the last entry for this url only
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
/*
function for testing
lists all login entries which are stored in password manager
*/
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

//returns text of a file
// function from mozilla documentation but modified
// https://developer.mozilla.org/en-US/Add-ons/Code_snippets/File_I_O#Reading_a_file

  function openFile(){
    var data = "";
    var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
    var cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);


    var nsIFilePicker = Ci.nsIFilePicker;
    var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);

    var rv = fp.show();
    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
      var file = fp.file;
      // Get the path as string. Note that you usually won't
      // need to work with the string paths.
      var path = fp.file.path;
      // work with returned nsILocalFile...
      console.log(file + " " + path);

      fstream.init(file, -1, 0, 0);
      cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish
      let str = {};
        let read = 1;
        while(read!=0){
          read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
          data += str.value;
        }

      cstream.close(); // this closes fstream
      console.log(data);
    }
    return data;
  }

//creates ew BP file
// parts of function are taken from https://developer.mozilla.org/en-US/Add-ons/Code_snippets/File_I_O#Reading_a_file
// parameter:
// bp: hashtable that contains a blueprint
// url: url of wensite of blueprint
function createNewBPFile(bp,url){
  // convert hashtable to JSON
  var JsonBP = JSON.stringify(bp);
  var desktopPath = require('sdk/system').pathFor('Desk');
  var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);

  // generate a name for file
  var split = url.split("//");
  var name = split[1];//.replace(".","_");
  var path = desktopPath+"/"+name + "_BP.txt";


  file.initWithPath(path);

  // file is nsIFile, data is a string
  var foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);

  // use 0x02 | 0x10 to open file for appending.
  foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
  // write, create, truncate
  // In a c file operation, we have no need to set file mode with or operation,
  // directly using "r" or "w" usually.

  // if you are sure there will never ever be any non-ascii text in data you can
  // also call foStream.write(data, data.length) directly
  var converter = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
  converter.init(foStream, "UTF-8", 0, 0);
  converter.writeString(JsonBP);
  converter.close(); // this closes foStream

  window.content.alert("Erfolgreich exportiert auf Ihren Desktop als " + name + "_BP.txt");
}

//imports new blueprint
// opens filemanager for picking a extern file
function importNewBlueprint(){
  var data;
  var newBP = new Hashtable();
  var keys;
  var storageKey = "";
  var parsedData;
  data = openFile();

  // convert JSON to an Object
  parsedData = JSON.parse(data);
  keys = Object.keys(parsedData.items);

  console.log(parsedData.length);

  for(var i = 0; i < parsedData.length;i++){
    console.log("set (" + keys[i] + ", " + parsedData.items[i]+ ")");
    newBP.setItem(keys[i],parsedData.items[i]);
  }

  // store in simple-storage
  storageKey = newBP.getItem(newBP.length-1);
  newBP.removeItem(newBP.length-1);
  savePWCPath(storageKey,newBP);
  window.content.alert("Die Blaupause wurde importiert. Sie können sie sich unter 'Blaupausen anzeigen' anzeigen lassen.");
}
