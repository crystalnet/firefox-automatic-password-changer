let backgroundPage;

(function init() {
    // get background page to access the port to the legacy add-on and blueprintStorageAccess
    let gettingBackgroundPage = browser.runtime.getBackgroundPage();
    gettingBackgroundPage.then(initDone, null);
})();

function initDone(page) {
    backgroundPage = page;
    // we use a port here, because getting the content from the password manager takes
    // too long and as a result, a call to sendMessage() would not handle the response
    let portToLegacyAddOn = browser.runtime.connect({name: 'connection-to-legacy-from-accountlistHandler'});
    portToLegacyAddOn.onMessage.addListener(function (message) {
        if (message.type === 'LoginCredentials')
        // we got the necessary information from the legacy add-on, so now we can build the account list
            buildAccountList(message.content, Object.keys(backgroundPage.getBlueprintStorageAccess().getAllBlueprints().items));
        // port is no longer needed
        portToLegacyAddOn.disconnect();
    });
    // get all stored login credentials (list of [username, url])
    portToLegacyAddOn.postMessage({
        type: 'getLoginCredentials'
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
    let accountList = $('#accountList');
    accountList.accordion({
        collapsible: true,
        active: false,
        heightStyle: 'content',
        beforeActivate: function (event, ui) {
            return !ui.newHeader.hasClass('unused-blueprint');
        }
    });
    // style import button and add listener
    $(document.getElementById('label_import_blueprints')).button({
        label: browser.i18n.getMessage('btn_import_blueprints')
    });
    document.getElementById('import_blueprints').addEventListener('change', importBlueprints, false);
    // set correct title
    let title = document.getElementById('title_accountlist');
    title.innerHTML = browser.i18n.getMessage('title_accountlist');
    // set correct heading
    let heading_accountList = document.getElementById('heading_accountlist');
    heading_accountList.innerHTML = browser.i18n.getMessage('heading_accountlist');
    // make everything visible
    $('#content').css('visibility', 'visible');
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
            listToDisplay.push(['', blueprintKeys[i]]);
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
    let hasAccountEntry = name !== '';
    let accountList = document.getElementById('accountList');

    let itemHeader = document.createElement('H3');
    let itemContent = document.createElement('DIV');
    itemContent.setAttribute('id', 'ID_' + url);

    if (hasAccountEntry) {
        // account entry from password manager
        itemHeader.innerHTML = '&nbsp<b>' + browser.i18n.getMessage('page') + '</b>: ' + url + '&nbsp&nbsp&nbsp<b>' + browser.i18n.getMessage('user') + '</b>: ' + name;
        if (blueprintExists) {
            let $changeBtn = $(document.createElement('DIV')).button({
                label: browser.i18n.getMessage('change_password_now_automatically')
            }).on('click', function () {
                changeThisPasswordAut(url, name);
            });
            let $createPathBtn = $(document.createElement('DIV')).button({
                label: browser.i18n.getMessage('change_password_now_manually')
            }).on('click', function () {
                // navigateToChangePW(url);
                openPasswordChangeDialog(url, name);
            });
            $(itemContent).append($changeBtn)
                .append($createPathBtn);
        }
        // always show "Record Blueprint" button for an account entry
        let $recordBtn = $(document.createElement('DIV')).button({
            label: browser.i18n.getMessage('record_blueprint_btn')
        }).on('click', function () {
            startRecording(url);
        });
        $(itemContent).append($recordBtn);
    } else {
        // blueprint entry without associated account information
        itemHeader.classList.add('unused-blueprint');
        itemHeader.innerHTML = '&nbsp<b>' + browser.i18n.getMessage('page') + '</b>: ' + url + '&nbsp&nbsp<i>' + browser.i18n.getMessage('no_login_data') + '</i>';
    }

    if (blueprintExists) {
        itemHeader.classList.add('has-blueprint');
        itemContent.classList.add('has-blueprint');

        let $exportBtn = $(document.createElement('DIV')).button({
            icon: 'ui-icon-disk',
            showLabel: false
        }).addClass('blueprint-dependent export-blueprint-button').click(function (event) {
            // stop bubbling of click event to prevent opening or collapsing of accordion section
            event.stopPropagation();
            exportBlueprint(url);
        }).prop('title', browser.i18n.getMessage('export-blueprint-tooltip'));
        $exportBtn.tooltip();

        let $deleteBtn = $(document.createElement('DIV')).button({
            icon: 'ui-icon-trash',
            showLabel: false
        }).addClass('blueprint-dependent delete-blueprint-button').click(function (event) {
            // stop bubbling of click event to prevent opening or collapsing of accordion section
            event.stopPropagation();
            deleteBlueprint(url);
        }).prop('title', browser.i18n.getMessage('delete-blueprint-tooltip'));
        $deleteBtn.tooltip();

        $(itemHeader).append($exportBtn)
            .append($deleteBtn);
    } else {
        itemHeader.classList.add('no-blueprint');
        itemContent.classList.add('no-blueprint');
    }

    accountList.appendChild(itemHeader);
    accountList.appendChild(itemContent);
}



function openPasswordChangeDialog(url, username) {
    try {
        $('#manual-password-change-dialog-form').find('#url').val(url);

        $('#manual-password-change-dialog-form').dialog({
            height: 670,
            width: 630,
            modal: true,
            close: function () {
                form[0].reset();
                //allFields.removeClass('ui-state-error');
            }
        });

        const form = $('#manual-password-change-dialog-form').find('form').on('submit', function (event) {
            event.preventDefault();
        });

        // const blueprint = backgroundPage.getBlueprintStorageAccess().getBlueprint(url);
        const blueprint2 =  [{'version': 1, 'scope': ['github.com', 'www.github.com'], 'changeProcedure': [{'action' : 'Click', 'parameters' : [1052,33,736,1366,0,'https://github.com/','true']}, {'action' : 'Input', 'parameters' : ['U',5,2,'https://github.com/login']}, {'action' : 'Input', 'parameters' : ['C',5,3,'https://github.com/login']}, {'action' : 'Click', 'parameters' : [684,355,736,1366,0,'https://github.com/login','true']}, {'action' : 'Click', 'parameters' : [1141,28,736,1366,0,'https://github.com/','false']}, {'action' : 'Click', 'parameters' : [1033,304,736,1366,0,'https://github.com/','true']}, {'action' : 'Click', 'parameters' : [236,172,736,1366,0,'https://github.com/settings/profile','false']}, {'action' : 'Input', 'parameters' : ['C',20,9,'https://github.com/settings/admin']}, {'action' : 'Input', 'parameters' : ['N',20,10,'https://github.com/settings/admin']},{'action' : 'Input', 'parameters' : ['N',20,11,'https://github.com/settings/admin']}, {'action' : 'Click', 'parameters' : [520,388,736,1366,0,'https://github.com/settings/admin','true']}, {'action' : 'Click', 'parameters' : [1142,30,736,1366,0,'https://github.com/settings/admin','false']}, {'action' : 'Click', 'parameters' : [1043,329,736,1366,0,'https://github.com/settings/admin','true']}], 'pwdPolicy' : [{'allowedCharacterSets' : {'az' : 'abcdefghijklmnopqrstuvwxyz', 'AZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'num' : '0123456789', 'special' : '!@#$%^*._'}, 'minLength' : 7, 'maxLength' : 15, 'compositionRequirements' : [{'kind':'mustNot','num':5,'rule':{'description':'May not be the same as any of the 5 previous passwords used.','regexp':'^[password]'}},{'kind':'mustNot','num':1,'rule':{'description':'May not be the same as your username or contain your username.','regexp':'.*[username].*'}},{'kind':'mustNot','num':1,'rule':{'description':'The special character cannot be the first character in the password.','regexp':'^[special].*'}},{'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one number.', 'regexp' : '.*[num].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one special character.','regexp':'.*[special].*'}},{'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one lower case letter.', 'regexp' : '.*[az].*'}}]}]}];
        const data = JSON.stringify(blueprint2);
        const schema = '{"$schema":"http://json-schema.org/schema#","title":"Password Composition Policy","description":"Array of password policy descriptions for the automatic creation of new passwords, DRAFT 2017-02-10","id":"URI TBD","type":"array","items":{"type":"object","properties":{"allowedCharacterSets":{"type":"object","description":"The different sets of allowed characters. There are special charsets available to all policies: username (is filled with the username if available), emanresu (is filled with the reverse username if available), allASCII (represents all ASCII characters), allUnicode (represents all Unicode characters). The names of these special character sets must not be used by other charset definitions.","minProperties":1},"minLength":{"type":"number","description":"The minimum length of the password, if left out: assumed to be 1","minimum":1},"maxLength":{"type":"number","description":"The maximum length of the password, if left out: assumed to be infinite","minimum":1},"compositionRequirements":{"type":"array","description":"The list of composition requirements in this password policy. If left out: assumed that all character sets can be used in any combination.","items":{"type":"object","description":"Representations of composition requirements using rules (regexps) on the allowed character sets, which either must or must not be fulfilled by valid passwords.","required":["kind","num","rule"],"properties":{"kind":{"type":"string","enum":["must","mustNot"]},"num":{"type":"number"},"rule":{"type":"object","description":"The rule of this composition requirement as regexp.","properties":{"description":{"type":"string","description":"A textual description of the rule to display to the user in the UI."},"regexp":{"type":"string","description":"The actual regexp of the rule."}}}},"minItems":1,"uniqueItems":true}}}}}';
        let player = backgroundPage.createPlayer(data, schema);

        //open checkRequirements with empty password - adds list of requirements to dialog window
        let password = '';
        this.checkRequirements(password, player);

        let heading_url = document.getElementById('url-heading');
        heading_url.innerHTML = browser.i18n.getMessage('website');

        let heading_password = document.getElementById('heading_password');
        heading_password.innerHTML = browser.i18n.getMessage('new password');

        let heading_requirements = document.getElementById('requirementsHeading');
        heading_requirements.innerHTML = browser.i18n.getMessage('requirements');

        $('#changePasswordBtn').button({
            label: browser.i18n.getMessage('change_Password'),
            disabled: true
        }).on('click', function (){
            const newPassword = $('#new-password').val();
            changeThisPasswordAut(url, username, newPassword);
        });

        $('#generatePasswordBtn').button({
            label: browser.i18n.getMessage('generate_pwd')
        }).on('click', function () {

            let promise = Promise.resolve(player._invokePasswordGenerator());
            let cast = Promise.resolve(promise);
            cast.then(function(value){
                $('#manual-password-change-dialog-form').find('#new-password').val(value);
            });
        });


        $('#CancelBtn').button({
            label: browser.i18n.getMessage('cancel_dialog')
        }).on('click', function () {
            $('#manual-password-change-dialog-form').dialog('close');
        });

        function check(){
            let password = $('#new-password').val();
            checkRequirements(password, player);
        }

        //Hide/Show functionality for password
        let inputBar = $('#new-password');
        inputBar.focus(function(){
            inputBar.on('keyup', check);
        });

        inputBar.blur(function(){
            inputBar.off('keyup', check);
        });

        let togglePasswordField = document.getElementById('togglePasswordField');
        togglePasswordField.innerHTML = browser.i18n.getMessage('show-password');
        togglePasswordField.addEventListener('click', togglePasswordFieldClicked, false);

        $('#manual-password-change-dialog-form').dialog('option', 'title', browser.i18n.getMessage('manual-password-change'));
        $('#manual-password-change-dialog-form').removeAttr('style');
        $('#manual-password-change-dialog-form').dialog('open');
    } catch (e) {
        console.log(e);
    }
}

function togglePasswordFieldClicked() {
    let toggle = document.getElementById('togglePasswordField');
    let passwordField = document.getElementById('new-password');

    let message = browser.i18n.getMessage('show-password');
    if(toggle.innerHTML === message){
        passwordField.type = 'text';
        toggle.innerHTML = browser.i18n.getMessage('hide-password');
    } else{
        passwordField.type = 'password';
        toggle.innerHTML = browser.i18n.getMessage('show-password');
    }
}

function checkRequirements(password, player) {
    //deletes any values that are still in either requirementsNotSat or requirementsSat
    $('#requirementsNotSat').html('');
    $('#requirementsSat').html('');

    const checkedRequirements = player.validateUserPassword(password);
    let satisfied = checkedRequirements.sat;
    if (satisfied) {
        $('#changePasswordBtn').button('enable');
    } else if ($('#changePasswordBtn').hasClass('ui-button')) {
        $('#changePasswordBtn').button('disable');
    }

    let arrayOfFailedReqs = checkedRequirements.failReq;
    let failedList = '';
    for (let count = 0; count < arrayOfFailedReqs.length; count++) {
        let d = arrayOfFailedReqs[count];
        failedList += '<li>' + d + '</li>';
    }
    $('#requirementsNotSat').text(function () {
        $(this).append(failedList);
    });

    let arrayOfSatReqs = checkedRequirements.passReq;
    let satList = '';
    for (let count = 0; count < arrayOfSatReqs.length; count++) {
        let d = arrayOfSatReqs[count];
        satList += '<li>' + d + '</li>';
    }

    $('#requirementsSat').text(function () {
        $(this).append(satList);
    });


}


/**
 * Trigger function for automatic change password
 * @param url URL for a login entry
 * @param username Username for a login entry
 */
function changeThisPasswordAut(url, username, newPassword = '') {
    let box = window.confirm(browser.i18n.getMessage('acclmessage3'));
    if (box === true)
        backgroundPage.startImitation(username, url, newPassword);
}

/**
 * Trigger function for recording a new blueprint
 * @param url URL for a login entry
 */
function startRecording(url) {
    let box = window.confirm(browser.i18n.getMessage('acclmessage1', url));
    if (box === true) {
        let querying = browser.tabs.query({currentWindow: true, active: true});
        querying.then(function (tabs) {
            let creating = browser.tabs.create({
                url: url
            });
            creating.then(function () {
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
    let box = window.confirm(browser.i18n.getMessage('acclmessage4'));
    if (box === true) {
        let blueprint = backgroundPage.getBlueprintStorageAccess().getBlueprint(url);
        if (typeof blueprint !== 'undefined') {
            let pwChangeUrl = '';
            for (let i = 0; i < blueprint.length; i++) {
                let item = blueprint.getItem(i);
                if (item[1] === 'N') {
                    pwChangeUrl = item[4];
                    break;
                }
            }
            browser.tabs.create({
                url: pwChangeUrl
            });
        }
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
 * Trigger function for import of blueprints
 */
function importBlueprints(event) {
    backgroundPage.getBlueprintStorageAccess().importBlueprints(event.target.files);
    // reload account list, so the change is visible to the user
    browser.tabs.reload();
}

/**
 * Deletes the blueprint for the given url
 * @param url Website of blueprint
 */
function deleteBlueprint(url) {
    let box = window.confirm(browser.i18n.getMessage('delete_blueprint_warning', url));
    if (box === true) {
        let removeResult = backgroundPage.getBlueprintStorageAccess().removeBlueprint(url);
        if (removeResult)
        // reload account list, so the change is visible to the user
            browser.tabs.reload();
    }
}
