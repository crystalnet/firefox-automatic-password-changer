/*
This is the content script for option panel of the addon
*/
var active = true;
var recording = false;
var htmlElements = [];
var languageStrings = "";
self.port.on("languageStrings", function handleMyMessage(myMessagePayload) {
	languageStrings = myMessagePayload;
});

// listen to startBuilding event after show event
self.port.on("startBuilding", buildPanelHTML);
//self.port.on("hide",deletePanelContent);

self.port.on("switchRecordbuttonLabel", switchRecordButtonstate);

// build panel dynamically
function buildPanelHTML(){
	createOptionButton("record-button", languageStrings["record"], "images/record-v1_16.png", startRecord_endRecord);
	createOptionButton("record-button", languageStrings["record"], "images/record-v1_16.png", startRecord_endRecord);
	createSeparator("myHr");
	createOptionButton("accountlist", languageStrings["accountlist"], "images/list-v1_16.png", openAccounts);
	//createOptionButton("on-off-button","Deaktivieren","icon-16.png",activate_deaktivate);
}

// creates a separator in panel menu
// parameter:
// id = id for separator
function createSeparator(id){

	if(document.getElementById(id) == null){

		var hr = document.createElement("hr");

		hr.setAttribute("id",id);
		document.body.appendChild(hr);
	}
}

// creates buttons in panel menu
// Parameter:
// id = ID of the new element
// text = innerHTML text of element
// iconSrc = path to icon for element
// newFunction = function to be appended to new element on click
function createOptionButton(id,text,iconSrc,newFunction){
	if (iconSrc === undefined) {
        iconSrc = "icon-16.png";
    }
    if(document.getElementById(id) == null){
	    var div = document.createElement("DIV");
	    var img = document.createElement("IMG");

	    div.setAttribute("id", id);
		div.setAttribute("class", "menu-item");

		img.setAttribute("src",iconSrc);
		img.setAttribute("class","icon");


		div.innerHTML = text;
		div.appendChild(img);

		div.addEventListener("click", newFunction, false);
		document.body.appendChild(div);
	}
}

//function for clicking on menu option Accountlist
function openAccounts(){
	self.port.emit("openAccountList");
}

// function for start-endRecording
function startRecord_endRecord(evt){

	var btn = document.getElementById(evt.target.id);
	switchRecordButtonstate();
	self.port.emit("stopgorecord");
}

//changes label for record button
function switchRecordButtonstate(){
	var recordbtn = document.getElementById("record-button");
	var img = document.createElement("IMG");
	var iconSrc = recordbtn.getElementsByTagName("IMG");
	//img.setAttribute("src",recordbtn.getElementsByTagName("IMG")[0].src);
	img.setAttribute("class","icon");

	if (recordbtn.innerHTML.indexOf(languageStrings["record"]) > -1) {
		recordbtn.innerHTML = languageStrings["stop_recording"];
		img.setAttribute("src","images/stop.png");
		recordbtn.appendChild(img);
	}
	else{
		recordbtn.innerHTML = languageStrings["record"];
		img.setAttribute("src","images/record-v1_16.png");
		recordbtn.appendChild(img);
	}
}
