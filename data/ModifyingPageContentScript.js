/*
 This is the content script for interaction with webpages
 it performs every input and submit that ist needed for password change on extern webpages
 */

/**
 * Listener for xyClick message
 * message: [x coordinate, y coordinate, viewport position]
 */
self.port.on("xyCoords", function (message) {
    let xCoord = message[0];
    let yCoord = message[1];
    let mustScrollTop = message[2];

    //scroll the viewport if necessary
    if (document.documentElement.scrollTop != mustScrollTop)
        document.documentElement.scrollTop = mustScrollTop;

    // perform click
    let element = document.elementFromPoint(xCoord, yCoord);
    if (element !== null) {
        // dispatch mouseover event before clicking, as this is required sometimes
        let event = document.createEvent('Event');
        event.initEvent('mouseover', true, true);
        element.dispatchEvent(event);
        element.click();
        self.port.emit("clickDone");
    } else {
        console.log("element to click not found");
    }
});

/**
 * Listener for fillInput message
 * message: [x, numberOfInputElements, positionOfInputElement]
 * with x being either username, current password or new password
 */
self.port.on("fillInput", function (message) {
    let value = message[0];
    let numberOfInputElements = message[1];
    let positionOfInputElement = message[2];
    let inputs = document.getElementsByTagName("input");

    if (inputs.length !== numberOfInputElements) {
        // site has changed since recording the blueprint, abort
        self.port.emit("errorNumberOfInputElements");
    } else {
        // fill input with provided value
        inputs[positionOfInputElement].value = value;
        self.port.emit("inputDone");
    }
});