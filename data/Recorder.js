var URL = require('sdk/url').URL;
var tabs = require('sdk/tabs');

var { Ci } = require('chrome');
var { viewFor } = require("sdk/view/core");
var window = viewFor(require("sdk/windows").browserWindows[0]);
var Hashtable = require('../lib/Hashtable');

// variables
var orderNumber = 0;
var oldURL;
var url;
var mainWindow;
var IsActive = false;
var userWebPath;


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

    window.addEventListener('input', logInput=function (e) {
      // read inputs and ids of input elements
      var doc = window.content.document;
      if(doc != null){

        var id = "";

        if(e.target.id == ""){
          id = e.target.name;
          var data = doc.getElementsByName(id)[0];
        }
        else{
          id = e.target.id;
          var data = doc.getElementById(id);
        }

        console.log(data.value);

        userWebPath.setItem(orderNumber,[id,tabs.activeTab.url,data.value,data.type,"Input"]);
        console.log(userWebPath.length);
        orderNumber++;
        }
    }, false);

    window.addEventListener('click', submitClick=function (e) {
      
      console.log(e.target.id);
      if(e.target.type == "submit"){
        var id = "";
        console.log("clicked submit! coming from this element:", e.target.id);
        if(e.target.id == ""){
          id = e.target.name;
        }
        else{
          id = e.target.id;
        }

        userWebPath.setItem(orderNumber,[id,tabs.activeTab.url,"Submit"]);
        console.log(userWebPath.length);
        orderNumber++;
      }
      else{
        console.log("clicked at this coordinates: X:" + e.pageX + "Y: " + e.pageY);
        userWebPath.setItem(orderNumber,[tabs.activeTab.url,e.pageX,e.pageY,"Click"])
      }

    }, false);
  }

  // stop logging actions and remove all listener
  this.StopRecording = function(){
    IsActive = false;
    orderNumber = 0;

    mainWindow.getBrowser().removeEventListener("DOMContentLoaded",GetActiveURL, false);
    window.removeEventListener('input',logInput,false);
    //window.removeEventListener('submit',logSubmitForm,false);
    window.removeEventListener('click',submitClick,false);

    userWebPath = CleanUpHashtable(userWebPath);

    userWebPath.each(function(k, v) {
      console.log('key is: ' + k + ', value is: ' + v);
    });

    return userWebPath;
  }

  //public read only
  // true = recording
  // false = inactive
  this.RecorderIsActive = function(){
     return IsActive;
  }


  // Cleans up the hashtable
  // removes duplicates: if user types in a textbox every char is a new entry. But least only last value is needed
  // removes no needed websites: if user searches in google we need only the page of interest
  function CleanUpHashtable(hash){
    var result = new Hashtable();
    var i = 0;
    var oldVal = 'undefined';
    hash.each(function(k, v) {
      if(v[0] != oldVal){
        oldVal = v[0];
        result.setItem(i,v);
        i++;
      }
      else{
        result.setItem(i-1,v);
      }
    });
    return result;
  }


	function GetActiveURL(){
  		var newURL = tabs.activeTab.url;

  		if(oldURL != newURL){
    		console.log('active: ' + tabs.activeTab.url);
    		oldURL = tabs.activeTab.url;
        userWebPath.setItem(orderNumber,[tabs.activeTab.url,"SiteChange"]);
        orderNumber++;
  		}
	}
}