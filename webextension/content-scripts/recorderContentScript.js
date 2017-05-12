/**
 * This is the content script injected into a tab on recording.
 * It handles the necessary event listeners, which are used to send the
 * information required for recording to the recorder background script
 */

// we use lodash's throttle function, because the scroll event is fired extensively during scrolling of
// a page and we don't need to send the current scrollTop position to the background code each time
let throttle = _.throttle(onScrollEventHandler, 200, {leading: false, trailing: true});

/**
 * Listens for messages from the background code
 */
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // handle the message sent from background code after user clicked a context menu item
    // as the message from the background code is sent shortly after clicking the context menu item,
    // the "node" variable stores a reference to the element the user invoked the context menu on
    switch (request.type) {
        case "label":
            let inputs = document.getElementsByTagName("input");
            inputs[request.inputNumber].addEventListener("blur", onBlurEventHandler, false);
            break;
        case "getWebPage":
            sendResponse({webPage: window.content.location.href});
            break;
        case "stopRecording":
            stopRecording();
            break;
    }
});

/**
 * Start recording
 */
(function startRecording() {
    registerEventHandlers();
})();

/**
 * Handles click events
 */
function onClickEventHandler(event) {
    // ignore right button click, which is used for context menu
    if (event.button === 0) {
        browser.runtime.sendMessage({
            type: "clickHappened",
            webPage: window.content.location.href,
            scrollTop: document.documentElement.scrollTop,
            clientX: event.clientX,
            clientY: event.clientY,
            innerHeight: window.content.innerHeight,
            innerWidth: window.content.innerWidth
        });
    }
}

/**
 * Handles scroll events
 */
function onScrollEventHandler() {
    browser.runtime.sendMessage({
        type: "scrollHappened",
        scrollTop: document.documentElement.scrollTop
    });
}

/**
 * Handles blur events
 */
function onBlurEventHandler(event) {
    let node = event.target;
    // nodeNumber is the position of the node inside the collection of all
    // input elements; we use this number to identify the node on the page
    let nodeNumber;
    let inputs = document.getElementsByTagName("input");
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].isSameNode(node)) {
            nodeNumber = i;
            break;
        }
    }
    browser.runtime.sendMessage({
        type: "blurHappened",
        webPage: window.content.location.href,
        scrollTop: document.documentElement.scrollTop,
        nodeNumber: nodeNumber,
        inputsLength: inputs.length,
        nodeFormAction: node.form.action,
        nodeValue: node.value,
        nodeName: node.name
    });
}

/**
 * Stop logging actions and remove all listener
 */
function stopRecording() {
    document.body.removeEventListener('click', onClickEventHandler, false);
    document.removeEventListener('scroll', throttle, false);
    Array.prototype.forEach.call (document.getElementsByTagName("input"), function(node) {
        node.removeEventListener('blur', onBlurEventHandler, false);
    });
}

/**
 * registers all necessary event handlers on the document object of the window
 */
function registerEventHandlers() {
    document.body.addEventListener('click', onClickEventHandler, false);
    document.addEventListener('scroll', throttle, false);
    // special case for google button which prevents bubbling of click event up to the document
    let googleAccountButton = document.querySelector("a[href^='https://accounts.google.com/SignOutOptions']");
    if (googleAccountButton !== null) {
        googleAccountButton.addEventListener('click', onClickEventHandler, false);
    }
    // special case for ebay button which submits the new password form
    let ebaySubmitButton = document.getElementById("sbtBtn");
    if (ebaySubmitButton !== null) {
        ebaySubmitButton.addEventListener('click', onClickEventHandler, false);
    }
    // special case for twitter 'egg' button
    let twitterEggButton = document.getElementById("user-dropdown-toggle");
    if (twitterEggButton !== null) {
        twitterEggButton.addEventListener('click', onClickEventHandler, false);
    }
    // special case for stargames menu button
    let stargamesButton = document.querySelector("a[data-gt-name='user-menu-btn']");
    if (stargamesButton !== null) {
        stargamesButton.addEventListener('click', onClickEventHandler, false);
    }
}