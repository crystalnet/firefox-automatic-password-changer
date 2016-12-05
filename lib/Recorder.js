/*
 This is the recorder class that can be used for recording blaupausen
 */
var URL = require('sdk/url').URL;
var tabs = require('sdk/tabs');
var ffpwm = require("sdk/passwords");
var {Ci} = require('chrome');
var {viewFor} = require("sdk/view/core");
var window = viewFor(require("sdk/windows").browserWindows[0]);
var Hashtable = require('lib/Hashtable');
var cm = require("sdk/context-menu");
var self = require("sdk/self");

module.exports = function Recorder() {
    // variables
    var orderNumber = 0;
    var oldURL = "";
    var url = "";
    var mainWindow;
    var IsActive = false;
    var userWebPath;
    var webPage = "";
    var savedInFFPWM = false;
    var existingLogin = false;
    var pwList = null;
    var submitSeen = false;

    // information for passwordmanager
    var password = "";
    var username = "";
    var form = null;
    var passwordField = "";
    var usernameField = "";
    var formSubmitURL = "";
    var formActiveURL = "";
    var RecordingMenu;
    var worker;
    var Logout = null;
    var PWInfo = "";

    // flags
    var newPasswordFieldSet = false;
    var newPasswordFieldID = "";
    var newPasswordFieldName = "";
    var actualPasswordFieldSet = false;
    var UsernameEmailFieldSet = false;
    var usernameFieldID = "";
    var passwordFieldID = "";

    this.testhook = {
        getMainPageFromLink: getMainPageFromLink,
        countAllChildrenOfType: countAllChildrenOfType,
        onClick: onClickEventHandler,
        onSubmit: onSubmitEventHandler,
        setMessageValues: setMessageValues,
        injectUserWebPath: function (value) {
            userWebPath = value;
        },
        injectWindow: function (value) {
            window = value;
        },
        injectTabs: function (value) {
            tabs = value;
        },
        extractSubmitBranch: function () {
            return {
                usernameSet: UsernameEmailFieldSet,
                actualPasswordSet: actualPasswordFieldSet,
                newPasswordSet: newPasswordFieldSet
            }
        },
        resetSubmitSeen: function(){
            submitSeen = false;
        }
    };
    // start logging and add listener
    this.StartRecording = function () {

        // is recording now
        IsActive = true;

        //new Hashtable
        userWebPath = new Hashtable();

        //active url
        var url = URL(tabs.activeTab.url);

        mainWindow = window
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIWebNavigation)
            .QueryInterface(Ci.nsIDocShellTreeItem).rootTreeItem
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindow);

        //get passwords from PM
        GetpasswordList();

        //event fires when url changes
        mainWindow.getBrowser().addEventListener("DOMContentLoaded", GetActiveURL, false);

        //build a contextmenu and attach the right script to it
        buildContextmenu();
        //TODO looks like manual changing password is still implemented but actually masked
        //Input event are not user in this version of this addon
        /*
         window.addEventListener('input', logInput=function (e) {
         // read inputs and ids of input elements
         var doc = window.content.document;
         if(doc != null){

         var id = "";

         if(e.target.name == ""){
         id = e.target.id;
         var data = doc.getElementById(id);
         }
         else{
         id = e.target.name;
         var data = doc.getElementsByName(id)[0];
         }

         console.log(data.value);

         userWebPath.setItem(orderNumber,[id,tabs.activeTab.url,data.value,data.type,"Input"]);

         //This will be the key in hashtable in simple-storage
         webPage = getMainPageFromLink(tabs.activeTab.url);

         console.log(userWebPath.length);
         orderNumber++;
         }
         }, false);
         */
        // eventlistener for submit events
        window.addEventListener('submit', onSubmit, false);

        // eventlistener for clickevent
        window.addEventListener('click', onClickEventHandler, false);

    };

    function onSubmitEventHandler(e) {
        if (submitSeen) {
            submitSeen = false;
            return;
        }
        submitSeen = true;
        //get form of event
        form = e.target;

        //get all inputs of form
        //TODO: elem never used
        //var elem = form.getElementsByTagName("Input");
        var numOfPWFields = 0;

        // Set webpage -> will be the key in simple-storage for this Hashtable
        if (webPage == "")
            webPage = getMainPageFromLink(tabs.activeTab.url);

        //how many passwordfields does the form contain?
        numOfPWFields = countAllChildrenOfType(form, "password");

        // JUST FOR DEBUGGING
        /*
         console.log("######actualPasswordFieldSet = " + actualPasswordFieldSet);
         console.log("######UsernameEmailFieldSet = " + UsernameEmailFieldSet);
         console.log("######newPasswordFieldSet = " + newPasswordFieldSet);
         console.log("######passwortField = " + passwordField);
         console.log("######passwordFieldID = " + passwordFieldID);
         console.log("######usernameField = " + usernameField);
         console.log("######usernameFieldID = " + usernameFieldID);
         */

        //TODO: there is no action for combinations: (actual,username,new),(!actual,username,new). Check if they can happen in actual environment.
        // if actual password and username fields are set,
        if (actualPasswordFieldSet && UsernameEmailFieldSet && !newPasswordFieldSet) {
            userWebPath.setItem(orderNumber, [form.id, form.name, tabs.activeTab.url, form.action, passwordField, passwordFieldID, usernameField, usernameFieldID, "SubmitLogin"]);
            actualPasswordFieldSet = false;
            UsernameEmailFieldSet = false;
            username = window.content.document.getElementsByName(usernameField)[0].value;
            PWInfo = "";
            orderNumber++;
        }
        //if actual password  field is set only
        else if (actualPasswordFieldSet && !UsernameEmailFieldSet && !newPasswordFieldSet) {
            userWebPath.setItem(orderNumber, [form.id, form.name, tabs.activeTab.url, form.action, passwordField, passwordFieldID, "", "", "SubmitLogin"]);
            actualPasswordFieldSet = false;
            PWInfo = "";
            orderNumber++;
        }
        //if username field is set only
        else if (!actualPasswordFieldSet && UsernameEmailFieldSet && !newPasswordFieldSet) {
            console.log("this is a part of a login form with 010");
            userWebPath.setItem(orderNumber, [form.id, form.name, tabs.activeTab.url, form.action, "", "", usernameField, usernameFieldID, "SubmitLogin"]);
            UsernameEmailFieldSet = false;
            username = form.getElementsByName(usernameField)[0].value;
            console.log("username ist nun " + username);
            console.log("mit dem namen  " + usernameField);
            PWInfo = "";
            orderNumber++;
        }
        //if actual password  and new password fields are set
        else if (actualPasswordFieldSet && !UsernameEmailFieldSet && newPasswordFieldSet) {
            userWebPath.setItem(orderNumber, [form.id, form.name, tabs.activeTab.url, form.action, numOfPWFields, PWInfo, "SubmitPWChange"]);
            PWInfo = "";
            orderNumber++;
            actualPasswordFieldSet = false;
            newPasswordFieldSet = false;
            console.log(getLastPasswordEntry(form));
            console.log("newPasswordFieldName = " + newPasswordFieldName);
            console.log("form.getElementsByName(newPasswordFieldName)[0].value; = " + window.content.document.getElementsByName(newPasswordFieldName)[0].value);


            // get new password
            if (newPasswordFieldID != "") {
                password = window.content.document.getElementById(newPasswordFieldID).value;
            }
            else if (newPasswordFieldName != "") {
                password = window.content.document.getElementsByName(newPasswordFieldName)[0].value;
            }
            else {
                password = getLastPasswordEntry(form);
            }
            console.log("passwort ist nun" + password);
            console.log("mit dem Namen " + newPasswordFieldName);

        }
        //if new password  field is set only
        else if (!actualPasswordFieldSet && !UsernameEmailFieldSet && newPasswordFieldSet) {

            userWebPath.setItem(orderNumber, [form.id, form.name, tabs.activeTab.url, form.action, newPasswordFieldName, newPasswordFieldID, numOfPWFields, PWInfo, "SubmitPWChange"]);
            newPasswordFieldSet = false;
            if (newPasswordFieldID != "")
                password = window.content.document.getElementById(newPasswordFieldID).value;
            else if (newPasswordFieldName != "")
                password = window.content.document.getElementsByName(newPasswordFieldName).value;
            else
                password = getLastPasswordEntry(form);
            console.log("passwort ist nun" + password);
            console.log("mit dem Namen " + newPasswordFieldName);
            //TODO: orderNumber increase, reset of PwInfo and fields is done in each "if" --> do at the bottom
            PWInfo = "";
            orderNumber++;
        }
        //if no field is set
        else if (!actualPasswordFieldSet && !UsernameEmailFieldSet && !newPasswordFieldSet) {
            if (Logout == null) {
                userWebPath.setItem(orderNumber, [form.id, form.name, tabs.activeTab.url, form.action, "Submit"]);
            }
            else {
                userWebPath.setItem(orderNumber, [Logout[1], Logout[2], Logout[3], tabs.activeTab.url, Logout[4], Logout[0]]);
                Logout = null;
            }

            orderNumber++;

        }
        // TODO verify that the different behavior for onClickEventHandler and onSubmitEventHandler regarding submitSeen is correct.
        submitSeen = false;
        console.log("webpathlength " + userWebPath.length);

        // for debugging only
        /*
         console.log("passwordField = " + passwordField);
         console.log("password = " + password);
         console.log("usernameField = " + usernameField);
         console.log("username = " + username);
         console.log("active url = " + formActiveURL);
         console.log("formAction = " + formSubmitURL);
         */
    };

    function onClickEventHandler(e) {
        if (e.target.type != "submit") {

            var tempHash = CleanUpHashtable(userWebPath);

            // maybe it is a logout
            if (Logout == null) {
                userWebPath.setItem(orderNumber, [tabs.activeTab.url, e.clientX, e.clientY, window.innerHeight, window.innerWidth, window.content.document.documentElement.scrollTop, "Click"]);
            }
            else {
                for (var i = 0; i < Logout.length; i++) {
                    console.log("Das ist logout mit " + Logout[i]);
                }
                userWebPath.setItem(orderNumber, [Logout[1], Logout[2], Logout[3], tabs.activeTab.url, Logout[4], Logout[0]]);
                Logout = null;
            }

            orderNumber++;
        }
        else if (e.target.type == "submit") {
            if (submitSeen) {
                submitSeen = false;
                return;
            }
            submitSeen = true;
            form = e.target.form;
            // TODO: not truly duplicates. differences will be marked with TODO #dif
            // This part of code is duplicate of submit eventlistener because sometimes submit event is not fired on submit but clickevent
            //TODO: elem not used
            // var elem = form.getElementsByTagName("Input");
            var numOfPWFields = 0;

            //TODO: remove duplicate code
            if (webPage == "")
                webPage = getMainPageFromLink(tabs.activeTab.url);

            // Set webpage -> will be the key in simple-storage for this Hashtable
            if (webPage == "")
                webPage = getMainPageFromLink(tabs.activeTab.url);

            // console.log("elements= " + elem.length);

            //how many passwordfields does the form contain?
            numOfPWFields = countAllChildrenOfType(form, "password");
            // TODO #dif : this check is missing in onSubmit
            if (numOfPWFields == 0) {
                return;
            }
            //for debugging only
            /*
             console.log("######actualPasswordFieldSet = " + actualPasswordFieldSet);
             console.log("######UsernameEmailFieldSet = " + UsernameEmailFieldSet);
             console.log("######newPasswordFieldSet = " + newPasswordFieldSet);
             console.log("######passwortField = " + passwordField);
             console.log("######passwordFieldID = " + passwordFieldID);
             console.log("######usernameField = " + usernameField);
             console.log("######usernameFieldID = " + usernameFieldID);
             */

            if (actualPasswordFieldSet && UsernameEmailFieldSet && !newPasswordFieldSet) {
                userWebPath.setItem(orderNumber, [form.id, form.name, tabs.activeTab.url, form.action, passwordField, passwordFieldID, usernameField, usernameFieldID, "SubmitLogin"]);

                actualPasswordFieldSet = false;
                UsernameEmailFieldSet = false;
                username = window.content.document.getElementsByName(usernameField)[0].value;
                PWInfo = "";
                orderNumber++;
            }
            else if (actualPasswordFieldSet && !UsernameEmailFieldSet && !newPasswordFieldSet) {

                userWebPath.setItem(orderNumber, [form.id, form.name, tabs.activeTab.url, form.action, passwordField, passwordFieldID, "", "", "SubmitLogin"]);
                actualPasswordFieldSet = false;
                PWInfo = "";
                orderNumber++;
            }
            else if (UsernameEmailFieldSet && !actualPasswordFieldSet && !newPasswordFieldSet) {

                userWebPath.setItem(orderNumber, [form.id, form.name, tabs.activeTab.url, form.action, "", "", usernameField, usernameFieldID, "SubmitLogin"]);
                UsernameEmailFieldSet = false;
                username = form.getElementsByName(usernameField)[0].value;
                PWInfo = "";
                orderNumber++;
            }
            else if (actualPasswordFieldSet && newPasswordFieldSet && !UsernameEmailFieldSet) {

                userWebPath.setItem(orderNumber, [form.id, form.name, tabs.activeTab.url, form.action, numOfPWFields, PWInfo, "SubmitPWChange"]);
                PWInfo = "";
                orderNumber++;
                actualPasswordFieldSet = false;
                newPasswordFieldSet = false;


                if (newPasswordFieldID != "") {
                    password = window.content.document.getElementById(newPasswordFieldID).value;
                }
                else if (newPasswordFieldName != "") {
                    password = window.content.document.getElementsByName(newPasswordFieldName)[0].value;
                }
                else {
                    password = getLastPasswordEntry(form);
                }
                console.log("passwort ist nun" + password);
                console.log("mit dem Namen " + newPasswordFieldName);

            }
            else if (newPasswordFieldSet && !actualPasswordFieldSet && !UsernameEmailFieldSet) {
                userWebPath.setItem(orderNumber, [form.id, form.name, tabs.activeTab.url, form.action, newPasswordFieldName, newPasswordFieldID, numOfPWFields, PWInfo, "SubmitPWChange"]);
                newPasswordFieldSet = false;
                if (newPasswordFieldID != "") {
                    password = window.content.document.getElementById(newPasswordFieldID).value;
                }
                else if (newPasswordFieldName != "") {
                    password = window.content.document.getElementsByName(newPasswordFieldName)[0].value;
                }
                else {
                    password = getLastPasswordEntry(form);
                }
                console.log("passwort ist nun" + password);
                console.log("mit dem Namen " + newPasswordFieldName);
                PWInfo = "";
                orderNumber++;
            }
            else if (!newPasswordFieldSet && !actualPasswordFieldSet && !UsernameEmailFieldSet) {

                userWebPath.setItem(orderNumber, [form.id, form.name, tabs.activeTab.url, form.action, "Submit"]);

                if (Logout != null) {
                    for (var i = 0; i < Logout.length; i++) {
                        console.log("Das ist logout mit " + Logout[i]);
                    }
                    userWebPath.setItem(orderNumber, [Logout[1], Logout[2], Logout[3], tabs.activeTab.url, Logout[4], Logout[0]]);
                    Logout = null;
                }
                orderNumber++;
            }

            console.log("webpathlength " + userWebPath.length);
        }

    };

    // stops logging actions and remove all listener
    // returns a blueprint as hashtable
    this.StopRecording = function () {
        IsActive = false;
        //TODO: orderNumber is reset twice
        orderNumber = 0;
        var resultPath;
        destroyContextmenu();
        mainWindow.getBrowser().removeEventListener("DOMContentLoaded", GetActiveURL, false);
        //window.removeEventListener('input',logInput,false); not needed in this version
        window.removeEventListener('click', onClickEventHandler, false);
        window.removeEventListener('submit', onSubmitEventHandler, false);

        if (userWebPath != null) {
            userWebPath = CleanUpHashtable(userWebPath);

            userWebPath.each(function (k, v) {
                console.log('key is: ' + k + ', value is: ' + v);
            });

            // store password in password manager
            storePasswordToFFPWManager(formActiveURL, username, password, passwordField, usernameField, formSubmitURL);
        }
        resultPath = userWebPath;

        // clear all variables
        orderNumber = 0;
        oldURL = "";
        url = "";
        mainWindow;
        IsActive = false;
        userWebPath = null;
        savedInFFPWM = false;
        existingLogin = false;
        pwList = null;
        password = "";
        username = "";
        form = null;
        passwordField = "";
        usernameField = "";
        formSubmitURL = "";
        formActiveURL = "";
        newPasswordFieldSet = false;
        newPasswordFieldName = "";
        newPasswordFieldID = "";
        passwordFieldID = "";
        actualPasswordFieldSet = false;
        UsernameEmailFieldSet = false;
        UsernameEmailFieldID = "";
        Logout = null;
        return resultPath;
    };

    //public read only
    // returns true = recording
    // returns false = inactive
    this.RecorderIsActive = function () {
        return IsActive;
    };

    //public read only
    //returns webpage -> on this webpage we want to change pw
    this.GetWebPage4PWChange = function () {
        // TODO: this is not readonly, but read only once! check if "webPage" should really be reset.
        var webPage4Change = webPage;
        webPage = "";

        return webPage4Change;
    };

    // Cleans up the hashtable
    // removes duplicates: if user types in a textbox every char is a new entry. But least only last value is needed
    // removes no needed websites: if user searches in google we need only the page of interest
    function CleanUpHashtable(hash) {
        var result = new Hashtable();
        var i = 0;
        var oldVal = 'undefined';
        var oldval2 = 'undefined';
        hash.each(function (k, v) {
            if ((v[0] != oldVal) || (v[1] != oldval2)) {
                oldVal = v[0];
                oldval2 = v[1];
                result.setItem(i, v);
                i++;
            }
            else {
                result.setItem(i - 1, v);
            }
        });

        while (result.getItem(result.length - 1)[result.getItem(result.length - 1).length - 1] == "Click") {
            result.removeItem(result.length - 1);
        }

        //remove last click when user stops recording
        //  result.removeItem(result.length - 1);

        return result;
    }


    // gets active url and stores in blueprint-hashtable as a sitechange event
    function GetActiveURL() {
        var newURL = tabs.activeTab.url;
        submitSeen = false;
        if (oldURL != newURL) {
            console.log('active: ' + tabs.activeTab.url);
            oldURL = tabs.activeTab.url;

            //userWebPath.setItem(orderNumber,[tabs.activeTab.url,"SiteChange"]);
            //orderNumber++;
        }
    }

    // gets a basis url from link
    // returns example: https://www.facebook.com/settings/password -> https://www.facebook.com
    function getMainPageFromLink(link) {
        var pathArray = link.split('/');
        var protocol = pathArray[0];
        var host = pathArray[2];
        url = protocol + '//' + host;
        return url;
    }

    // this function searches recursively elements with certain type in nodes and childnodes
    // node = html elemnt as start element
    // type = type of element that will counted
    // returns number of elements of type in childelements of node
    function countAllChildrenOfType(node, type) {
        //TODO: use jquery for this?
        var result = 0;
        if (node.hasChildNodes()) {
            for (var i = 0; i < node.childNodes.length; i++) {
                var newNode = node.childNodes[i];
                result += countAllChildrenOfType(newNode, type);
            }
        }
        else if (node.type == type) {
            return result + 1;
        }
        return result;
    }

    // this function searches recursively elements with certain type in nodes and childnodes
    // node = html elemnt as start element
    // returns last entered text to a password field
    function getLastPasswordEntry(node) {
        var result = "";
        if (node.hasChildNodes()) {
            for (var i = 0; i < node.childNodes.length; i++) {
                var newNode = node.childNodes[i];
                var temp;

                temp = getLastPasswordEntry(newNode);

                if (temp != "")
                    result = temp;
            }
        }
        else if (node.type == "password") {
            return node.value;
        }
        return result;
    }

    /*
     stores new password to firefox password manager
     url: url of login form
     username: username of login
     password: password of login
     passwordField: name-attribute-value of passwordfield
     usernameField: name-attribute-value of usernameField
     formSubmitURL: action-attribute-value of login form
     */
    function storePasswordToFFPWManager(url, username, password, passwordField, usernameField, formSubmitURL) {

        // check if all params are valid before store password
        if ((passwordField == "") || (password == "") || (usernameField == "") || (username == "") || (formActiveURL == "") || (formSubmitURL == "")) {
            return;
        }

        var pwExists = false;
        var oldPW;
        for (var i = 0; i < pwList.length; i++) {
            console.log("if " + pwList.getItem(i)[0] + " == " + getMainPageFromLink(url) + " && " + pwList.getItem(i)[2] + " == " + username);
            if ((pwList.getItem(i)[2] == getMainPageFromLink(url)) && (pwList.getItem(i)[0] == username)) {
                pwExists = true;
                oldPW = pwList.getItem(i)[1];
            }
        }

        // save new Login
        // if login exists -> delete the old one and store the new -> else store the new
        if (pwExists) {
            require("sdk/passwords").remove({
                url: getMainPageFromLink(url),
                formSubmitURL: formSubmitURL,
                username: username,
                usernameField: usernameField,
                password: oldPW,
                passwordField: passwordField,
                onComplete: function onComplete() {
                    require("sdk/passwords").store({
                        url: getMainPageFromLink(url),
                        formSubmitURL: formSubmitURL,
                        username: username,
                        usernameField: usernameField,
                        password: password,
                        passwordField: passwordField
                    })
                },
                onError: function onError() {
                    console.log("kein login gefunden mit username " + username + " und url = " + getMainPageFromLink(url));
                }
            });
        }
        else {
            require("sdk/passwords").store({
                url: getMainPageFromLink(url),
                formSubmitURL: formSubmitURL,
                username: username,
                usernameField: usernameField,
                password: password,
                passwordField: passwordField
            });
        }
    }

    // saves all login entries of password manager in a hashtable
    // necessary because reading from pm is asyncronous -> much faster to work with hashtable than pm
    function GetpasswordList() {
        pwList = new Hashtable();
        var i = 0;
        require("sdk/passwords").search({
            onComplete: function onComplete(credentials) {
                credentials.forEach(function (credential) {
                    console.log(credential.username);
                    console.log(credential.password);

                    var temp = [credential.username, credential.password, credential.url, credential.usernameField, credential.passwordField, credential.formSubmitURL];

                    pwList.setItem(i, temp);
                    i++;
                });
            }
        });
    }

    // adds dynamically new entries to the context menu
    function buildContextmenu() {
        RecordingMenu = cm.Menu({
            label: "Markieren als:",
            contentScriptFile: self.data.url("ContextMenuScript.js"),
            onMessage: function (m) {
                console.log("thats the event" + m[0]);

                setMessageValues(m);
                sendDataToWorker(m);
            },
            items: [
                cm.Item({label: "Benutzername/Email", data: "BE1"}),
                cm.Item({label: "Aktuelles Passwort", data: "AP2"}),
                cm.Item({label: "Neues Passwort", data: "NP3"}),
                //cm.Item({ label: "Logout-Knopf", data: "Logout" })
            ]
        });
    }

    // setting of parameters when a input field is marked via context menu
    function setMessageValues(m) {
        switch (m[0]) {
            case "BE1":
                if (usernameField == "")
                    usernameField = m[4];
                if (usernameFieldID == "")
                    usernameFieldID = m[3];
                if (formSubmitURL == "")
                    formSubmitURL = m[6];
                if (formActiveURL == "")
                    formActiveURL = tabs.activeTab.url;
                console.log("wir sind im BE1 block und usernamebalabal ist nun true");
                UsernameEmailFieldSet = true;
                break;
            case "AP2":
                if (passwordField == "")
                    passwordField = m[4];
                //TODO: move all field sets to bottom of case
                actualPasswordFieldSet = true;
                if (formSubmitURL == "")
                    formSubmitURL = m[6];
                if (formActiveURL == "")
                    formActiveURL = tabs.activeTab.url;
                if (passwordFieldID == "")
                    passwordFieldID = m[3];
                PWInfo = PWInfo + "A";
                break;
            case "NP3":
                PWInfo = PWInfo + "N";
                if (newPasswordFieldName == "")
                    newPasswordFieldName = m[4];
                if (newPasswordFieldID == "")
                    newPasswordFieldID = m[3];
                if (formSubmitURL == "")
                    formSubmitURL = m[6];
                if (formActiveURL == "")
                    formActiveURL = tabs.activeTab.url;
                newPasswordFieldSet = true;
                break;
            case "Logout":
                console.log("logout ist nun = " + m);
                Logout = m;
                break;
        }
    }

    // sends data that comes from contextmenuscript to recorderspagecontentscript for highlighting inputfields
    function sendDataToWorker(m) {
        worker = tabs.activeTab.attach({
            contentScriptFile: self.data.url("RecorderPageContentScript.js")
        });

        worker.port.emit("ContextMenuClick", m);
    }

    // destroys added entries from contextmenu again
    function destroyContextmenu() {
        RecordingMenu.destroy();
    }
};