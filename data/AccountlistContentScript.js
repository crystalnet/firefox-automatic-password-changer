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
    // merge everything that should get an own entry into one list
    let listToDisplay = [];
    for (let i = 0; i < pwHash.length; i++) {
        listToDisplay.push(pwHash.items[i]);
    }
    for (let i = 0; i < blueprintKeys.length; i++) {
        // check if pwHash contains blueprint URL
        let hasItem = false;
        for (let j = 0; j < pwHash.length; j++) {
            if (pwHash.items[j][1] === blueprintKeys[i]) {
                hasItem = true;
            }
        }
        if (!hasItem) {
            listToDisplay.push(["",blueprintKeys[i]]);
        }
    }
    // sort list
    listToDisplay.sort(function (a, b) {
        // compare URLs
        return (a[1]).localeCompare(b[1]);
    });
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
            active: false,
            create: function () {
                $(".ui-accordion-header").each(function () {
                    if ($(this).hasClass("has-blueprint"))
                        // add class so we get to see a blueprint icon for this entry
                        $(this).find("span").addClass("has-blueprint");
                })
            }
        });
        $(".ui-accordion button").each(function(){
            let button = $(this);
            if(button.hasClass("export-blueprint-button")) {
                button.button({icon: "ui-icon-disk"});
            } else if(button.hasClass("delete-blueprint-button")) {
                button.button({icon: "ui-icon-trash"});
            } else {
                button.button();
            }
        });
        $("#btn_manage_blueprints").button({
            label: languageStrings["manage_blueprints"],
            icon: false
        });
        // make account list visible after styling is done
        accountList.css("visibility", "visible");
    });


    let manageBlueprintsSwitch = false;
    let manageBlueprints = document.getElementById("btn_manage_blueprints");
    manageBlueprints.addEventListener('click', function () {
        let accountList = $("#accountList");
        if (manageBlueprintsSwitch) {
            accountList.addClass('manage-options-hidden');
            accountList.removeClass('manage-options-visible');
            manageBlueprintsSwitch = false;
        }
        else {
            accountList.addClass('manage-options-visible');
            accountList.removeClass('manage-options-hidden');
            manageBlueprintsSwitch = true;
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
 * adds a section for an account to the account list
 * @param name username for a login entry
 * @param url url for a login entry
 * @param blueprintExists true if the blueprint is known
 */
function addAccountSection(name, url, blueprintExists) {
    let accountList = document.getElementById('accountList');
    if (accountList != null) {
        let h3 = document.createElement("H3");
        let div = document.createElement("DIV");
        div.setAttribute("id", "ID_" + url);

        let changeBtn, createPathBtn, recordBtn, exportBtn, deleteBtn;
        if(blueprintExists) {
            exportBtn = document.createElement("BUTTON");
            exportBtn.classList.add("manage-option", "export-blueprint-button");
            exportBtn.innerHTML = languageStrings["export_blueprint"];
            exportBtn.addEventListener('click', function () {
                exportBlueprint(url);
            });
            deleteBtn = document.createElement("BUTTON");
            deleteBtn.classList.add("manage-option", "delete-blueprint-button");
            deleteBtn.innerHTML = languageStrings["delete_blueprint"];
            deleteBtn.addEventListener('click', function () {
                deleteBlueprint(url);
            });
            // add class so we get to see a blueprint icon for this entry
            h3.classList.add("has-blueprint");
            div.classList.add("has-blueprint");
        }

        if(name !== "") {
            // account entry from password manager
            h3.innerHTML = "&nbsp<b>" + languageStrings["page"] + "</b>: " + url + "&nbsp&nbsp&nbsp<b>" + languageStrings["user"] + "</b>: " + name;
            if(blueprintExists) {
                changeBtn = document.createElement("BUTTON");
                changeBtn.innerHTML = languageStrings["change_password_now_automatically"];
                changeBtn.addEventListener('click', function () {
                    changeThisPasswordAut(url, name);
                });
                createPathBtn = document.createElement("BUTTON");
                createPathBtn.innerHTML = languageStrings["change_password_now_manually"];
                createPathBtn.addEventListener('click', function () {
                    navigateToChangePW(url, name);
                });
                div.appendChild(changeBtn);
                div.appendChild(createPathBtn);
            }
            // always show "Record Blueprint" button for an account entry
            recordBtn = document.createElement("BUTTON");
            recordBtn.innerHTML = languageStrings["record_blueprint_btn"];
            recordBtn.addEventListener('click', function () {
                console.error("Record btn clicked");
                startRecording(url);
            });
            div.appendChild(recordBtn);
            if(blueprintExists) {
                div.appendChild(exportBtn);
                div.appendChild(deleteBtn);
            }
        } else {
            // blueprint entry without associated account information
            h3.classList.add("unused-blueprint");
            h3.innerHTML = "&nbsp<b>" + languageStrings["page"] + "</b>: " + url + "&nbsp&nbsp<i>" + languageStrings["no_login_data"] + "</i>";
            div.appendChild(exportBtn);
            div.appendChild(deleteBtn);
        }
        accountList.appendChild(h3);
        accountList.appendChild(div);
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
