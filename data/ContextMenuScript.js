/*
this is a content script for contextmenu functionalities 
it is attached to the contextmenu when a recorderobject is recording 
there are 3 events it listens for
usernameOrEmail = user marked a inputfield as a username input field
currentPassword = user marked a inputfield as a actual password input field
newPassword = user marked a inputfield as a new password input field
*/
self.on("click", function (node, data) {
    switch(data){
		case "usernameOrEmail":
    		// first remove possibly registered event handlers, so if the user uses
			// the context menu option several times on the same input element we still
			// only send one message on blur event
    		node.removeEventListener("blur", postMessage, false);
    		node.addEventListener("blur", postMessage(node, "U"), false);
    		break;
    	case "currentPassword":
            node.removeEventListener("blur", postMessage, false);
            node.addEventListener("blur", postMessage(node, "C"), false);
            break;
    	case "newPassword":
            node.removeEventListener("blur", postMessage, false);
            node.addEventListener("blur", postMessage(node, "N"), false);
            break;
    }
});

function postMessage(node, tag) {
    // nodeNumber is the position of the node inside the collection of all
    // input elements; we use this number to identify the node on the page
    var nodeNumber;
    // variables we need for changing the password after recording stopped
    var formSubmitURL = "";
    var usernameInputName = "";
    var passwordInputName = "";
    var currentWebsite = window.location.href;
    var websiteTrunk = currentWebsite.split("?");

    var inputs = document.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
    	if(inputs[i].isSameNode(node)) {
            nodeNumber = i;
            break;
        }
    }
    if(tag === "U") {
        formSubmitURL = node.form.action;
        usernameInputName = node.name;
        var passwordInputs = document.querySelectorAll("input[type=password]");
        for (var j = 0; j < passwordInputs.length; j++) {
            if(passwordInputs[j].form.isSameNode(node.form)) {
                passwordInputName = passwordInputs[j].name;
                break;
            }
        }

    }
    self.postMessage([tag,node.value,inputs.length,nodeNumber,websiteTrunk[0],formSubmitURL,usernameInputName,passwordInputName]);
}