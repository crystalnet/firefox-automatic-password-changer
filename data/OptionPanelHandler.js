var active = true;
var recording = false;
var htmlElements = [];

// listen to startBuilding event after show event
self.port.on("startBuilding", buildPanelHTML);
//self.port.on("hide",deletePanelContent);

// build panel dynamically
function buildPanelHTML(){
	createOptionButton("record-button","Aufzeichnen","icon-16.png",startRecord_endRecord);
	createOptionButton("accountlist","Accountliste","icon-16.png",openAccounts);
	createSeparator("myHr");
	createOptionButton("on-off-button","Deaktivieren","icon-16.png",activate_deaktivate);
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
	alert("Hey you clicked on Accountlist!!");
}

// function for activate-deactivate button in menu panel
function activate_deaktivate(){
	alert("Hey you clicked on Deactivate!!");
}

// function for start-endRecording
function startRecord_endRecord(){
	self.port.emit("go");
}
