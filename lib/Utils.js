/**
 * Some utility functions used by several other modules
 */

const Hashtable = require('lib/Hashtable');

/**
 * returns the first part of a link
 * for example, 'https://www.facebook.com/settings/password' results in  'https://www.facebook.com'
 * @param link
 * @return {string}
 */
exports.getMainPageFromLink = function(link) {
    if(link === "") return "";
    let pathArray = link.split('/');
    let protocol = pathArray[0];
    let host = pathArray[2];
    return protocol + '//' + host;
};

/**
 * removes a trailing slash from an URL if present
 * @param url
 * @return {*}
 */
exports.removeTrailingSlash = function(url) {
    let result = url;
    if(url.substring(url.length - 1) === "/")
        result =  url.substring(0, url.length - 1);
    return result;
};

/**
 * saves all logins in a hashtable
 * necessary because this process is asynchronous and can take much time
 * on the fly it is faster to work with a hashtable with logins than the password manager itself
 */
exports.getPasswordList = function() {
    let pwList = new Hashtable();
    let i = 0;
    require("sdk/passwords").search({
        onComplete: function onComplete(credentials) {
            credentials.forEach(function (credential) {
                let temp = [credential.username, credential.password, credential.url, credential.usernameField, credential.passwordField, credential.formSubmitURL];
                pwList.setItem(i, temp);
                i++;
            });
        }
    });
    return pwList;
};

/**
 * returns the current password for a given site and username
 * @param url
 * @param username
 * @param pwList
 * @return {*}
 */
exports.getCurrentPassword = function(url, username, pwList) {
    let password = null;
    pwList.each(function(key, value) {
        if(value[2] === url && value[0] === username) {
            password = value[1];
        }
    });
    return password;
};

exports.hasLoginForDomain = function(url, pwList) {
    let loginFound = false;
    pwList.each(function(key, value) {
        if(value[1] === url) {
            loginFound = true;
        }
    });
    return loginFound;
};

/**
 * stores new password to firefox password manager and replace old one if present
 * @param url url of login form
 * @param username username for login
 * @param password password for login
 * @param passwordField name-attribute-value of password field
 * @param usernameField name-attribute-value of usernameField
 * @param formSubmitURL action-attribute-value of login form
 * @param pwList
 */
exports.storePasswordToFFPWManager = function(url, username, password, passwordField, usernameField, formSubmitURL, pwList) {

    // check if all params are valid before store password
    if ((passwordField === "") || (password === "") || (usernameField === "") || (username === "") || (url === "")) {
        console.error("some params for storing new password are empty");
        return;
    }

    if(formSubmitURL === "")
    // as stated on the mozilla developer sites:
    // "If the form doesn't contain an "action" attribute, this property should match the url property."
        formSubmitURL = url;

    let pwExists = false;
    let oldPW = "";
    pwList.each(function(key, value) {
        if(value[2] === url && value[0] === username) {
            pwExists = true;
            oldPW = value[1];
        }
    });

    // TODO: make sure all variables that are used to store passwords are protected well enough. (e.g. not logged)
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
                    passwordField: passwordField,
                    onError: function() {
                        console.error("old password removed, but storing new one failed");
                    }
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
            passwordField: passwordField,
            onError: function() {
                console.error("storing new password failed");
            }
        });
    }
};

/**
 * Checks if two arrays are equal
 * @param a the first array
 * @param b the second array
 * @return {boolean}
 */
exports.arraysEqual = function arraysEqual(a,b){
    if (a === b)
        return true;
    if ((a == null || b == null) || (a.length !== b.length))
        return false;

    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
};