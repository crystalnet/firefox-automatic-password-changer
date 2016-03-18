var { ActionButton } = require("sdk/ui/button/action");
var { Cc, Ci } = require('chrome');
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
var { viewFor } = require("sdk/view/core");
var window = viewFor(require("sdk/windows").browserWindows[0]);
var url = URL(tabs.activeTab.url);
var myRecorder = new Recorder();
var myHashtable = null;
var AccountlistWorker = null;

const panelWidth = 150;
const panelHeight = 70;

// just for testing -------------------------------------------------


require("sdk/passwords").store({
    url: "https://de.wikipedia.org",
    formSubmitURL: "https://de.wikipedia.org/w/index.php?title=Spezial:Anmelden&action=submitlogin&type=login&returnto=Wikipedia:Hauptseite",
    username: "tutest1234",
    usernameField: "wpName",
    password: "A21Ap2O3c4",
    passwordField: "wpPassword"
  });

/*
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
  */
  if(ss.storage.PWCPaths)
    delete ss.storage.PWCPaths;
  else
    ss.storage.PWCPaths = new Hashtable();
  
  /*
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
  */
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

    savePWCPath(myRecorder.GetWebPage4PWChange(),myHashtable);
    myHashtable = null;  
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

        var temp = [credential.username,credential.url];

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
          console.log("lets navigate to change with url = " + urlAndName[0] + "and name = " + urlAndName[1]);
          AccountlistWorker.port.emit("NoChangeWay", urlAndName[0]);
        }
        else 
          // TODO HERE NEW HASHTABLE ONLY UNTIL CHANGE PW FORM 
        var hashtbl = getPWCPath(urlAndName[0]);
        if(typeof(hashtbl) !== 'undefined')
          navigateUserToChangePWManual(hashtbl,urlAndName[1], urlAndName[0]);
          //changeAutomaticPassword(getPWCPath(urlAndName[0]),urlAndName[1], urlAndName[0]);
      });

      //listening for Import Blaupause event
      AccountlistWorker.port.on("ImportBP", function(){
        console.log("importierung läuft");
        importNewBlaupause();
      });

      //listening for Export Blaupause event
      AccountlistWorker.port.on("ExportBP", function(url){
        var bp = getPWCPath(url);
        bp.setItem(bp.length,url);
        createNewBPFile(bp,url);
      });

      AccountlistWorker.port.on("OpenBlaupausen",openBlaupausen = function(){
        tabs.open({
          url: self.data.url("Blaupausen.html"),
          
          onReady: function onOpen(tab) {
            BlaupausenWorker = tab.attach({
              contentScriptFile: [self.data.url("jquery.min.js"),self.data.url("jquery-ui.min.js"),self.data.url("BlaupauseContentScript.js")]
            });

            // let build Accountlist dynamically
            BlaupausenWorker.port.emit("startBuildingBlaupausen", ss.storage.PWCPaths);

            // listening for deleteEntry event
            BlaupausenWorker.port.on("deleteThisEntry", function(url){
              console.log("deleting this entry from ss: " + url);
              deletePWCPath(url);
              tabs.activeTab.close();
              openBlaupausen();
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
  var imit = null;

  imit = new Imitator(hashtbl,username,url);

  console.log("changing password for username: " + username + " on url: " + url);


  imit.Init();
}

function navigateUserToChangePWManual(hashtbl, username, url){
  var imit = null;
  var hash4Navigation = new Hashtable();
  var i = 0;
  var j = 0;
  console.log("navigating user to change pw for username: " + username + " on url: " + url);
  for(var propertyName in hashtbl) {
   console.log("property = " + propertyName);
}

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

  console.log("data stored");


  ss.storage.PWCPaths.each(function(k, v) {
      console.log('key in pwcpath is: ' + k + ', value is: ' + v);
      v.each(function(k, v) {
        console.log('key in pwcpath in element is: ' + k + ', value is: ' + v);
      });
    });
}

//gets url as key4Obj 
// returns hashtable object with password-change-path
function getPWCPath(key4Obj){
  var PWCPaths;

  if(!ss.storage.PWCPaths){ // if storage is empty
    console.log("ss.storage.PWCPaths =  " + ss.storage.PWCPaths);
    return;
  }

  console.log("ein pfad für " + key4Obj + " gefunden");
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
  ss.storage = PWCPaths;

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

//returns text of file
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
function createNewBPFile(bp,url){
  var JsonBP = JSON.stringify(bp);
  var desktopPath = require('sdk/system').pathFor('Desk');
  var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);

  var split = url.split("//");
  var name = split[1];//.replace(".","_");
  var path = desktopPath+"/"+name + "_BP.txt";
  //

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

//imports new blaupause 
function importNewBlaupause(){
  var data;
  var newBP = new Hashtable();
  var keys;
  var storageKey = "";
  var parsedData;
  data = openFile();

  // TODO PARSE WITH JSON USW wenn export läuft
  parsedData = JSON.parse(data);
  keys = Object.keys(parsedData.items);
        
  console.log(parsedData.length);

  for(var i = 0; i < parsedData.length;i++){
    console.log("set (" + keys[i] + ", " + parsedData.items[i]+ ")");
    newBP.setItem(keys[i],parsedData.items[i]);
  }

  storageKey = newBP.getItem(newBP.length-1);
  newBP.removeItem(newBP.length-1);
  savePWCPath(storageKey,newBP);
  console.log(newBP);
  window.content.alert("Die Blaupause wurde importiert. Sie können sie sich unter 'Blaupausen anzeigen' anzeigen lassen.");
}



