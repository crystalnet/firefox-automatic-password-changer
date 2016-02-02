//### script for interaction with a website -> filling forms
var elementID;
var inputValue;
var xCoord;
var yXoord;
var submitElementID;

self.port.on("submitElementID", function(message){
	submitElementID = message;
	if(document.getElementById(submitElementID) != null){
		var btn = document.getElementById(submitElementID);
	}
    else if (document.getElementsByName(submitElementID)[0] != null){
        var btn = document.getElementsByName(submitElementID)[0];
    }
    btn.submit();
});

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
	}
});

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
	}
});

