/**
 * This is the content script injected into a tab on recording.
 * It handles the necessary event listeners, which are used to send the
 * information required for recording to the recorder background script
 */

// we use lodash's throttle function, because the scroll event is fired extensively during scrolling of
// a page and we don't need to send the current scrollTop position to the background code each time
let throttle = _.throttle(onScrollEventHandler, 200, {leading: false, trailing: true});

/**
 * Listens for messages from the background code
 */
browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // handle the message sent from background code after user clicked a context menu item
    // as the message from the background code is sent shortly after clicking the context menu item,
    // the "node" variable stores a reference to the element the user invoked the context menu on
    switch (request.type) {
    case 'label': {
        let inputs = document.getElementsByTagName('input');
        inputs[request.inputNumber].addEventListener('blur', onBlurEventHandler, false);

        if (request.label === 'N' && request.policyEntered === false) {
            loadSpecificationInterface(inputs[request.inputNumber]);
        }
        break;
    }
    case 'getWebPage': {
        sendResponse({webPage: window.content.location.href});
        break;
    }
    case 'stopRecording': {
        stopRecording();
        break;
    }
    }
});

/**
 * Start recording
 */
(function startRecording() {
    registerEventHandlers();
})();

/**
 * Loads specification interface from the htm file and triggers its initialization
 * @param inputField (DOM Element) to which the dialog belongs
 */
function loadSpecificationInterface(inputField) {
    let specificationDialog = $('#specificationDialog');
    if (specificationDialog.length) {
        specificationDialog.dialog('open');
    } else {
        const url = browser.extension.getURL('/content-scripts/specificationDialog.htm');

        $.ajax({
            url: url,
            success: function (data) {
                initializeSpecificationDialog(data, inputField);
            },
            error: function (error) {
                console.log(error);
            },
            dataType: 'html'
        });
    }
}

/**
 * Initialize specification dialog
 * @param data (HTML) html code containing the dialog
 * @param inputField (DOM Element) input field to which the dialog aligns
 */
function initializeSpecificationDialog(data, inputField) {
    // Append html containing dialog to body
    $('body').append(data);

    // Language specific content

    //Tabs
    $('#general').html(browser.i18n.getMessage('general-tab'));
    $('#position-restrictions').html(browser.i18n.getMessage('position-restrictions-tab'));
    $('#character-sets').html(browser.i18n.getMessage('character-sets-tab'));
    $('#custom-regexp').html(browser.i18n.getMessage('custom-regexp-tab'));

    $('#lengthLegend').html(browser.i18n.getMessage('length-legend'));

    $('label.minimum').html(browser.i18n.getMessage('minimum'));
    $('label.maximum').html(browser.i18n.getMessage('maximum'));

    $('#characterSetLegend').html(browser.i18n.getMessage('characterset-legend'));
    $('#capitalAllowedLabel').html(browser.i18n.getMessage('capital-allowed'));

    $('#lowercaseLetters').html(browser.i18n.getMessage('lowercase-letters'));
    $('#lowercaseAllowedLabel').html(browser.i18n.getMessage('lowercase-allowed'));


    $('#numbersAllowedLabel').html(browser.i18n.getMessage('numbers-allowed'));


    $('#specialsAllowedLabel').html(browser.i18n.getMessage('special-allowed'));
    $('#usernameAllowedLabel').html(browser.i18n.getMessage('username-not-allowed'));
    $('#whitespaceLabel').html(browser.i18n.getMessage('whitespace-allowed'));
    $('#unicodeLabel').html(browser.i18n.getMessage('unicode-allowed'));

    $('#posResHeader').html(browser.i18n.getMessage('position-specific'));
    $('#showPositionRestrictions').html(browser.i18n.getMessage('show-position-restrictions'));
    $('#showCustomRestrictions').html(browser.i18n.getMessage('show-custom-regexp'));
    $('#positionLabel').html(browser.i18n.getMessage('position'));
    $('#addPositionRestriction').html(browser.i18n.getMessage('add-Restriction'));
    $('#general-legend').html(browser.i18n.getMessage('general'));
    $('#characterset-legend').html(browser.i18n.getMessage('allowed-character-sets'));
    $('#addRes-legend').html(browser.i18n.getMessage('additional-Restrictions'));
    //Character Set Labels
    $('#lowerSetLabel').html(browser.i18n.getMessage('lowerSetLabel'));
    $('#capitalSetLabel').html(browser.i18n.getMessage('capitalSetLabel'));
    $('#numberSetLabel').html(browser.i18n.getMessage('numberSetLabel'));
    $('#specialSetLabel').html(browser.i18n.getMessage('specialSetLabel'));


    // Custom RegEx Block
    $('#customRestrictionExplanation').html(browser.i18n.getMessage('custom-RegEx-Intro'));
    $('#customRes-legend').html(browser.i18n.getMessage('custom-Restrictions'));
    $('#customRegExLabel').html(browser.i18n.getMessage('custom-RegEx'));
    $('#customRegExDescLabel').html(browser.i18n.getMessage('custom-desc'));
    $('#addCustomRestriction').html(browser.i18n.getMessage('add-more-custom-Res'));

    //select options
    $('#mustNotBeOption').html(browser.i18n.getMessage('must-not-be'));
    $('#mustBeOption').html(browser.i18n.getMessage('must-be'));
    $('#capitalOption').html(browser.i18n.getMessage('capital-letter'));
    $('#lowercaseOption').html(browser.i18n.getMessage('lowercase-letter'));
    $('#numberOption').html(browser.i18n.getMessage('number'));
    $('#specialOption').html(browser.i18n.getMessage('special-characters'));
    $('#specificOption').html(browser.i18n.getMessage('specific'));

    $('#specificRestriction').attr('placeholder', browser.i18n.getMessage('specific-character'));
    // Initialize and open dialog
    $('#specificationDialog').dialog({
        classes: {
            'ui-dialog': 'ui-dialog-no-close'
        },
        width: 620,
        position: {my: 'left top', at: 'right top', of: inputField, collision: 'none'},
        title: browser.i18n.getMessage('password-specification'),
        buttons: [
            {
                text: browser.i18n.getMessage('save-password-policy'),
                click: function () {
                    policyEntered(this);
                }
            }
        ],
        resize: function (event, ui) {
            if (ui.size.height < 0) {
                $(this).dialog({height: ui.originalSize.height});
                $(this).dialog({width: ui.size.width});
            }
            $(this).dialog({position: {my: 'left top', at: 'right top', of: inputField, collision: 'none'}});
        }
    });

    // Initialize form elements
    $('.ui-dialog').appendTo('.pwdChanger');
    $('.ui-dialog-no-close .ui-dialog-titlebar-close').css('display', 'none');
    $('.ui-dialog-title').html('&#9664; <img src="' + browser.extension.getURL('/images/icons/icon-16.png') + '"/> ' + browser.i18n.getMessage('password-specification'));
    $('#tabsContainer').tabs();
    $('.ui-spinner-input').spinner();
    $('.ui-selectmenu').selectmenu();
    $('.ui-checkboxradio-input').checkboxradio();
    $('.ui-checkboxradio-input.check').attr('checked', 'checked');
    $('.ui-checkboxradio-input').checkboxradio('refresh');
    $('.controlgroup').controlgroup();

    $('#addPositionRestriction').click(function () {
        let clone = $(data).find('.positionRestrictionForm').clone();

        // the clone() function clones the original form, without the custom language so we need to change them again
        clone.find('#positionLabel').html(browser.i18n.getMessage('position'));
        clone.find('#mustNotBeOption').html(browser.i18n.getMessage('must-not-be'));
        clone.find('#mustBeOption').html(browser.i18n.getMessage('must-be'));
        clone.find('#capitalOption').html(browser.i18n.getMessage('capital-letter'));
        clone.find('#lowercaseOption').html(browser.i18n.getMessage('lowercase-letter'));
        clone.find('#numberOption').html(browser.i18n.getMessage('number'));
        clone.find('#specialOption').html(browser.i18n.getMessage('special-characters'));
        clone.find('#specificOption').html(browser.i18n.getMessage('specific'));
        clone.find('#specificRestriction').attr('placeholder', browser.i18n.getMessage('specific-character'));

        clone.appendTo('#positionRestrictionsContainer');
        $('.ui-spinner-input').spinner();
        $('.ui-selectmenu').selectmenu();
        $('.controlgroup').controlgroup();
    });

    $('#addCustomRestriction').click(function () {
        let clone = $(data).find('.customRestrictionForm').clone();

        clone.find('#customRegExLabel').html(browser.i18n.getMessage('custom-RegEx'));
        clone.find('#customRegExDescLabel').html(browser.i18n.getMessage('custom-desc'));

        clone.appendTo('#customRegExpContainer');

        $('.ui-spinner-input').spinner();
        $('.ui-selectmenu').selectmenu();
    });
}

/**
 * Parses the dialog form into a blueprint and sends it to the recorder
 * @param dialog (DOM Element) the dialog on the page
 */
function policyEntered(dialog) {
    $('.pwdChanger .ui-state-error').removeClass('ui-state-error');

    let minLength = $('#minLength');
    if (!minLength.val()) {
        minLength.val(1);
    }

    let maxLength = $('#maxLength');
    if (!maxLength.val()) {
        maxLength.val(32);
    }

    let capitalAllowed = $('#capitalAllowed');
    let lowerAllowed = $('#lowerAllowed');
    let specialAllowed = $('#specialAllowed');
    let numberAllowed = $('#numberAllowed');

    $(dialog).dialog('close');

    // Parse form restrictions
    let lengthRestrictions = {};
    let characterRestrictions = {};
    let characterSets = {};
    let advancedRestrictions = {};
    let positionRestrictions = [];
    let customRestrictions = [];
    $.each($('#lengthForm').serializeArray(), function () {
        lengthRestrictions[this.name] = this.value;
    });
    $.each($('#characterRestrictionsForm').serializeArray(), function () {
        characterRestrictions[this.name] = this.value;
    });
    $.each($('#characterSetsForm').serializeArray(), function () {
        characterSets[this.name] = this.value;
    });
    $.each($('#advancedRestrictionsForm').serializeArray(), function () {
        advancedRestrictions[this.name] = this.value;
    });
    $.each($('.positionRestrictionForm'), function () {
        let restriction = {};
        $.each($(this).find('form').serializeArray(), function () {
            restriction[this.name] = this.value;
        });
        if (restriction.restrictionContent === 'specific') {
            restriction.restrictionContent = restriction.specificRestriction;
            delete restriction.specificRestriction;
        }
        positionRestrictions.push(restriction);
    });
    $.each($('.customRestrictionForm'), function () {
        let restriction = {};
        $.each($(this).find('form').serializeArray(), function () {
            restriction[this.name] = this.value;
        });
        customRestrictions.push(restriction);
    });

    browser.runtime.sendMessage({
        type: 'createPolicy',
        lengthRestrictions: lengthRestrictions,
        characterRestrictions: characterRestrictions,
        characterSets: characterSets,
        positionRestrictions: positionRestrictions,
        customRestrictions: customRestrictions,
        advancedRestrictions: advancedRestrictions
    });
}

/**
 * Handles click events
 */
function onClickEventHandler(event) {
    // ignore right button click and events triggered by javascript
    if (event.button === 0 && (event.clientX !== 0 || event.clientY !== 0) && !$(event.target).parents('.pwdChanger').length) {
        browser.runtime.sendMessage({
            type: 'clickHappened',
            webPage: window.content.location.href,
            scrollTop: document.documentElement.scrollTop,
            clientX: event.clientX,
            clientY: event.clientY,
            innerHeight: window.content.innerHeight,
            innerWidth: window.content.innerWidth
        });
    }
}

/**
 * Handles scroll events
 */
function onScrollEventHandler() {
    browser.runtime.sendMessage({
        type: 'scrollHappened',
        scrollTop: document.documentElement.scrollTop
    });
}

/**
 * Handles blur events
 */
function onBlurEventHandler(event) {
    let node = event.target;
    // nodeNumber is the position of the node inside the collection of all
    // input elements; we use this number to identify the node on the page
    let nodeNumber;
    let inputs = document.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].isSameNode(node)) {
            nodeNumber = i;
            break;
        }
    }
    let numberOfInputs = inputs.length;
    const dialog = $('#specificationDialog');
    if (dialog.length) {
        const ignorerdInputs = dialog.find('input').length;
        numberOfInputs -= ignorerdInputs;
    }

    browser.runtime.sendMessage({
        type: 'blurHappened',
        webPage: window.content.location.href,
        scrollTop: document.documentElement.scrollTop,
        nodeNumber: nodeNumber,
        inputsLength: numberOfInputs,
        nodeFormAction: node.form.action,
        nodeValue: node.value,
        nodeName: node.name
    });
}

/**
 * Stop logging actions and remove all listener
 */
function stopRecording() {
    document.removeEventListener('click', onClickEventHandler, true);
    document.removeEventListener('scroll', throttle, false);
    Array.prototype.forEach.call(document.getElementsByTagName('input'), function (node) {
        node.removeEventListener('blur', onBlurEventHandler, false);
    });
}

/**
 * registers all necessary event handlers on the document object of the window
 */
function registerEventHandlers() {
    // we use event capturing phase for click events, because some elements cancel event bubbling
    // this way we don't need special cases for single elements
    document.addEventListener('click', onClickEventHandler, true);
    document.addEventListener('scroll', throttle, false);
}