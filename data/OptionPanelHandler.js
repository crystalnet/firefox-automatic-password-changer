var active = true;
var recording = false;
var htmlElements = [];

// listen to startBuilding event after show event
self.port.on("startBuilding", buildPanelHTML);
//self.port.on("hide",deletePanelContent);

self.port.on("switchRecordbuttonLabel", switchRecordButtonstate);
// build panel dynamically
function buildPanelHTML(){
	createOptionButton("record-button","Aufzeichnen","icon-16.png",startRecord_endRecord);
	createSeparator("myHr");
	createOptionButton("accountlist","Accountliste","icon-16.png",openAccounts);
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

// function for activate-deactivate button in menu panel
function activate_deaktivate(){
	alert("Hey you clicked on Deactivate!!");
	
	self.port.emit("changePW");
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
	img.setAttribute("src",recordbtn.getElementsByTagName("IMG")[0].src);
	img.setAttribute("class","icon");

	if(recordbtn.innerHTML.indexOf('Aufzeichnen') > -1){
		recordbtn.innerHTML = "Aufz. beenden";
		recordbtn.appendChild(img);
	}
	else{
		recordbtn.innerHTML = "Aufzeichnen";
		recordbtn.appendChild(img);	
	}
}
