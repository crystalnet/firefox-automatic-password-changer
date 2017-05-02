let backgroundPage;

(function init() {
    // get background page to access recorder status and info messages to display
    let gettingBackgroundPage = browser.runtime.getBackgroundPage();
    gettingBackgroundPage.then(initDone, handleError);
})();

function initDone(page) {
   backgroundPage = page;
   complementPanelHTML();
}

/**
 * add missing parts to panel HTML
 */
function complementPanelHTML() {
    let iconSrc = "../../images/icons/stop.png";
    let label = browser.i18n.getMessage("stop_recording");
    if (backgroundPage.getRecorderStatus() === false) {
        iconSrc = "../../images/icons/recording_16x16.png";
        label = browser.i18n.getMessage("record");
    }
    complementOptionButton("record-button", label, iconSrc, startRecord_endRecord);
    complementOptionButton("accountlist", browser.i18n.getMessage("accountlist"), "../../images/icons/list-v1_16.png", openAccounts);
    complementOptionButton("help", browser.i18n.getMessage("help"), "../../images/icons/help-16.png", openHelp);
    // add info messages
    let infoMessages = backgroundPage.getMessagesToDisplay();
    infoMessages.each(function(key, value) {
        addInfoMessage(value[0], value[1], key);
    });
    // append appropriate event listeners for info messages
    let closeIcons = document.getElementsByClassName("closeIcon");
    Array.prototype.forEach.call(closeIcons, function (closeIcon) {
        closeIcon.addEventListener("click", removeInfoMessage);
    });
    let buttons = document.getElementsByTagName("button");
    Array.prototype.forEach.call(buttons, function (button) {
        button.addEventListener("click", visitWebsite);
    });
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
 * appends a separator and an info message to the options panel
 * @param domain
 * @param message
 * @param messageGUID
 */
function addInfoMessage(domain, message, messageGUID) {
    if (document.getElementById("info_" + domain) === null) {
        let hr = document.createElement("hr");
        hr.setAttribute("id", "hr_" + domain);
        document.body.appendChild(hr);

        let icon = document.createElement("IMG");
        icon.setAttribute("src", "../../images/icons/icon-info.png");

        let imgContainer = document.createElement("DIV");
        imgContainer.setAttribute("class", "imgContainer");
        imgContainer.appendChild(icon);

        let dismissIcon = document.createElement("IMG");
        dismissIcon.setAttribute("class", "closeIcon");
        dismissIcon.setAttribute("src", "../../images/icons/icon-close.png");

        let infoDomain = document.createElement("DIV");
        infoDomain.setAttribute("class", "infoDomain");
        infoDomain.innerHTML = domain;
        infoDomain.appendChild(dismissIcon);

        let infoMessage = document.createElement("DIV");
        infoMessage.setAttribute("class", "info");
        infoMessage.innerHTML = message;

        let button = document.createElement("BUTTON");
        button.innerHTML = browser.i18n.getMessage("visit_website");
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
    }
}

/**
 * Handles clicks on 'Visit Website' button
 * @param event the event triggered by clicking on the 'Visit Website' button
 */
function visitWebsite(event) {
    let infoDomain = event.target.parentNode.parentNode.firstChild;
    let domain = infoDomain.innerHTML.substring(0, infoDomain.innerHTML.indexOf("<img"));
    let tab = browser.tabs.create({
        url: domain
    });
    tab.then(function() {
        self.close();
    }, handleError);
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
    // use background code to handle badge etc.
    let messageGUID = clickedElementId.substring(5);
    backgroundPage.dismissInfoMessage(messageGUID);
}

/**
 * function for clicking on menu option Accountlist
 */
function openAccounts() {
    // TODO
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
    backgroundPage.toggleRecorder();
    self.close()
}