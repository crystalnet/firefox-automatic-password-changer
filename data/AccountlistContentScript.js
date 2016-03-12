
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
		var pw = pwHash.items[i][1];
		var url = pwHash.items[i][2];
		console.log("name: " + name + " , pw = " + pw + ", url = " + url);
		addAccountSection(name, pw, url);
	}
	$(function() {
        $( "#accordion" ).accordion();
    });
	
}

//adds a section for an account to accountlist
function addAccountSection(name, password, url){
	
    	var accord = document.getElementById('accordion');

    	if(accord != null){
    		var h3 = document.createElement("H3");
    		var div = document.createElement("DIV");
    		var p1 = document.createElement("P");
    		var p2 = document.createElement("P");
    		var p3 = document.createElement("P");
    		var deleteBtn = document.createElement("BUTTON");
    		var changeBtn = document.createElement("BUTTON");
    		var createPathBtn = document.createElement("BUTTON");

    		// adding labels to elements
    		h3.innerHTML = "Seite: " + url + " || User: " + name;

    		div.setAttribute("id", "ID"+url);

    		p1.innerHTML = "Name: " + name;
    		p2.innerHTML = "Passwort: " + password;
    		p3.innerHTML = "url: " + url;

    		deleteBtn.innerHTML = "Eintrag löschen";
    		changeBtn.innerHTML = "Passwort jetzt automatisch ändern";
    		createPathBtn.innerHTML = "Passwort jetzt manuell ändern";

    		//adding onClick functions
    		deleteBtn.addEventListener('click',function(){deleteThisEntry(url,name);});
    		changeBtn.addEventListener('click',function(){changeThisPasswordAut(url,name);}); 
    		createPathBtn.addEventListener('click',function(){navigateToChangePW(url,name);});


    		div.appendChild(p1);
    		div.appendChild(p2);
    		div.appendChild(p3);
    		div.appendChild(deleteBtn);
    		div.appendChild(changeBtn);
    		div.appendChild(createPathBtn);

    		accord.appendChild(h3);
    		accord.appendChild(div);
    	}
}

// triggerfunction for deleting entry from persistent storage and passwordmanager
function deleteThisEntry(url, username){
	console.log("deleting entry : " + url + " " + username);
	self.port.emit("deleteThisEntry", [url,username]);
}

// triggerfunction for automatic change password
function changeThisPasswordAut(url, username){
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

    self.port.emit("Nav2ChangeForm", [url,username]);
}

//destroy all objects and Listener if needed
function Clear(){

}

