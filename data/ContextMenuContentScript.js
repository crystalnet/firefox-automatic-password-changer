/**
 * this is a content script for contextmenu functionalities
 */
self.on("click", function (node, data) {
    switch (data) {
        case "usernameOrEmail":
            self.postMessage(["tagging", getNumberOfInput(node), "U"]);
            break;
        case "currentPassword":
            self.postMessage(["tagging", getNumberOfInput(node), "C"]);
            break;
        case "newPassword":
            self.postMessage(["tagging", getNumberOfInput(node), "N"]);
            break;
        case "generatePwd":
            self.postMessage(["password", "generatePwd", getNumberOfInput(node)]);
            break;
        case "reusePwd":
            self.postMessage(["password", "reusePwd", getNumberOfInput(node)]);
            break;
    }
});

function getNumberOfInput(node) {
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
    return nodeNumber;
}