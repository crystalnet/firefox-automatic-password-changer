/*
 this is a content script for contextmenu functionalities
 it is attached to the contextmenu when a recorderobject is recording
 there are 4 events that is listened for
 BE1 = if user marked a inputfield as a username input field
 AP2 = if user marked a inputfield as a actual password input field
 NP3 = if user marked a inputfield as a new password input field
 Logout = if user marked a inputfield as a logout element input field
 */
var myFrom;
self.on("click", function (node, data) {
    console.log("You clicked " + data);

    console.log("marked node with form.id='" + node.form.id +
        "' form.name='" + node.form.name +
        "' type='" + node.type +
        "' id='" + node.id +
        "' name='" + node.name +
        "' form.action='" + node.form.action + "'"
    );

    //TODO change BE1, AP2, NP3 to more expressive labels
    switch (data) {
        case "BE1":
            self.postMessage(["BE1", node.form.id, node.type, node.id, node.name, node.form.name, node.form.action]);
            break;
        case "AP2":
            self.postMessage(["AP2", node.form.id, node.type, node.id, node.name, node.form.name, node.form.action]);
            break;
        case "NP3":
            self.postMessage(["NP3", node.form.id, node.type, node.id, node.name, node.form.name, node.form.action]);
            break;
        case "Logout":
            console.log("hiermit loggt man sich aus");
            if ((node.form != null) && (node.form.hasAttribute("action"))) {
                self.postMessage(["Logout", node.form.id, node.form.name, node.form.action, ""]);
            }
            else if (node.hasAttribute("href")) {
                self.postMessage(["Logout", "", "", "", node.href]);
            }
            else if (node.tagName == "button")
                self.postMessage(["Logout", node.id, node.name, "", ""]);
            break;
    }
});