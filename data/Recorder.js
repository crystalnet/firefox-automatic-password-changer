var URL = require('sdk/url').URL;
var tabs = require('sdk/tabs');

var { Ci } = require('chrome');
var { viewFor } = require("sdk/view/core");
var window = viewFor(require("sdk/windows").browserWindows[0]);
var oldURL;
var url;
var mainWindow;
var IsActive = false;

module.exports = function Recorder(){

  // start logging and add listener 
  this.StartRecording = function(){

    IsActive = true;
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

    window.addEventListener('input', logInput=function (e) {
      console.log("keyup event detected! coming from this element:", e.target.id);


      // read inputs and ids of input elements
      var doc = window.content.document;
      if(doc != null){
        var data = doc.getElementById(e.target.id)
        console.log(data.value);
        }
    }, false);

    window.addEventListener('submit', logSubmitForm=function (e) {
      console.log("keyup event detected! coming from this element:", e.target.id);
    }, false);

    window.addEventListener('click', submitClick=function (e) {
      if(e.target.type == "submit")
      {
        console.log("clicked submit! coming from this element:", e.target.id);
      }

    }, false);
  }

  // stop logging actions and remove all listener
  this.StopRecording = function(){
    IsActive = false;
    mainWindow.getBrowser().removeEventListener("DOMContentLoaded",GetActiveURL, false);
    window.removeEventListener('input',logInput,false);
    window.removeEventListener('submit',logSubmitForm,false);
    window.removeEventListener('click',submitClick,false);
  }

  //public read only
  // true = recording
  // false = inactive
  this.RecorderIsActive = function(){
     return IsActive;
  }

	function GetActiveURL(){
  		var newURL = tabs.activeTab.url;

  		if(oldURL != newURL){
    		console.log('active: ' + tabs.activeTab.url);
    		oldURL = tabs.activeTab.url;
  		}
	}
}