/**
 this is a content script for contextmenu functionalities
 it is attached to the contextmenu when a recorderobject is recording
 there are 3 events it listens for
 usernameOrEmail = user marked a inputfield as a username input field
 currentPassword = user marked a inputfield as a actual password input field
 newPassword = user marked a inputfield as a new password input field
 */
self.on("click", function (node, data) {
    switch (data) {
        case "usernameOrEmail":
            postMessage(node, "U");
            break;
        case "currentPassword":
            postMessage(node, "C");
            break;
        case "newPassword":
            postMessage(node, "N");
            break;
    }
});

function postMessage(node, tag) {
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
    self.postMessage([nodeNumber, tag]);
}