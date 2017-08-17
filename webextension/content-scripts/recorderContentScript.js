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
browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // handle the message sent from background code after user clicked a context menu item
    // as the message from the background code is sent shortly after clicking the context menu item,
    // the "node" variable stores a reference to the element the user invoked the context menu on
    switch (request.type) {
    case 'label': {
        let inputs = document.getElementsByTagName('input');
        inputs[request.inputNumber].addEventListener('blur', onBlurEventHandler, false);

        if (request.label === 'N') {
            openSpecificationInterface(inputs[request.inputNumber]);
        }
        break;
    }
    case 'getWebPage': {
        sendResponse({webPage: window.content.location.href});
        break;
    }
    case 'stopRecording': {
        stopRecording();
        break;
    }}
});

/**
 * Start recording
 */
(function startRecording() {
    registerEventHandlers();
})();

function openSpecificationInterface(inputField) {
    const asdf = browser.extension.getURL('/content-scripts/specificationDialog.htm');

    $.ajax({
        url: asdf,
        success: function (data) {
            $('body').append(data);
            $('#specificationDialog').dialog({
                dialogClass: 'ui-dialog-no-close',
                width: 400,
                position: {my: 'left top', at: 'right top', of: inputField},
                buttons: [
                    {
                        text: 'OK',
                        click: function () {
                            $(this).dialog('close');
                        }
                    }
                ]
            });
            $('.ui-dialog-no-close .ui-dialog-titlebar-close').css('display', 'none');
        },
        error: function (error) {console.log(error);},
        dataType: 'html'
    });
}

/**
 * Handles click events
 */
function onClickEventHandler(event) {
    // ignore right button click and events triggered by javascript
    if (event.button === 0 && (event.clientX !== 0 || event.clientY !== 0)) {
        browser.runtime.sendMessage({
            type: 'clickHappened',
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
        type: 'scrollHappened',
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
    let inputs = document.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].isSameNode(node)) {
            nodeNumber = i;
            break;
        }
    }
    browser.runtime.sendMessage({
        type: 'blurHappened',
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
    document.removeEventListener('click', onClickEventHandler, true);
    document.removeEventListener('scroll', throttle, false);
    Array.prototype.forEach.call(document.getElementsByTagName('input'), function (node) {
        node.removeEventListener('blur', onBlurEventHandler, false);
    });
}

/**
 * registers all necessary event handlers on the document object of the window
 */
function registerEventHandlers() {
    // we use event capturing phase for click events, because some elements cancel event bubbling
    // this way we don't need special cases for single elements
    document.addEventListener('click', onClickEventHandler, true);
    document.addEventListener('scroll', throttle, false);
}