let node;

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // handle the message sent from background code after user clicked a context menu item
    // as the message from the background code is sent shortly after clicking the context menu item,
    // the "node" variable stores a reference to the element the user invoked the context menu on
    switch (request.case) {
        case "password":
            node.value = request.content;
    }
});

document.addEventListener("contextmenu", function(event) {
    node = event.target;
}, false);