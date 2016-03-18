self.port.on("ContextMenuClick", function(message){
	for(var i = 0; i < message.length;i++){
		console.log("Data received data[" + i + "] = " + message[i]);	
	}
	
	console.log("suche nach feld mit id = " + message[3]);
	if(message[3] != ""){
		var inputField = document.getElementById(message[3]);
	}
	else if(message[5].tagName == "a"){
		alert("logout wird beachtet");
	}
	else 
		var inputField = document.getElementsByName(message[4])[0];

	if(typeof(inputField) === "undefined"){

	}
	else 
		inputField.style.backgroundColor = "yellow";
});