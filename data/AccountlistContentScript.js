
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

function buildAccountlist(pwHash){

	console.log("start building acclist");
	console.log(pwHash.length);
	for(var i = 0; i < pwHash.length;i++){
		var name = pwHash.items[i][0];
		var url = pwHash.items[i][1];
		console.log("name: " + name + ", url = " + url);
		addAccountSection(name, url);
	}
	$(function() {
        $( "#accordion" ).accordion();
    });

    var bpButton = document.getElementById("Blaupausen-button");
    bpButton.addEventListener('click',function(){openBlaupausen();});
    var bpImport = document.getElementById("Blaupausen-import");
    bpImport.addEventListener('click',function(){importBlaupause();});
	
}

//adds a section for an account to accountlist
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
            exportBtn.addEventListener('click',function(){exportBlaupause(url);});


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
function deleteThisEntry(url, username){
    window.alert("Dieser Eintrag wird sowohl aus dieser Liste, als auch aus dem Passwortmanager von Firefox entfernt.");
	console.log("deleting entry : " + url + " " + username);
	self.port.emit("deleteThisEntry", [url,username]);
}

// triggerfunction for automatic change password
function changeThisPasswordAut(url, username){
    window.alert("Das Passwort wird, wenn die Blaupause vorhanden ist das Passwort automatisch ändern. Dies geschieht live im offenen Fenster, sodass Sie das live mitverfolgen lönnen. Aufgrund eines Bugs im der Firefox API kann dies nicht im Hintergrund geschehen, bitte haben Sie Verständnis.");
	console.log("changing password for username: " + username + " on website: " + url);
	self.port.emit("changePW",[url,username]);
}

// triggerfunction for recording new passwordchangepath
function startRecording(url){
	console.log("lets record for url: "+ url);
	self.port.emit("startRecord",url);
}

// triggerfunction for navigating user to the page in account where the changing form is located.
function navigateToChangePW(url, username){
    console.log("navigating to password change form");
    window.alert("Sie werden nun automatisch zum Formular navigiert, mit dem Sie anschließend Ihr Passwort selbst ändern können.");
    self.port.emit("Nav2ChangeForm", [url,username]);
}

function exportBlaupause(url){
    console.log("Blaupause für " + url + " wird exportiert");
    self.port.emit("ExportBP",url);
}

function openBlaupausen(){
    console.log("openBlaupausen");
    self.port.emit("OpenBlaupausen");
}

function importBlaupause(){
    console.log("importnutton clicked");
    self.port.emit("ImportBP");
}

//destroy all objects and Listener if needed
function Clear(){

}

