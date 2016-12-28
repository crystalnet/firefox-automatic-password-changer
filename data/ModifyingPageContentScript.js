//### script for interaction with a website -> filling forms
/*
This is the content script for interaction with webpages
it performs every input and submit that ist needed for password change on extern webpages
*/

/*
 Listener for xyClick message
 message: [x coordinate, y coordinate, viewport position]
*/
self.port.on("xyCoords", function(message){
	var xCoord = message[0];
	var yCoord = message[1];
	var mustScrollTop = message[2];

	//scroll the viewport if necessary
	if(document.documentElement.scrollTop != mustScrollTop)
		document.documentElement.scrollTop = mustScrollTop;

	// perform click
	var element = document.elementFromPoint(xCoord,yCoord);
	if(element != null) {
        // some stuff for google special case
        let googleAccountButton = window.content.document.querySelector("a[href^='https://accounts.google.com/SignOutOptions']");
		if(element.parentNode.isSameNode(googleAccountButton)) {
            let event = document.createEvent('Event');
            event.initEvent('mouseover', true, true);
            element.dispatchEvent(event);
		}
        element.click();
        self.port.emit("clickDone");
	} else {
		console.log("element to click not found");
	}
});

/*
 Listener for fillInput message
 message: [x, numberOfInputElements, positionOfInputElement]
 with x being either username, current password or new password
*/
self.port.on("fillInput", function(message) {
	var value = message[0];
	var numberOfInputElements = message[1];
	var positionOfInputElement = message[2];
    var inputs = document.getElementsByTagName("input");

    if(inputs.length !== numberOfInputElements) {
        // site has changed since recording the blueprint, abort
        self.port.emit("errorNumberOfInputElements");
	} else {
    	// fill input with provided value
        inputs[positionOfInputElement].value = value;
        self.port.emit("inputDone");
    }
});