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
	console.log("here is the submitLoginDataPort");
	//submitElementID = message;
	var formID = data[0];
	var formName = data[1];
	var formWebsite = data[2];
	var formAction = data[3];
	var formPWFieldName = data[4];
	var formPWFieldID = data[5];
	var formUsernameFieldName = data[6];
	var formUsernameFieldID = data[7];
	var password = data[8];
	var username = data[9];
	var formsCollection;
	var myForm;

	for(var i = 0; i < data.length; i++){
		console.log("data[" + i + "] = " + data[i] + " received");
	}

	//#1 search for the right form
	if(formID != ""){
		myForm = document.getElementById(formID);
	}
	else if(formName != ""){
		myForm = document.getElementsByName(formName)[0];
	}
	else{

		formsCollection = document.getElementsByTagName("form");
		

		console.log("beginnen mit eintragen von daten in formular");
		for(var i=0;i<formsCollection.length;i++){
	   		var actualForm = formsCollection[i];
	   		if(((actualForm.id == formID) || (actualForm.name == formName)) && (actualForm.action == formAction)){
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
	

	console.log("formular gefunden und jetzt wird password eingetragen");
	sleep(2000);
	//#3 put the password in the right textbox
	if(formPWFieldName != ""){
		var pwField = document.getElementsByName(formPWFieldName);
		pwField[0].value = password;
	}

	myForm.submit();
});

self.port.on("submitOnlyData", function(data){
	var formID = data[0];
	var formWebsite = data[1];
	var formAction = data[2];

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

	sleep(2000);
	myForm.submit();

});

self.port.on("submitPWChangeData", function(data){
	//TODO IMPLEMENT
	var formID = data[0];
	var formName = data[1];
	var formWebsite = data[2];
	var formAction = data[3];
	var numOfPWFields = data[4];
	var PWInfo = data[5];
	var password = data[6];
	var newPassword = data[7];
	var formsCollection;
	var myForm;

	for(var i = 0; i < data.length; i++){
		console.log("data[" + i + "] = " + data[i] + " received");
	}


	//#1 search for the right form
	if(formID != ""){
		myForm = document.getElementById(formID);
	}
	else if(formName != ""){
		myForm = document.getElementsByName(formName)[0];
	}
	else{

		formsCollection = document.getElementsByTagName("form");
		

		console.log("beginnen mit eintragen von daten in formular");
		for(var i=0;i<formsCollection.length;i++){
	   		var actualForm = formsCollection[i];
	   		if(countAllChildrenOfType(formsCollection[i],"password") == numOfPWFields){ 
	   			myForm = formsCollection[i];
	   			break;
	   		}
		}
	}
	

	//#2 Fillout pw fields
	fillOutPWFieldsIn(myForm,password,newPassword,numOfPWFields,PWInfo);
	console.log("das korrekte Formular wird submitted");

	sleep(2000);
	myForm.submit();

	self.port.emit("successSubmit");
});

self.port.on("LogoutData", function(data){
	formID, formName, formAction, mustWebsiteURL, hrefLink
	var formID = data[0];
	var formName = data[1];
	var formAction = data[2];
	var mustWebsiteURL = data[3];
	var hrefLink = data[4];
	var element = data[5];
	var myForm;

	if(formAction != ""){
		if(formID != ""){
			myForm = document.getElementById(formID);
		}
		else{
			myForm = document.getElementsByName(formName);
		}

		myForm.submit();
	}
	else if(href != ""){
		window.location.href = href;
	}
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
function fillOutPWFieldsIn(node,password, newpassword,numOfPWFields,PWInfo){
	var allElements = node.getElementsByTagName('input');
	var found = 0;
	var pwCount = numOfPWFields;
	//for(var i = 0; i < allElements.length;i++){
	//	if(allElements[i].type == "password"){
	//		pwCount++;
	//	}
	//}


	// if there is only one passwordfield to type
	if(numOfPWFields == 1){
		console.log("Nur das neue password wird eingetippt");
		for(var i = 0; i < allElements.length;i++){
			if(allElements[i].type == "password"){
				allElements[i].value = newpassword;
			}
		}
	}

	//if there are 2 passwordfields to type we have 2 possibilities
	if(numOfPWFields == 2){
		// type 2 times new password
		if((PWInfo[0] == "N") && (PWInfo[1] == "N")){
			console.log("Es wird 2 mal das neue pw eingetippt");
			for(var i = 0; i < allElements.length;i++){
				if(allElements[i].type == "password"){
					allElements[i].value = newpassword;
				}
			}
		}
		//else first type old password then the new one
		else{
			console.log("Es wird erst altes pw dann neues eingetippt");
			for(var i = 0; i < allElements.length;i++){
				if((allElements[i].type == "password") && (pwCount == 2)){
					allElements[i].value = password;
					pwCount--;
				}
				else if((allElements[i].type == "password") && (pwCount == 1)){
					allElements[i].value = newpassword;
				}
			}
		}
	}

	// if there are 3 passwordfields type first old password the two times the new one
	if(numOfPWFields == 3){
		console.log("Es wird erst altes dann 2  mal das neue pw eingetippt");
		for(var i = 0; i < allElements.length;i++){
			if((allElements[i].type == "password") && (pwCount == 3)){
				console.log("erst altes pw eintippen");
				allElements[i].value = password;
				pwCount--;
			}
			else if(allElements[i].type == "password"){
				console.log("neues pw eintippen");
				allElements[i].value = newpassword;
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

