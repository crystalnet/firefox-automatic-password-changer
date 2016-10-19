/*
This is a content script that the recorder attaches to a webpage at recording a new blueprint.
if contextmenu is used an inputfield will be marked yellow as visual feedback for user
*/
self.port.on("ContextMenuClick", function(message){
	var formID = message[1];
	var formName = message[5];
	var formWebsite = message[2];
	var formAction = message[6];
	var ElemName = message[4];
	var ElemID = message[3];

	var formsCollection;
	var myForm;
	for(var i = 0; i < message.length;i++){
		console.log("Data received message[" + i + "] = " + message[i]);	
	}

	var inputs = document.getElementsByTagName('input');

	console.log("suche nach feld mit id = " + message[3]);
	if(message[3] != ""){
		var inputField = document.getElementById(message[3]);
	}
	else if(message[5].tagName == "a"){
		alert("logout wird beachtet");
	}
	else {
		var inputs = document.getElementsByName(message[4]);
		if(inputs.length > 1){
			for(var i = 0; i< inputs.length;i++){
				inputs[i].style.backgroundColor = "yellow";
			}
		}
		else{
			inputs[0].style.backgroundColor = "yellow";
		}
	}

	if(typeof(inputField) === "undefined"){

	}
	else 
		inputField.style.backgroundColor = "yellow";
});