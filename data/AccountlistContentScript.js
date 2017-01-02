/*
 This is the content script for the Accountlist.html
 */

let languageStrings = "";

self.port.on("startBuildingAccountlist", function (pwHash) {
    buildAccountlist(pwHash);
});

self.port.on("languageStrings", function handleMyMessage(myMessagePayload) {
    languageStrings = myMessagePayload;
});

self.port.on("NoChangeWay", function (url) {
    let box = window.confirm(languageStrings["acclmessage1"]);
    if (box == true) {
        startRecording(url);
    }
    else if (box == false) {
    }
});

self.port.on("closing", function () {
    Clear();
});

/**
 * this function builds the acount list dynamically
 * @param pwHash hashtable with login-entries from the password manager
 */
function buildAccountlist(pwHash) {

    console.log("start building account list");
    for (let i = 0; i < pwHash.length; i++) {
        let name = pwHash.items[i][0];
        let url = pwHash.items[i][1];
        console.log("name: " + name + ", url = " + url);
        addAccountSection(name, url);
    }
    $(function () {
        $("#accordion").accordion();
    });

    // these two buttons are fix but they need an event listener
    let bpButton = document.getElementById("btn_show_blueprints");
    bpButton.innerHTML = languageStrings["btn_show_blueprints"];

    let bpImport = document.getElementById("btn_import_blueprints");
    bpImport.innerHTML = languageStrings["btn_import_blueprints"];

    bpButton.addEventListener('click', function () {
        openBlueprints();
    });
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
 */
function addAccountSection(name, url) {

    let accord = document.getElementById('accordion');

    if (accord != null) {
        let h3 = document.createElement("H3");
        let div = document.createElement("DIV");
        let p1 = document.createElement("P");
        let p2 = document.createElement("P");
        let deleteBtn = document.createElement("BUTTON");
        let changeBtn = document.createElement("BUTTON");
        let createPathBtn = document.createElement("BUTTON");
        let exportBtn = document.createElement("BUTTON");

        // adding labels to elements
        h3.innerHTML = languageStrings["page"] + ": " + url + " || " + languageStrings["user"] + ": " + name;

        div.setAttribute("id", "ID" + url);

        p1.innerHTML = languageStrings["user"] + ": " + name;
        //p2.innerHTML = "Passwort: " + password;
        p2.innerHTML = languageStrings["url"] + ": " + url;
        deleteBtn.innerHTML = languageStrings["delete_entry"];
        changeBtn.innerHTML = languageStrings["change_password_now_automatically"];
        createPathBtn.innerHTML = languageStrings["change_password_now_manually"];
        exportBtn.innerHTML = languageStrings["export_blueprint"];
        //adding onClick functions
        deleteBtn.addEventListener('click', function () {
            deleteThisEntry(url, name);
        });
        changeBtn.addEventListener('click', function () {
            changeThisPasswordAut(url, name);
        });
        createPathBtn.addEventListener('click', function () {
            navigateToChangePW(url, name);
        });
        exportBtn.addEventListener('click', function () {
            exportBlueprint(url);
        });


        div.appendChild(p1);
        div.appendChild(p2);
        div.appendChild(deleteBtn);
        div.appendChild(changeBtn);
        div.appendChild(createPathBtn);
        div.appendChild(exportBtn);

        accord.appendChild(h3);
        accord.appendChild(div);
    }
}

/**
 * trigger function for deleting entry from persistent storage and password manager
 * @param url url for a login entry
 * @param username username for a login entry
 */
function deleteThisEntry(url, username) {

    window.alert(languageStrings["acclmessage2"]);
    console.log("deleting entry : " + url + " " + username);
    self.port.emit("deleteThisEntry", [url, username]);
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
    console.log("lets record for url: " + url);
    self.port.emit("startRecord", url);
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
 * trigger function for export of blueprint
 * @param url url for a login entry
 */
function exportBlueprint(url) {
    console.log("blueprint for " + url + " is being exported");
    self.port.emit("ExportBP", url);
}

/**
 * trigger function for opening of blueprint
 */
function openBlueprints() {
    console.log("openBlueprints");
    self.port.emit("OpenBlueprints");
}

/**
 * trigger function for import of blueprint
 */
function importBlueprint() {
    console.log("import button clicked");
    self.port.emit("ImportBP");
}

/**
 * destroy all objects and Listener if needed
 */
function Clear() {

}
