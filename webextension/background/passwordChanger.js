// this stuff is only for testing the label and badge switching in the add-on menu
// it should be moved to the recorder after porting it
let recorderStatus = false;
// starts the recorder, if it is inactive and stops it otherwise
function toggleRecorder() {
    recorderStatus = !recorderStatus;
    // trigger badge change
    if (recorderStatus)
        badge.activateRecording();
    else
        badge.deactivateRecording();
}
function getRecorderStatus() {
    return recorderStatus;
}

/**************** actual content starting here ******************/

let messagesToDisplay = new HashTable();
let messagesDismissedByUser = [];
let portToLegacyAddOn;

(function init() {
    portToLegacyAddOn = browser.runtime.connect({name: "connection-to-legacy"});
    portToLegacyAddOn.onMessage.addListener(function(message) {
        switch (message.type) {
            case "LoginDomains":
                queryInfoWebservice(message.content);
                break;
        }
    });
    portToLegacyAddOn.postMessage({
        content: "getLoginDomains"
    });
})();

/**
 * gets info messages for domains from a webservice
 */
function queryInfoWebservice(domains) {
    // TODO When the webservice is running in the future, do a request here to get actual info messages
    // use dummy JSON data for now to showcase functionality
    let infoMessages = JSON.parse('{"0":["http://should-not-be.included", "testing entry"],"1":["http://fc2.com", "Password hash values have been leaked in March 2017."],"2":["https://www.amazon.de", "Amazon has released a press statement advising its customers to change their password."],"3":["https://imgur.com", "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."],"4":["https://accounts.google.com", "Google sold account data to russian hackers. Shame on you, Google!"]}');
    for (let GUID in infoMessages) {
        // only display relevant messages, which have not yet been dismissed by the user
        if (infoMessages.hasOwnProperty(GUID) && domains.indexOf(infoMessages[GUID][0]) !== -1 && messagesDismissedByUser.indexOf(GUID) === -1) {
            messagesToDisplay.setItem(GUID, infoMessages[GUID]);
        }
    }
    badge.set(messagesToDisplay.length);
}

/**
 *
 * @param messageGUID
 */
function dismissInfoMessage(messageGUID) {
    badge.decrement();
    messagesDismissedByUser.push(messageGUID);
    messagesToDisplay.removeItem(messageGUID);
}

/**
 * getter for messagesToDisplay
 * @returns {HashTable}
 */
function getMessagesToDisplay() {
    return messagesToDisplay;
}