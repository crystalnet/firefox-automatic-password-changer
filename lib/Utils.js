/**
 * Some utility functions used by several other modules
 */

var Hashtable = require('lib/Hashtable');

/*
 returns the first part of a link
 example: https://www.facebook.com/settings/password -> https://www.facebook.com
*/
exports.getMainPageFromLink = function(link) {
    var pathArray = link.split('/');
    var protocol = pathArray[0];
    var host = pathArray[2];
    return protocol + '//' + host;
};

/*
 this function waits for milliseconds
 necessary for not triggering an detection abuse mechanism on websites
*/
exports.sleep = function(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
};

/*
 removes a trailing slash from an URL if present
*/
exports.removeTrailingSlash = function(url) {
    var result = url;
    if(url.substring(url.length - 1) === "/")
        result =  url.substring(0, url.length - 1);
    return result;
};

/*
 saves all logins in a hashtable
 necessary because this process is asyncronous and can take much time
 on the fly it is faster to work with a hashtable with logins than the passwordmanager itself
*/
exports.getPasswordList = function() {
    var pwList = new Hashtable();
    var i = 0;
    require("sdk/passwords").search({
        onComplete: function onComplete(credentials) {
            credentials.forEach(function (credential) {
                var temp = [credential.username, credential.password, credential.url, credential.usernameField, credential.passwordField, credential.formSubmitURL];
                pwList.setItem(i, temp);
                i++;
            });
        }
    });
    return pwList;
};

/*
 returns the current password for a given site and username
*/
exports.getCurrentPassword = function(url, username, pwList) {
    var password = null;
    pwList.each(function(key, value) {
        if(value[2] === url && value[0] === username) {
            password = value[1];
        }
    });
    return password;
};

/*
 stores new password to firefox password manager and replace old one if present
 url: url of login form
 username: username for login
 password: password for login
 passwordField: name-attribute-value of password field
 usernameField: name-attribute-value of usernameField
 formSubmitURL: action-attribute-value of login form
*/
exports.storePasswordToFFPWManager = function(url, username, password, passwordField, usernameField, formSubmitURL, pwList) {

    // check if all params are valid before store password
    if ((passwordField === "") || (password === "") || (usernameField === "") || (username === "") || (url === "")) {
        return;
    }

    if(formSubmitURL === "")
    // as stated on the mozilla developer sites:
    // "If the form doesn't contain an "action" attribute, this property should match the url property."
        formSubmitURL = url;

    var pwExists = false;
    var oldPW = "";
    pwList.each(function(key, value) {
        if(value[2] === url && value[0] === username) {
            pwExists = true;
            oldPW = value[1];
        }
    });

    // TODO: make sure all variables that are used to store passwords are protected well enough. Check if there exist more log entries.
    // save new Login
    // if login exists -> delete the old one and store the new -> else store the new
    if (pwExists) {
        require("sdk/passwords").remove({
            url: url,
            formSubmitURL: formSubmitURL,
            username: username,
            usernameField: usernameField,
            password: oldPW,
            passwordField: passwordField,
            onComplete: function() {
                require("sdk/passwords").store({
                    url: url,
                    formSubmitURL: formSubmitURL,
                    username: username,
                    usernameField: usernameField,
                    password: password,
                    passwordField: passwordField
                })
            },
            onError: function() {
                console.error("old password exists, but removing failed");
            }
        });
    }
    else {
        require("sdk/passwords").store({
            url: url,
            formSubmitURL: formSubmitURL,
            username: username,
            usernameField: usernameField,
            password: password,
            passwordField: passwordField
        });
    }
};
