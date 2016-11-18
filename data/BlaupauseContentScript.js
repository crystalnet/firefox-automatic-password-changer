/*
This is the content script for the blueprint menu
*/
self.port.on("startBuildingBlueprints", function(BPs){
	if(BPs != null)
		buildBlueprints(BPs);
});

self.port.on("closing", function(){
	Clear();
});

// builds dynamically a list of blueprint which are known to the addon
//BPs: hashtable from simple-stotage of blaupauses
function buildBlueprints(BPs){

	console.log("start building blaupausen");
	console.log(BPs.length);
	var BPKeys = Object.keys(BPs.items);
	for(var i = 0; i < BPKeys.length;i++){
		var url = BPKeys[i];
		console.log("url = " + url);
		addBPSection(url);
	}
	$(function() {
        $( "#accordion" ).accordion();
    });

}

//adds a section for a blueprint to blueprint menu
function addBPSection(url){

    	var accord = document.getElementById('accordion');

    	if(accord != null){
    		var h3 = document.createElement("H3");
    		var div = document.createElement("DIV");

    		var deleteBtn = document.createElement("BUTTON");

    		// adding labels to elements
    		h3.innerHTML = "Seite: " + url;

    		div.setAttribute("id", "ID"+url);

    		deleteBtn.innerHTML = "Eintrag löschen";

    		//adding onClick functions
    		deleteBtn.addEventListener('click',function(){deleteThisEntry(url,name);});


    		div.appendChild(deleteBtn);

    		accord.appendChild(h3);
    		accord.appendChild(div);
    	}
}

// triggerfunction for deleting entry from persistent storage and passwordmanager
// url: url for website of blueprint
// username: username for account for website of blueprint
function deleteThisEntry(url, username){
    window.alert("Diese Blaupause wird aus dem Speicher von Firefox gelöscht");
	console.log("deleting entry blueprint: " + url);
	self.port.emit("deleteThisEntry", url);
}

//destroy all objects and Listener if needed
function Clear(){

}