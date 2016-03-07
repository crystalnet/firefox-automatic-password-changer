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
self.port.on("submitElementID", function(message){
	submitElementID = message;
	if(document.getElementById(submitElementID) != null){
		var btn = document.getElementById(submitElementID);
	}
    else if (document.getElementsByName(submitElementID)[0] != null){
        var btn = document.getElementsByName(submitElementID)[0];
    }
    else
    	return;
    btn.click();
    self.port.emit("wr");
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

