/*
 This is the content script for the blueprint menu
 */

let languageStrings = "";

self.port.on("languageStrings", function handleMyMessage(myMessagePayload) {
    languageStrings = myMessagePayload;
    let title = document.getElementById("title_blueprints");
    title.innerHTML = languageStrings["title_blueprints"];
    let heading_blueprints = document.getElementById("heading_blueprints");
    heading_blueprints.innerHTML = languageStrings["heading_blueprints"];
});

self.port.on("startBuildingBlueprints", function (BPs) {
    if (BPs != null)
        buildBlueprints(BPs);

});


self.port.on("closing", function () {
    Clear();
});

/**
 * builds dynamically a list of blueprint which are known to the addon
 * @param BPs hashtable from simple-storage of blueprints
 */
function buildBlueprints(BPs) {

    console.log("start building blueprints");
    console.log(BPs.length);
    let BPKeys = Object.keys(BPs.items);
    for (let i = 0; i < BPKeys.length; i++) {
        let url = BPKeys[i];
        console.log("url = " + url);
        addBPSection(url);
    }
    $(function () {
        $("#accordion").accordion();
    });


}

/**
 * adds a section for a blueprint to blueprint menu
 * @param url
 */
function addBPSection(url) {
    let accord = document.getElementById('accordion');
    if (accord !== null) {
        let h3 = document.createElement("H3");
        let div = document.createElement("DIV");
        let deleteBtn = document.createElement("BUTTON");

        // adding labels to elements
        h3.innerHTML = languageStrings["page"] + ": " + url;

        div.setAttribute("id", "ID" + url);

        deleteBtn.innerHTML = languageStrings["delete_entry"];

        //adding onClick functions
        deleteBtn.addEventListener('click', function () {
            deleteThisEntry(url, name);
        });

        div.appendChild(deleteBtn);
        accord.appendChild(h3);
        accord.appendChild(div);
    }
}

/**
 * trigger function for deleting entry from persistent storage and password manager
 * @param url for website of blueprint
 * @param username username for account for website of blueprint
 */
function deleteThisEntry(url, username) {
    window.alert(languageStrings["This_blueprint_will_be_deleted_out_of_the_memory_of_firefox"]);
    console.log("deleting entry blueprint: " + url);
    self.port.emit("deleteThisEntry", url);
}

/**
 * destroy all objects and Listener if needed
 */
function Clear() {

}
