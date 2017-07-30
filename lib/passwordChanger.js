/*
 This ist the main source file for the addon
 */

// addon-sdk
const webExtension = require('sdk/webextension');

// own classes and variables
const Hashtable = require('lib/Hashtable');
let pwHash = new Hashtable();

webExtension.startup().then(api => {
    const {browser} = api;
    browser.runtime.onConnect.addListener((port) => {
        port.onMessage.addListener(function(message) {
            switch (message.type) {
            case 'getLoginDomains':
                getLoginInformation(true, port);
                break;
            case 'getLoginCredentials':
                getLoginInformation(false, port);
                break;
            case 'getSingleLoginCredential':
                getSingleLoginInformation(message.username, message.url, port, message.newPassword);
                break;
            case 'refreshPasswordList':
                refreshPasswordList();
                break;
            case 'setPassword':
                if (typeof message.oldLoginData !== 'undefined') {
                        // imitator case
                    storePasswordToFFPWManager(port, message.sender, message.loginData, message.oldLoginData);
                } else {
                        // recorder case
                    storePasswordToFFPWManager(port, message.sender, message.loginData);
                }
                break;
            }
        });
    });
});

/**
 * Stores a login credential in the password manager
 * @param port The port to the embedded WebExtensions add-on for informing about the result
 * @param sender Identifies whether recorder or imitator want to store a password
 * @param credentialToStore The login credential to store
 * @param oldData The old login credential to overwrite (optional)
 */
function storePasswordToFFPWManager(port, sender, credentialToStore, oldData = null) {
    // check if all params are valid before storing password
    if (credentialToStore.passwordField === '' || credentialToStore.password === ''
        || credentialToStore.usernameField === '' || credentialToStore.username === ''
        || credentialToStore.url === '') {
        port.postMessage({
            type: 'storePassword',
            status: 'Error',
            errorCode: 'missingInformation',
            receiver: sender
        });
        return;
    }
    if(credentialToStore.formSubmitURL === '')
        // as stated on the mozilla developer sites:
        // "If the form doesn't contain an "action" attribute, this property should match the url property."
        credentialToStore.formSubmitURL = credentialToStore.url;

    let removeOldCredentialFirst = false;
    let credentialToOverwrite;
    if (oldData !== null) {
        removeOldCredentialFirst = true;
        credentialToOverwrite = oldData;
    } else {
        pwHash.each(function(key, value) {
            if(value[2] === credentialToStore.url && value[0] === credentialToStore.username) {
                removeOldCredentialFirst = true;
                credentialToOverwrite = {username: value[0], password: value[1], url: value[2], usernameField: value[3], passwordField: value[4], formSubmitURL: value[5]};
            }
        });
    }
    // save new credential
    // if credential exists, delete the old one and store the new, as the store operation
    // does not replace an existing credential, but instead doesn't store anything
    if (removeOldCredentialFirst) {
        require('sdk/passwords').remove({
            url: credentialToOverwrite.url,
            formSubmitURL: credentialToOverwrite.formSubmitURL,
            username: credentialToOverwrite.username,
            usernameField: credentialToOverwrite.usernameField,
            password: credentialToOverwrite.password,
            passwordField: credentialToOverwrite.passwordField,
            onComplete: function() {
                require('sdk/passwords').store({
                    url: credentialToStore.url,
                    formSubmitURL: credentialToStore.formSubmitURL,
                    username: credentialToStore.username,
                    usernameField: credentialToStore.usernameField,
                    password: credentialToStore.password,
                    passwordField: credentialToStore.passwordField,
                    onError: function() {
                        port.postMessage({
                            type: 'storePassword',
                            status: 'Error',
                            errorCode: 'storingFailedOldRemoved',
                            receiver: sender
                        });
                    },
                    onComplete: function() {
                        port.postMessage({
                            type: 'storePassword',
                            status: 'Success',
                            receiver: sender
                        });
                    }
                });
            },
            onError: function() {
                port.postMessage({
                    type: 'storePassword',
                    status: 'Error',
                    errorCode: 'removingOldCredentialFailed',
                    receiver: sender
                });
            }
        });
    }
    else {
        require('sdk/passwords').store({
            url: credentialToStore.url,
            formSubmitURL: credentialToStore.formSubmitURL,
            username: credentialToStore.username,
            usernameField: credentialToStore.usernameField,
            password: credentialToStore.password,
            passwordField: credentialToStore.passwordField,
            onError: function() {
                port.postMessage({
                    type: 'storePassword',
                    status: 'Error',
                    errorCode: 'storingFailed',
                    receiver: sender
                });
            },
            onComplete: function() {
                port.postMessage({
                    type: 'storePassword',
                    status: 'Success',
                    receiver: sender
                });
            }
        });
    }
}

/**
 * Stores all currently saved credentials as a hash table in the pwHash variable
 */
function refreshPasswordList() {
    pwHash.clear();
    require('sdk/passwords').search({
        onComplete: function onComplete(credentials) {
            credentials.forEach(function (credential) {
                let temp = [credential.username, credential.password, credential.url, credential.usernameField, credential.passwordField, credential.formSubmitURL];
                pwHash.setItem(pwHash.length, temp);
            });
        }
    });
}

function getLoginInformation(domainsOnly, port) {
    require('sdk/passwords').search({
        onComplete: function (credentials) {
            let result = [];
            let answerType;
            if (domainsOnly) {
                answerType = 'LoginDomains';
                credentials.forEach(function (credential) {
                    result.push(credential.url);
                });
                // remove duplicate entries
                result = Array.from(new Set(result));
            } else {
                answerType = 'LoginCredentials';
                credentials.forEach(function (credential) {
                    result.push([credential.username, credential.url]);
                });
            }
            port.postMessage({
                type: answerType,
                content: result
            });
        }
    });
}

function getSingleLoginInformation(username, url, port, newPassword) {
    require('sdk/passwords').search({
        username: username,
        url: url,
        onComplete: function (credentials) {
            credentials.forEach(function (credential) {
                // should only be one result
                port.postMessage({
                    type: 'SingleLoginCredential',
                    url: url,
                    username: username,
                    newPassword: newPassword,
                    credential: {username: credential.username, password: credential.password, url: credential.url, usernameField: credential.usernameField, passwordField: credential.passwordField, formSubmitURL: credential.formSubmitURL}
                });
            });
        }
    });
}