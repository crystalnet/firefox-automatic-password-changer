// this stuff is only for testing the label switching in the add-on menu
// it should be removed when the recorder has been ported
let recorderStatus = false;
browser.runtime.onMessage.addListener(handleMessage);
function handleMessage(request, sender, sendResponse) {
    switch (request.message) {
        case "requestingRecorderStatus":
            sendResponse({recorderStatus: recorderStatus});
            break;
        case "switchRecorderStatus":
            recorderStatus = !recorderStatus;
            break;
    }
}