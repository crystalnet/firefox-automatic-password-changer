let backgroundPage;

(function init() {
    // get background page to access the port to the legacy add-on and blueprintStorageAccess
    let gettingBackgroundPage = browser.runtime.getBackgroundPage();
    gettingBackgroundPage.then(initDone, null);
})();

function initDone(page) {
    backgroundPage = page;
    let portToLegacyAddOn = backgroundPage.getPortToLegacyAddOn();
    portToLegacyAddOn.onMessage.addListener(function(message) {
        if (message.type === "LoginCredentials") {
            // we got the necessary information from the legacy add-on, so now we can build the account list
            buildAccountList(message.content, Object.keys(backgroundPage.getBlueprintStorageAccess().getAllBlueprints().items));
        }
    });
    // get all stored login credentials (list of [username, url])
    portToLegacyAddOn.postMessage({
        type: "getLoginCredentials"
    });
}

/**
 * Build the account list dynamically
 * @param loginCredentials Login credentials from the password manager
 * @param blueprintKeys Keys of stored blueprints
 */
function buildAccountList(loginCredentials, blueprintKeys) {
    let listToDisplay = getListItems(loginCredentials, blueprintKeys);
    // now we can build the account list
    for (let i = 0; i < listToDisplay.length; i++) {
        let name = listToDisplay[i][0];
        let url = listToDisplay[i][1];
        let blueprintExists = blueprintKeys.indexOf(url) !== -1;
        addAccountSection(name, url, blueprintExists);
    }
    // style the account list
    let accountList = $("#accountList");
    accountList.accordion({
        collapsible: true,
        active: false,
        heightStyle: "content",
        beforeActivate: function(event, ui) {
            return !ui.newHeader.hasClass("unused-blueprint");
        }
    });
    $(document.getElementById("btn_import_blueprints")).button({
        label: browser.i18n.getMessage("btn_import_blueprints")
    }).on('click', importBlueprint);
    let title = document.getElementById("title_accountlist");
    let heading_accountList = document.getElementById("heading_accountlist");
    title.innerHTML = browser.i18n.getMessage("title_accountlist");
    heading_accountList.innerHTML = browser.i18n.getMessage("heading_accountlist");
    // make everything visible
    $("#content").css("visibility", "visible");
}

/**
 * Merge everything that should get an own entry into one list
 * @return {Array}
 */
function getListItems(accountInformationEntries, blueprintKeys) {
    let listToDisplay = [];
    for (let i = 0; i < accountInformationEntries.length; i++) {
        listToDisplay.push(accountInformationEntries[i]);
    }
    for (let i = 0; i < blueprintKeys.length; i++) {
        // check if accountInformationEntries contains blueprint URL
        let hasItem = false;
        for (let j = 0; j < accountInformationEntries.length; j++) {
            if (accountInformationEntries[j][1] === blueprintKeys[i]) {
                hasItem = true;
            }
        }
        if (!hasItem) {
            listToDisplay.push(["", blueprintKeys[i]]);
        }
    }
    // sort list
    listToDisplay.sort(function (a, b) {
        // compare URLs
        return (a[1]).localeCompare(b[1]);
    });
    return listToDisplay;
}

/**
 * Adds a section for an account to the account list
 * @param name Username for a login entry
 * @param url URL for a login entry
 * @param blueprintExists True, if a blueprint is known for url
 */
function addAccountSection(name, url, blueprintExists) {
    let hasAccountEntry = name !== "";
    let accountList = document.getElementById('accountList');

    let itemHeader = document.createElement("H3");
    let itemContent = document.createElement("DIV");
    itemContent.setAttribute("id", "ID_" + url);

    if (hasAccountEntry) {
        // account entry from password manager
        itemHeader.innerHTML = "&nbsp<b>" + browser.i18n.getMessage("page") + "</b>: " + url + "&nbsp&nbsp&nbsp<b>" + browser.i18n.getMessage("user") + "</b>: " + name;
        if (blueprintExists) {
            let $changeBtn = $(document.createElement("DIV")).button({
                label: browser.i18n.getMessage("change_password_now_automatically")
            }).on('click', function () {
                changeThisPasswordAut(url, name);
            });
            let $createPathBtn = $(document.createElement("DIV")).button({
                label: browser.i18n.getMessage("change_password_now_manually")
            }).on('click', function () {
                navigateToChangePW(url);
            });
            $(itemContent).append($changeBtn)
                .append($createPathBtn);
        }
        // always show "Record Blueprint" button for an account entry
        let $recordBtn = $(document.createElement("DIV")).button({
            label: browser.i18n.getMessage("record_blueprint_btn")
        }).on('click', function () {
            startRecording(url);
        });
        $(itemContent).append($recordBtn);
    } else {
        // blueprint entry without associated account information
        itemHeader.classList.add("unused-blueprint");
        itemHeader.innerHTML = "&nbsp<b>" + browser.i18n.getMessage("page") + "</b>: " + url + "&nbsp&nbsp<i>" + browser.i18n.getMessage("no_login_data") + "</i>";
    }

    if (blueprintExists) {
        itemHeader.classList.add("has-blueprint");
        itemContent.classList.add("has-blueprint");

        let $exportBtn = $(document.createElement("DIV")).button({
            icon: "ui-icon-disk",
            showLabel: false
        }).addClass("blueprint-dependent export-blueprint-button").click(function (event) {
            // stop bubbling of click event to prevent opening or collapsing of accordion section
            event.stopPropagation();
            exportBlueprint(url);
        }).prop("title", browser.i18n.getMessage("export-blueprint-tooltip"));
        $exportBtn.tooltip();

        let $deleteBtn = $(document.createElement("DIV")).button({
            icon: "ui-icon-trash",
            showLabel: false
        }).addClass("blueprint-dependent delete-blueprint-button").click(function (event) {
            // stop bubbling of click event to prevent opening or collapsing of accordion section
            event.stopPropagation();
            deleteBlueprint(url);
        }).prop("title", browser.i18n.getMessage("delete-blueprint-tooltip"));
        $deleteBtn.tooltip();

        $(itemHeader).append($exportBtn)
            .append($deleteBtn);
    } else {
        itemHeader.classList.add("no-blueprint");
        itemContent.classList.add("no-blueprint");
    }

    accountList.appendChild(itemHeader);
    accountList.appendChild(itemContent);
}

/**
 * Trigger function for automatic change password
 * @param url URL for a login entry
 * @param username Username for a login entry
 */
function changeThisPasswordAut(url, username) {
    window.alert(browser.i18n.getMessage("acclmessage3"));
    // TODO
}

/**
 * Trigger function for recording a new blueprint
 * @param url URL for a login entry
 */
function startRecording(url) {
    let message = browser.i18n.getMessage("acclmessage1", url);
    let box = window.confirm(message);
    if (box === true) {
        let querying = browser.tabs.query({currentWindow: true, active: true});
        querying.then(function(tabs) {
            let creating = browser.tabs.create({
                url: url
            });
            creating.then(function() {
                // close the account list tab
                browser.tabs.remove(tabs[0].id);
                // trigger recording on newly opened tab
                backgroundPage.toggleRecorder();
            }, null);
        }, null);
    }
}

/**
 * Navigating user to the page where the changing form is located.
 * @param url URL for a login entry
 */
function navigateToChangePW(url) {
    window.alert(browser.i18n.getMessage("acclmessage4"));
    let blueprint = backgroundPage.getBlueprintStorageAccess().getBlueprint(url);
    if (typeof blueprint !== 'undefined') {
        let pwChangeUrl = "";
        for (let i = 0; i < blueprint.length; i++) {
            let item = blueprint.getItem(i);
            if (item[1] === "N") {
                pwChangeUrl = item[4];
                break;
            }
        }
        browser.tabs.create({
            url: pwChangeUrl
        });
    }
}

/**
 * Trigger function for export of blueprints
 * @param url URL for a login entry
 */
function exportBlueprint(url) {
    backgroundPage.getBlueprintStorageAccess().exportBlueprint(url);
}

/**
 * Trigger function for import of blueprint
 */
function importBlueprint() {
    // TODO
}

/**
 * Deletes the blueprint for the given url
 * @param url Website of blueprint
 */
function deleteBlueprint(url) {
    let box = window.confirm(browser.i18n.getMessage("delete_blueprint_warning", url));
    if (box === true) {
        let removeResult = backgroundPage.getBlueprintStorageAccess().removeBlueprint(url);
        if (removeResult)
            browser.tabs.reload();
    }
}
