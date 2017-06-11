
// in some cases the tabs.onUpdated event can be fired multiple times without obvious reason
// to prevent multiple injection of this script, we just need to declare some variable,
// because tabs.executeScript fails, if it injects a script that tries to redeclare a variable
let preventMultipleInjectionOfThisScript;

// listen for messages from the background imitator script
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.type) {
        case "getWebPage":
            sendResponse({webPage: window.content.location.href});
            break;
        case "getInnerDimensions":
            sendResponse({innerHeight: window.content.innerHeight, innerWidth: window.content.innerWidth});
            break;
        case "fillInput":
            fillInput(request.data.value, request.data.numberOfInputElements, request.data.positionOfInputElement);
            break;
        case "clickCoordinates":
            clickCoordinates(request.data.xCoordinate, request.data.yCoordinate, request.data.mustScrollTop, request.data.triggersSiteLoad);
            break;
    }
});

(function documentLoaded() {
    // the imitatorContentScript is executed on document_idle, so we send a message to the imitator
    // background script to inform that the document is loaded completely and imitation can be started
    window.setTimeout(function() {
        browser.runtime.sendMessage({type: "documentLoaded"});
    }, 2000);
})();

/**
 * Fills the input element identified by the parameters with the provided value
 * @param value The value to fill in
 * @param numberOfInputElements Number of input elements we expect on the site
 * @param positionOfInputElement Identifies with input element should be filled
 */
function fillInput(value, numberOfInputElements, positionOfInputElement) {
    let inputs = document.getElementsByTagName("input");
    if (inputs.length !== numberOfInputElements) {
        // site has changed since recording the blueprint, abort
        browser.runtime.sendMessage({type: "errorNumberOfInputElements"});
    } else {
        // fill input with provided value
        inputs[positionOfInputElement].value = value;
        browser.runtime.sendMessage({type: "fillInputDone"});
    }
}

/**
 * Clicks at provided position in the web page
 * @param xCoordinate clientX-coordinate of click event
 * @param yCoordinate clientY-coordinate of click event
 * @param mustScrollTop scrollTop of window element for calibrating the viewport on website
 * @param triggersSiteLoad String indicating whether or not this click will trigger a site load
 */
function clickCoordinates(xCoordinate, yCoordinate, mustScrollTop, triggersSiteLoad) {
    //scroll the viewport if necessary
    if (document.documentElement.scrollTop !== mustScrollTop)
        document.documentElement.scrollTop = mustScrollTop;
    // perform click
    let element = document.elementFromPoint(xCoordinate, yCoordinate);
    if (element !== null) {
        // dispatch mouseover event before clicking, as this is required sometimes
        let event = new Event("mouseover");
        element.dispatchEvent(event);
        element.click();
        browser.runtime.sendMessage({type: "clickCoordinatesDone", triggersSiteLoad: triggersSiteLoad});
    } else {
        console.log("element to click not found");
    }
}