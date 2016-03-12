//### script for interaction with a website -> filling forms
var elementID;
var inputValue;
var xCoord;
var yXoord;
var submitElementID;


// Listener for xClick message
self.port.on("xClick", function(message){
	xCoord = message;

	if((xCoord != null) && (yCoord != null)){
		document.elementFromPoint(xCoord,yCoord).click()
	}
	self.port.emit("wr");
});

// Listener for yClick message
self.port.on("yClick", function(message){
	yCoord = message;
	
	if((xCoord != null) && (yCoord != null)){
		document.elementFromPoint(xCoord,yCoord).click()
	}
	self.port.emit("wr");
});

// Listener for submitElementID message
self.port.on("submitLoginData", function(data){
	//submitElementID = message;
	var formID = data[0];
	var formWebsite = data[1];
	var formAction = data[2];
	var formPWFieldName = data[3];
	var formUsernameFieldName = data[4];
	var password = data[5];
	var username = data[6];
	var formsCollection;
	var myForm;

	for(var i = 0; i < data.length; i++){
		console.log("data[" + i + "] = " + data[i] + " received");
	}

	//#1 search for the right form
	if(formID != ""){
		myForm = document.getElementById(formID);
	}
	else{

		formsCollection = document.getElementsByTagName("form");
		

		console.log("beginnen mit eintragen von daten in formular");
		for(var i=0;i<formsCollection.length;i++){
	   		var actualForm = formsCollection[i];
	   		if((actualForm.id == formID) && (actualForm.action == formAction)){
	   			myForm = actualForm;
	   			break;
	   		}
		}
	}

	console.log("formular gefunden und jetzt wird name eingetragen");
	sleep(2000);

	//#2 put the username in the right textbox
	if(formUsernameFieldName != ""){
		console.log("suche nach " + formUsernameFieldName);
		var usernameField = document.getElementsByName(formUsernameFieldName)[0];
		usernameField.value = username;
	}
	else{
		var elem = document.getElementsByTagName('input');
        for(var i = 0; i < elem.length; i++)
        {
        	if(elem[i].type != "password"){
        		elem[i].value = username;
        		break;
        	}
        } 
	}

	console.log("formular gefunden und jetzt wird password eingetragen");
	sleep(2000);
	//#3 put the password in the right textbox
	if(formPWFieldName != ""){
		var pwField = document.getElementsByName(formPWFieldName);
		pwField[0].value = password;
	}
	else{
		var elem = document.getElementsByTagName('input');
        for(var i = 0; i < elem.length; i++)
        {
        	if(elem[i].type == "password"){
        		elem[i].value = password;
        		break;
        	}
        } 
	}

	myForm.submit();
});

self.port.on("submitPWChangeData", function(data){
	//TODO IMPLEMENT
	var formID = data[0];
	var formWebsite = data[1];
	var formAction = data[2];
	var password = data[3];
	var newPassword = data[4];
	var formsCollection;
	var myForm;
	var numberOfPWFields = 0;

	for(var i = 0; i < data.length; i++){
		console.log("data[" + i + "] = " + data[i] + " received");
	}


	//#1 search for the right form
	if(formID != ""){
		myForm = document.getElementById(formID);
	}
	else{

		formsCollection = document.getElementsByTagName("form");
		

		console.log("beginnen mit eintragen von daten in formular");
		for(var i=0;i<formsCollection.length;i++){
	   		var actualForm = formsCollection[i];
	   		if((actualForm.id == formID) && (actualForm.action == formAction)){
	   			myForm = actualForm;
	   			break;
	   		}
		}
	}

	//#2 Fillout pw fields
	fillOutPWFieldsIn(myForm,password,newPassword);
	console.log("das korrekte Formular ist gefunden");

	sleep(2000);
	myForm.submit();

	self.port.emit("successSubmit");
});

// Listener for elementID message
self.port.on("elementID", function(message) {
	elementID = message;

	if((elementID != null) && (inputValue != null)){
		if(document.getElementById(elementID) != null){
			var data = document.getElementById(elementID);
		}
        else if (document.getElementsByName(elementID)[0] != null){
        	var data = document.getElementsByName(elementID)[0];
        }
		else {
			console.log("could not enter text to input element ", elementID);
			return;
		}

		data.value = inputValue;
		console.log("typed to  ", elementID);
		console.log("the value  ", inputValue);
		console.log("the value is ", data.value);
		inputValue = null;
		elementID = null;
		self.port.emit("wr");
	}
});

// Listener for inputValue message
self.port.on("inputValue", function(message) {
	inputValue = message;

	if((elementID != null) && (inputValue != null)){
		if(document.getElementById(elementID) != null){
			var data = document.getElementById(elementID);
		}
        else if (document.getElementsByName(elementID)[0] != null){
        	var data = document.getElementsByName(elementID)[0];
        }
		else {
			console.log("could not enter text to input element ", elementID);
			return;
		}

		data.value = inputValue;
		console.log("typed to  ", elementID);
		console.log("the value  ", inputValue);
		console.log("the value is ", data.value);
		inputValue = null;
		elementID = null;
		self.port.emit("wr");
	}
});

// this function searches recursively elements with certain type in nodes and childnodes 
// node = html elemnt as start element
// type = type of element that will counted
// returns number of elements of type in childelements of node
/*
function countAllChildrenOfType(node,type){
    var result = 0;
    if (node.hasChildNodes()) {
        for (var i = 0; i < node.childNodes.length; i++) {
          	var newNode = node.childNodes[i];
          	result += countAllChildrenOfType(newNode,type);  
        }
    }
    else if(node.type == type){
      	return result +1;
    }
    return result;
  }
*/
function fillOutPWFieldsIn(node,password, newpassword){
	var allElements = document.getElementsByTagName('*');
	var found = 0;
	for(var i = 0; i < allElements.length;i++){
		if(allElements[i].type == "password"){
			console.log("PASSWORDFELD GEFUNDEN");
			if(found == 0){
				console.log("aktuelles password");
				allElements[i].value = password;
				found++;
			}
			else{ 
				console.log("neues password");
				allElements[i].value = newpassword;
				found++;
			}
		}
	}
  }
  
// this function waits for milliseconds as parameter
function sleep(milliseconds) {
  		var start = new Date().getTime();
  		for (var i = 0; i < 1e7; i++) {
    		if ((new Date().getTime() - start) > milliseconds){
      			break;
    		}
  		}
	}

