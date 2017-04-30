(function getRecorderStatus() {
    // get the recorder status, to display the correct first option
    let sending = browser.runtime.sendMessage({
        message: "requestingRecorderStatus"
    });
    sending.then(complementPanelHTML, handleError);
})();

/**
 * add missing parts to panel HTML
 */
function complementPanelHTML(message) {
    let iconSrc = "../../images/icons/stop.png";
    let label = browser.i18n.getMessage("stop_recording");
    if (message.recorderStatus === false) {
        iconSrc = "../../images/icons/recording_16x16.png";
        label = browser.i18n.getMessage("record");
    }
    complementOptionButton("record-button", label, iconSrc, startRecord_endRecord);
    complementOptionButton("accountlist", browser.i18n.getMessage("accountlist"), "../../images/icons/list-v1_16.png", openAccounts);
    complementOptionButton("help", browser.i18n.getMessage("help"), "../../images/icons/help-16.png", openHelp);
}

function handleError(error) {
    console.log(`Error: ${error}`);
}

/**
 * creates buttons in panel menu
 * @param id ID of the new element
 * @param text innerHTML text of element
 * @param iconSrc path to icon for element
 * @param newFunction function to be appended to new element on click
 */
function complementOptionButton(id, text, iconSrc, newFunction) {
    let div = document.getElementById(id);
    if (div !== null) {
        div.innerHTML = text;
        let icon = document.createElement("img");
        icon.setAttribute("src", iconSrc);
        icon.setAttribute("class", "icon");
        div.appendChild(icon);
        div.addEventListener("click", newFunction, false);
    }
}

/**
 * function for clicking on menu option Accountlist
 */
function openAccounts() {

}

/**
 * function for clicking on menu option help
 */
function openHelp() {
    let tab = browser.tabs.create({
        url: browser.i18n.getMessage("help-link")
    });
    tab.then(function() {
        self.close();
    }, handleError);
}

/**
 * function for start-endRecording
 */
function startRecord_endRecord() {
    let sending = browser.runtime.sendMessage({
        message: "switchRecorderStatus"
    });
    sending.then(function() {
        self.close();
    }, handleError);

}