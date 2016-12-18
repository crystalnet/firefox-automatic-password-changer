/*
This is a content script that the recorder attaches to a webpage at recording a new blueprint.
if contextmenu is used an inputfield will be marked yellow as visual feedback for user
*/
self.port.on("ContextMenuClick", function(message){
    var position = message[3];
    var inputs = document.getElementsByTagName("input");
    inputs[position].style.backgroundColor = "yellow";
});