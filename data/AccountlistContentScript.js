/*
This is the content script for the Accountlist.html
*/
self.port.on("startBuildingAccountlist", function(pwHash){
	buildAccountlist(pwHash);
});

self.port.on("NoChangeWay", function(url){
    var box=window.confirm("Der PasswortChanger weiß nicht, wie das für diese Seite funktioniert. Wollen Sie es ihm zeigen?");
        if(box==true){
            startRecording(url);
        }
        else if(box==false){
        }
});

self.port.on("closing", function(){
	Clear();
});

/*
this function builds dynamically the accountlist
pwHash: hashtable with login-entries from password manager
*/
function buildAccountlist(pwHash){

	console.log("start building acclist");
	for(var i = 0; i < pwHash.length;i++){
		var name = pwHash.items[i][0];
		var url = pwHash.items[i][1];
		console.log("name: " + name + ", url = " + url);
		addAccountSection(name, url);
	}
	$(function() {
        $( "#accordion" ).accordion();
    });

    // these 2 buttons are fix but they need eventlistener
    var bpButton = document.getElementById("btn_show_blueprints");
    bpButton.addEventListener('click',function(){openBlueprints();});
    var bpImport = document.getElementById("btn_import_blueprints");
    bpImport.addEventListener('click',function(){importBlueprint();});

}

//adds a section for an account to accountlist
// name: username for a login entry
// url : url for a login entry
function addAccountSection(name, url){

    	var accord = document.getElementById('accordion');

    	if(accord != null){
    		var h3 = document.createElement("H3");
    		var div = document.createElement("DIV");
    		var p1 = document.createElement("P");
    		var p2 = document.createElement("P");
    		var deleteBtn = document.createElement("BUTTON");
    		var changeBtn = document.createElement("BUTTON");
    		var createPathBtn = document.createElement("BUTTON");
            var exportBtn = document.createElement("BUTTON");

    		// adding labels to elements
    		h3.innerHTML = "Seite: " + url + " || User: " + name;

    		div.setAttribute("id", "ID"+url);

    		p1.innerHTML = "Benutzername: " + name;
    		//p2.innerHTML = "Passwort: " + password;
    		p2.innerHTML = "url: " + url;

    		deleteBtn.innerHTML = "Eintrag löschen";
    		changeBtn.innerHTML = "Passwort jetzt automatisch ändern";
    		createPathBtn.innerHTML = "Passwort jetzt manuell ändern";
            exportBtn.innerHTML = "Blaupause exportieren";

    		//adding onClick functions
    		deleteBtn.addEventListener('click',function(){deleteThisEntry(url,name);});
    		changeBtn.addEventListener('click',function(){changeThisPasswordAut(url,name);});
    		createPathBtn.addEventListener('click',function(){navigateToChangePW(url,name);});
            exportBtn.addEventListener('click',function(){exportBlueprint(url);});


    		div.appendChild(p1);
    		div.appendChild(p2);
    		div.appendChild(deleteBtn);
    		div.appendChild(changeBtn);
    		div.appendChild(createPathBtn);
            div.appendChild(exportBtn);

    		accord.appendChild(h3);
    		accord.appendChild(div);
    	}
}

// triggerfunction for deleting entry from persistent storage and passwordmanager
// username: username for a login entry
// url : url for a login entry
function deleteThisEntry(url, username){
    window.alert("Dieser Eintrag wird sowohl aus dieser Liste, als auch aus dem Passwortmanager von Firefox entfernt.");
	console.log("deleting entry : " + url + " " + username);
	self.port.emit("deleteThisEntry", [url,username]);
}

// triggerfunction for automatic change password
// username: username for a login entry
// url : url for a login entry
function changeThisPasswordAut(url, username){
    window.alert("Das Passwort wird, wenn die Blaupause vorhanden ist, automatisch geändert. Dies geschieht live im offenen Fenster, sodass Sie das live mitverfolgen können. Aufgrund eines Bugs im der Firefox API kann dies nicht im Hintergrund geschehen, bitte haben Sie Verständnis.");
	console.log("changing password for username: " + username + " on website: " + url);
	self.port.emit("changePW",[url,username]);
}

// triggerfunction for recording new blueprint
// url : url for a login entry
function startRecording(url){
	console.log("lets record for url: "+ url);
	self.port.emit("startRecord",url);
}

// triggerfunction for navigating user to the page in account where the changing form is located.
// username: username for a login entry
// url : url for a login entry
function navigateToChangePW(url, username){
    console.log("navigating to password change form");
    window.alert("Sie werden nun automatisch zum Formular navigiert, mit dem Sie anschließend Ihr Passwort selbst ändern können.");
    self.port.emit("Nav2ChangeForm", [url,username]);
}

// triggerfunction for export of blueprint
// url : url for a login entry
function exportBlueprint(url){
    console.log("Blaupause für " + url + " wird exportiert");
    self.port.emit("ExportBP",url);
}

// triggerfunction for opening of blueprint
function openBlueprints(){
    console.log("openBlueprints");
    self.port.emit("OpenBlueprints");
}

// triggerfunction for import of blueprint
function importBlueprint(){
    console.log("importnutton clicked");
    self.port.emit("ImportBP");
}

//destroy all objects and Listener if needed
function Clear(){

}
