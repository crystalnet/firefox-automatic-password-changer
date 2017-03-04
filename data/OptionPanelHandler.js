/*
 This is the content script for option panel of the addon
 */

let languageStrings = "";
self.port.on("languageStrings", function handleMyMessage(localizationObject) {
    languageStrings = localizationObject;
});

// listen to startBuilding event after show event
self.port.on("startBuilding", buildPanelHTML);

self.port.on("switchRecordbuttonLabel", switchRecordButtonState);

self.port.on("infoMessage", function(payload) {
    addInfoMessage(payload[0], payload[1], payload[2]);
});

/**
 * build panel dynamically
 */
function buildPanelHTML() {
    createOptionButton("record-button", languageStrings["record"], "images/recording_16x16.png", startRecord_endRecord);
    createSeparator("menuHr1");
    createOptionButton("accountlist", languageStrings["accountlist"], "images/list-v1_16.png", openAccounts);
    createSeparator("menuHr2");
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
 * appends a separator and an info message to the options panel
 * @param domain
 * @param message
 * @param messageGUID
 */
function addInfoMessage(domain, message, messageGUID) {
    if (document.getElementById("info_" + domain) === null) {
        createSeparator("hr_" + domain);

        let icon = document.createElement("IMG");
        icon.setAttribute("src", "images/icon-info.png");

        let imgContainer = document.createElement("DIV");
        imgContainer.setAttribute("class", "imgContainer");
        imgContainer.appendChild(icon);

        let dismissIcon = document.createElement("IMG");
        dismissIcon.setAttribute("class", "closeIcon");
        dismissIcon.setAttribute("src", "images/icon-close.png");

        let infoDomain = document.createElement("DIV");
        infoDomain.setAttribute("class", "infoDomain");
        infoDomain.innerHTML = domain;
        infoDomain.appendChild(dismissIcon);

        let infoMessage = document.createElement("DIV");
        infoMessage.setAttribute("class", "info");
        infoMessage.innerHTML = message;

        let button = document.createElement("BUTTON");
        button.innerHTML = "Visit Website";
        let buttonContainer = document.createElement("DIV");
        buttonContainer.setAttribute("class", "buttonContainer");
        buttonContainer.appendChild(button);

        let infoContainer = document.createElement("DIV");
        infoContainer.setAttribute("class", "infoContainer");
        infoContainer.appendChild(infoDomain);
        infoContainer.appendChild(infoMessage);
        infoContainer.appendChild(buttonContainer);

        let itemContainer = document.createElement("DIV");
        itemContainer.setAttribute("id", "info_" + messageGUID);
        itemContainer.setAttribute("class", "itemContainer");
        itemContainer.appendChild(imgContainer);
        itemContainer.appendChild(infoContainer);

        document.body.appendChild(itemContainer);

        // append appropriate event listeners
        let closeIcons = document.getElementsByClassName("closeIcon");
        Array.prototype.forEach.call(closeIcons, function(closeIcon) {
           closeIcon.addEventListener("click", removeInfoMessage);
        });
        let buttons = document.getElementsByTagName("button");
        Array.prototype.forEach.call(buttons, function(button) {
            button.addEventListener("click", visitWebsite);
        });
    }
}

/**
 * removes an info message and its corresponding separator
 * @param event the event triggered by clicking on the dismiss icon
 */
function removeInfoMessage(event) {
    let clickedElementId = event.target.parentNode.parentNode.parentNode.id;
    let itemContainerToRemove = document.getElementById(clickedElementId);
    // remove separator
    let separatorToRemove = itemContainerToRemove.previousSibling;
    separatorToRemove.parentNode.removeChild(separatorToRemove);
    // remove message container
    itemContainerToRemove.parentNode.removeChild(itemContainerToRemove);
    // inform add-on code to handle badge etc.
    let messageGUID = clickedElementId.substring(3);
    self.port.emit("removeMessage", [messageGUID]);
}

/**
 * Handles clicks on 'Visit Website' button
 * @param event the event triggered by clicking on the 'Visit Website' button
 */
function visitWebsite(event) {
    let infoDomain = event.target.parentNode.parentNode.firstChild;
    let domain = infoDomain.innerHTML.substring(0, infoDomain.innerHTML.indexOf("<img"));
    self.port.emit("visitWebsite", [domain]);
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
    image.setAttribute("class", "icon");
    if (recordButton.innerHTML.indexOf(languageStrings["record"]) === 0) {
        recordButton.innerHTML = languageStrings["stop_recording"];
        image.setAttribute("src", "images/stop.png");
    } else {
        recordButton.innerHTML = languageStrings["record"];
        image.setAttribute("src", "images/recording_16x16.png");
    }
    recordButton.appendChild(image);
}
