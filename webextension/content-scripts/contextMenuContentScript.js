let node;

/**
 * Listens for messages from the background code
 */
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // handle the message sent from background code after user clicked a context menu item
    // as the message from the background code is sent shortly after clicking the context menu item,
    // the "node" variable stores a reference to the element the user invoked the context menu on
    switch (request.case) {
    case 'password':
        node.value = request.content;
        break;
    case 'highlight':
        node.style.backgroundColor = 'yellow';
        sendResponse({inputNumber: getNumberOfInput(node)});
        break;
    }
});

document.addEventListener('contextmenu', function(event) {
    node = event.target;
}, false);

function getNumberOfInput(node) {
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
    return nodeNumber;
}