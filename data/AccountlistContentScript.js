/*
 This is the content script for the Accountlist.html
 */

let languageStrings = "";

self.port.on("startBuildingAccountlist", function (payload) {
    let pwHash = payload[0];
    let blueprintKeys = payload[1];
    buildAccountList(pwHash, blueprintKeys);
});

self.port.on("languageStrings", function handleMyMessage(myMessagePayload) {
    languageStrings = myMessagePayload;
});

self.port.on("closing", function () {
    Clear();
});

/**
 * this function builds the account list dynamically
 * @param pwHash hashtable with login-entries from the password manager
 * @param blueprintKeys keys of the blueprints
 */
function buildAccountList(pwHash, blueprintKeys) {
    console.log("start building account list");
    let listToDisplay = getListItems(pwHash, blueprintKeys);
    // now we can build the account list
    for (let i = 0; i < listToDisplay.length; i++) {
        let name = listToDisplay[i][0];
        let url = listToDisplay[i][1];
        console.log("name: " + name + ", url = " + url);
        let blueprintExists = blueprintKeys.indexOf(url) !== -1;
        addAccountSection(name, url, blueprintExists);
    }

    // style the account list
    $(function () {
        let accountList = $("#accountList");
        accountList.accordion({
            collapsible: true,
            active: false
        });
        let manageBlueprints = $("#btn_manage_blueprints").button({
            label: languageStrings["manage_blueprints"],
            icon: false
        });
        // make everything visible after styling is done
        accountList.css("visibility", "visible");
        manageBlueprints.css("visibility", "visible");
        $("#label_btn_manage_blueprints").css("visibility", "visible");
    });

    let manageBlueprints = document.getElementById("btn_manage_blueprints");
    // set initial visibility state
    manageBlueprints.classList.add("manage-options-hidden");
    manageBlueprints.addEventListener('click', function () {
        let accountList = $("#accountList");
        if (this.checked) {
            accountList.addClass('manage-options-visible');
            accountList.removeClass('manage-options-hidden');
        }
        else {
            accountList.addClass('manage-options-hidden');
            accountList.removeClass('manage-options-visible');
        }
    });

    let bpImport = document.getElementById("btn_import_blueprints");
    bpImport.innerHTML = languageStrings["btn_import_blueprints"];
    bpImport.addEventListener('click', function () {
        importBlueprint();
    });

    let title1 = document.getElementById("title_accountlist1");
    let heading_accountList = document.getElementById("heading_accountlist");
    title1.innerHTML = languageStrings["title_accountlist"];
    heading_accountList.innerHTML = languageStrings["heading_accountlist"];
}

/**
 * merge everything that should get an own entry into one list
 * @return {Array}
 */
function getListItems(accountInformationEntries, blueprintEntries) {
    let listToDisplay = [];
    for (let i = 0; i < accountInformationEntries.length; i++) {
        listToDisplay.push(accountInformationEntries.items[i]);
    }
    for (let i = 0; i < blueprintEntries.length; i++) {
        // check if pwHash contains blueprint URL
        let hasItem = false;
        for (let j = 0; j < accountInformationEntries.length; j++) {
            if (accountInformationEntries.items[j][1] === blueprintEntries[i]) {
                hasItem = true;
            }
        }
        if (!hasItem) {
            listToDisplay.push(["", blueprintEntries[i]]);
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
 * adds a section for an account to the account list
 * @param name username for a login entry
 * @param url url for a login entry
 * @param blueprintExists true if the blueprint is known
 */
function addAccountSection(name, url, blueprintExists) {
    let accountList = document.getElementById('accountList');
    if (accountList != null) {
        let itemHeader = document.createElement("H3");
        let itemContent = document.createElement("DIV");
        itemContent.setAttribute("id", "ID_" + url);

        if (blueprintExists) {
            // add class so we get to see a blueprint icon for this entry
            itemHeader.classList.add("has-blueprint");
            itemContent.classList.add("has-blueprint");
        }

        if (name !== "") {
            // account entry from password manager
            itemHeader.innerHTML = "&nbsp<b>" + languageStrings["page"] + "</b>: " + url + "&nbsp&nbsp&nbsp<b>" + languageStrings["user"] + "</b>: " + name;
            if (blueprintExists) {
                let $changeBtn = $(document.createElement("DIV")).button({
                    label: languageStrings["change_password_now_automatically"]
                }).on('click', function () {
                    changeThisPasswordAut(url, name);
                });
                let $createPathBtn = $(document.createElement("DIV")).button({
                    label: languageStrings["change_password_now_manually"]
                }).on('click', function () {
                    navigateToChangePW(url, name);
                });
                $(itemContent).append($changeBtn)
                    .append($createPathBtn);
            }
            // always show "Record Blueprint" button for an account entry
            let $recordBtn = $(document.createElement("DIV")).button({
                label: languageStrings["record_blueprint_btn"]
            }).on('click', function () {
                console.error("Record btn clicked");
                startRecording(url);
            });

            $(itemContent).append($recordBtn);
        } else {
            // blueprint entry without associated account information
            itemHeader.classList.add("unused-blueprint");
            itemHeader.innerHTML = "&nbsp<b>" + languageStrings["page"] + "</b>: " + url + "&nbsp&nbsp<i>" + languageStrings["no_login_data"] + "</i>";
        }

        if (blueprintExists) {
            let $exportBtn = $(document.createElement("DIV")).button({
                icon: "ui-icon-disk",
                showLabel: false
                // label: languageStrings["export_blueprint"]
            }).addClass("manage-option export-blueprint-button").click(function () {
                exportBlueprint(url);
            });
            let $deleteBtn = $(document.createElement("DIV")).button({
                icon: "ui-icon-trash",
                showLabel: false
                // label: languageStrings["delete_blueprint"]
            }).addClass("manage-option delete-blueprint-button").click(function () {
                deleteBlueprint(url);
            });
            $(itemHeader).append($exportBtn)
                .append($deleteBtn);
        }

        accountList.appendChild(itemHeader);
        accountList.appendChild(itemContent);
    }
}

/**
 * trigger function for automatic change password
 * @param url url for a login entry
 * @param username username for a login entry
 */
function changeThisPasswordAut(url, username) {
    window.alert(languageStrings["acclmessage3"]);
    console.log("changing password for username: " + username + " on website: " + url);
    self.port.emit("changePW", [url, username]);
}

/**
 * trigger function for recording new blueprint
 * @param url url for a login entry
 */
function startRecording(url) {
    // let message = languageStrings.format(languageStrings["acclmessage1"], url);
    let box = window.confirm("test"); // actually we would like to use message from one line above here
    if (box == true) {
        console.log("lets record for url: " + url);
        self.port.emit("startRecord", url);
    }
}

/**
 * trigger function for navigating user to the page in account where the changing form is located.
 * @param url url for a login entry
 * @param username username for a login entry
 */
function navigateToChangePW(url, username) {
    console.log("navigating to password change form");
    window.alert(languageStrings["acclmessage4"]);
    self.port.emit("Nav2ChangeForm", [url, username]);
}

/**
 * trigger function for export of blueprints
 * @param url url for a login entry
 */
function exportBlueprint(url) {
    console.log("blueprint for " + url + " is being exported");
    self.port.emit("ExportBP", url);
}

/**
 * trigger function for import of blueprint
 */
function importBlueprint() {
    console.log("import button clicked");
    self.port.emit("ImportBP");
}

/**
 * deletes the blueprint for the given url
 * @param url for website of blueprint
 */
function deleteBlueprint(url) {
    // let message = languageStrings.format(languageStrings["delete_blueprint_warning"], url);
    let box = window.confirm("test"); // actually we would like to use message from one line above here
    if (box == true) {
        console.log("deleting blueprint: " + url);
        self.port.emit("deleteBlueprint", url);
    }
}

/**
 * destroy all objects and Listener if needed
 */
function Clear() {

}
