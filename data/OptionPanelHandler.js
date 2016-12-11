/*
This is the content script for option panel of the addon
*/
var active = true;
var recording = false;
var htmlElements = [];

// listen to startBuilding event after show event
self.port.on("startBuilding", buildPanelHTML);
//self.port.on("hide",deletePanelContent);

self.port.on("switchRecordbuttonLabel", switchRecordButtonstate);

// build panel dynamically
function buildPanelHTML(){
	//TODO define a languageString
	createOptionButton("record-button","Aufzeichnen","images/record-v1_16.png",startRecord_endRecord);
	createSeparator("myHr");
	//TODO define a languageString
	createOptionButton("accountlist","Accountliste","images/list-v1_16.png",openAccounts);
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

	//TODO define a languageString
	if(recordbtn.innerHTML.indexOf('Aufzeichnen') > -1){
		recordbtn.innerHTML = "Aufz. beenden";
		img.setAttribute("src","images/stop.png");
		recordbtn.appendChild(img);
	}
	else{
		//TODO define a languageString
		recordbtn.innerHTML = "Aufzeichnen";
		img.setAttribute("src","images/record-v1_16.png");
		recordbtn.appendChild(img);
	}
}
