/*
 This is the content script for option panel of the addon
 */

let languageStrings = "";
self.port.on("languageStrings", function handleMyMessage(localizationObject) {
    languageStrings = localizationObject;
});

// listen to startBuilding event after show event
self.port.on("startBuilding", buildPanelHTML);
//self.port.on("hide",deletePanelContent);

self.port.on("switchRecordbuttonLabel", switchRecordButtonState);

/**
 * build panel dynamically
 */
function buildPanelHTML() {
    createOptionButton("record-button", languageStrings["record"], "images/recording_16x16.png", startRecord_endRecord);
    createSeparator("myHr1");
    createOptionButton("accountlist", languageStrings["accountlist"], "images/list-v1_16.png", openAccounts);
    //createOptionButton("on-off-button","Deaktivieren","icon-16.png",activate_deaktivate);
    createSeparator("myHr2");
    createOptionButton("help", languageStrings["help"], "images/help-16.png", openHelp)
}

/**
 * creates a separator in panel menu
 * @param id id for separator
 */
function createSeparator(id) {
    if (document.getElementById(id) == null) {
        let hr = document.createElement("hr");
        hr.setAttribute("id", id);
        document.body.appendChild(hr);
    }
}

/**
 * creates buttons in panel menu
 * @param id ID of the new element
 * @param text innerHTML text of element
 * @param iconSrc path to icon for element
 * @param newFunction function to be appended to new element on click
 */
function createOptionButton(id, text, iconSrc, newFunction) {
    if (iconSrc === undefined) {
        iconSrc = "icon-16.png";
    }
    if (document.getElementById(id) == null) {
        let div = document.createElement("DIV");
        let img = document.createElement("IMG");

        div.setAttribute("id", id);
        div.setAttribute("class", "menu-item");

        img.setAttribute("src", iconSrc);
        img.setAttribute("class", "icon");

        div.innerHTML = text;
        div.appendChild(img);

        div.addEventListener("click", newFunction, false);
        document.body.appendChild(div);
    }
}

/**
 * function for clicking on menu option Accountlist
 */
function openAccounts() {
    self.port.emit("openAccountList");
}

/**
 * function for clicking on menu option help
 */
function openHelp() {
    self.port.emit("openHelp");
}

/**
 * function for start-endRecording
 * @param evt
 */
function startRecord_endRecord(evt) {
    switchRecordButtonState();
    self.port.emit("stopgorecord");
}

/**
 * changes label for record button
 */
function switchRecordButtonState() {
    let recordButton = document.getElementById("record-button");
    let image = document.createElement("IMG");
    //let iconSrc = recordButton.getElementsByTagName("IMG");
    //image.setAttribute("src",recordButton.getElementsByTagName("IMG")[0].src);
    image.setAttribute("class", "icon");

    if (recordButton.innerHTML.indexOf(languageStrings["record"]) === 0) {
        recordButton.innerHTML = languageStrings["stop_recording"];
        image.setAttribute("src", "images/stop.png");
        recordButton.appendChild(image);
    }
    else {
        recordButton.innerHTML = languageStrings["record"];
        image.setAttribute("src", "images/recording_16x16.png");
        recordButton.appendChild(image);
    }
}
