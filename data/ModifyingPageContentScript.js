//### script for interaction with a website -> filling forms
/*
This is the content script for interaction with webpages
it performs every input and submit that ist needed for password change on extern webpages
*/
var elementID;
var inputValue;
var submitElementID;


// Listener for xClick message
// message: [x coordinate, y coordinate, viewport position]
self.port.on("xyCoords", ClickAt=function(message){
	xCoord = message[0];
	yCoord = message[1];
	mustScrollTop = message[2];
	console.log("xyClick received = " + xCoord + " " + yCoord);
	console.log("mustScrollTop " + mustScrollTop);
	console.log("Scroll top is " + document.documentElement.scrollTop);

	//scroll the viewport if necessary
	if(document.documentElement.scrollTop != mustScrollTop)
		document.documentElement.scrollTop = mustScrollTop;

	// perform click if coordinates are set
	if((xCoord != null) && (yCoord != null)){

		var element = document.elementFromPoint(xCoord,yCoord);
		if(element != null){
			console.log("element to be clicked" + element);
			if(element.hasAttribute("href")){
				console.log(element.href);
				eval(element.href);
				element.click();
				xCoord = null;
				yCoord = null;
			}
		}
	}
	// a kind of callback for imitatorobject
	self.port.emit("clickReady");
});

// Listener for submitElementID message
// data : [form id, form name, website of form , action of form , name of password field, id of password field, name of username field, id of username field,
//			actual password, username]
self.port.on("submitLoginData", submitLoginData = function(data){
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
		
		for(var i=0;i<formsCollection.length;i++){
            //TOCHECK: at this point, formId and formName are always ""
	   		var actualForm = formsCollection[i];
	   		if(((actualForm.id == formID) || (actualForm.name == formName)) && (actualForm.action == formAction)){
	   			myForm = actualForm;
	   			break;
	   		}
		}
	}
	//TOCHECK: sleep before form submit does not do anything unless client side js abuse detection is in place,
	// which is unlikely
	sleep(2000);

	//#2 put the username in the right textbox
	if(formUsernameFieldName != ""){
		console.log("suche nach " + formUsernameFieldName);
		var usernameField = document.getElementsByName(formUsernameFieldName)[0];
		usernameField.value = username;
	}
	
	sleep(2000);
	//#3 put the password in the right textbox
	if(formPWFieldName != ""){
		var pwField = document.getElementsByName(formPWFieldName);
		pwField[0].value = password;
	}

	myForm.submit();
	self.port.emit("ReadyLogin");
});

// listener for submit event when it is no login or password change form
// data : [id of form, website of form, action of form]
self.port.on("submitOnlyData", submitData=function(data){
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
		
		for(var i=0;i<formsCollection.length;i++){
	   		var actualForm = formsCollection[i];
	   		//TOCHECK: at this point, formId is always ""
	   		if((actualForm.id == formID) && (actualForm.action == formAction)){
	   			myForm = actualForm;
	   			break;
	   		}
		}
	}

	sleep(2000);
	myForm.submit();

});

// listener for submit a password change form event
// data: [id of form, name of form, website of form, action of form, number of passwordfields in form, string for identify passwords,
//	actual password, new password]
self.port.on("submitPWChangeData", function(data){
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

	sleep(2000);
	myForm.submit();
	console.log("submitted " + myForm.id);
	self.port.emit("SubmitPWReady");
});

self.port.on("LogoutData", function(data){
	var formID = data[0];
	var formName = data[1];
	var formAction = data[2];
	var mustWebsiteURL = data[3];
	var hrefLink = data[4];
	var myForm;

	if(formAction != ""){
		if(formID != ""){
			myForm = document.getElementById(formID);
		}
		else if (formName != ""){
			myForm = document.getElementsByName(formName);
		}
		else{
			formsCollection = document.getElementsByTagName("form");
		
			for(var i=0;i<formsCollection.length;i++){
		   		var actualForm = formsCollection[i];
		   		if(actualForm.action == formAction){ 
		   			myForm = formsCollection[i];
		   			break;
		   		}
			}
		}
		myForm.submit();
	}
	else if(href != ""){
		window.location.href = href;
	}
	// if it is a button
	else if(formID != ""){
		var button = document.getElementById(formID);
		button.click();
	}
	else if(formName != ""){
		var button = document.getElementsByName(formName)[0];
		button.click();
	}
});

// not needed in this version
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

// not needed in this version
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

/*
this function fills out password fields in a form
node: form that have to be filled out
password: actual password
newpassword: the new password
numOfPWFields: number of inputfields with type="password" in form 
PWInfo: array like [A,N,N] that means -> first field is actual password, second and third field is new password
*/
function fillOutPWFieldsIn(node,password, newpassword,numOfPWFields,PWInfo){
	var allElements = document.getElementsByTagName('input');
	var found = 0;
	var pwCount = numOfPWFields;

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
				console.log("hier wird das alte pw eingetipt = " + allElements[i].id + " " + allElements[i].name);
				pwCount--;
			}
			else if(allElements[i].type == "password"){
				console.log("neues pw eintippen");
				allElements[i].value = newpassword;
				console.log("hier wird das neue pw eingetipt = " + allElements[i].id + " " + allElements[i].name);
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

//recursive function  that returns number of inputfields of type="type" in a html element
//node: html element
//type: type developer is searching for 
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

