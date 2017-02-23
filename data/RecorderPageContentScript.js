/*
 This is a content script that is attached to a webpage when handling context menu action
 */

self.port.on("RecordingContextMenuClick", function (message) {
    let inputs = document.getElementsByTagName("input");
    inputs[message[1]].style.backgroundColor = "yellow";
});

self.port.on("PasswordContextMenuClick", function (message) {
    let inputs = document.getElementsByTagName("input");
    inputs[message[2]].value = message[3];
});