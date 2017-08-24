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
    }}
});

/**
 * Start recording
 */
(function startRecording() {
    registerEventHandlers();
})();

/**
 * Loads specification interface
 * @param inputField
 */
function loadSpecificationInterface(inputField) {
    let specificationDialog = $('#specificationDialog');
    if (specificationDialog.length) {
        $('#specifiactionDailog').dialog('open');
    } else {
        const url = browser.extension.getURL('/content-scripts/specificationDialog.htm');

        $.ajax({
            url: url,
            success: function (data) {
                initializeSpecifiactionDialog(data, inputField);
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
 * @param data
 * @param inputField
 */
function initializeSpecifiactionDialog(data, inputField) {
    // Append html containing dialog to body
    $('body').append(data);

    // Initialize and open dialog
    $('#specificationDialog').dialog({
        classes: {
            'ui-dialog': 'ui-dialog-no-close'
        },
        width: 400,
        height: 600,
        position: {my: 'left top', at: 'right top', of: inputField},
        buttons: [
            {
                text: 'OK',
                click: function () {
                    policyEntered(this);
                }
            }
        ]
    });

    // Initialize form elements
    $('.ui-dialog').appendTo('.pwdChanger');
    $('.ui-dialog-no-close .ui-dialog-titlebar-close').css('display', 'none');
    $('.ui-spinner-input').spinner();
    $('.ui-selectmenu').selectmenu();
    $('.ui-checkboxradio-input').checkboxradio();

    // Add button functionality
    const positionRestrictions = $('#positionRestrictions');
    positionRestrictions.hide();
    $('#showPositionRestrictions').click(function () {
        if (positionRestrictions.is(':visible')) {
            positionRestrictions.hide();
            $(this).html('More');
        } else {
            positionRestrictions.show();
            $(this).html('Less');
        }
    });

    $('#addPositionRestriction').click(function () {
        $(data).find('.positionRestrictionForm').clone().appendTo('#positionRestrictionsContainer');
        $('.ui-spinner-input').spinner();
        $('.ui-selectmenu').selectmenu();
    });
}

/**
 * TODO documentation
 * @param dialog
 */
function policyEntered(dialog) {
    let error = false;
    $('.pwdChanger .ui-state-error').removeClass('ui-state-error');

    // form validation
    let minLength = $('#minLength');
    if (!minLength.val()) {
        minLength.parent().addClass('ui-state-error');
        error = true;
    }

    let maxLength = $('#maxLength');
    if (!maxLength.val()) {
        maxLength.parent().addClass('ui-state-error');
        error = true;
    }

    let capitalAllowed = $('#capitalAllowed');
    let lowerAllowed = $('#lowerAllowed');
    let specialAllowed = $('#specialAllowed');
    let numberAllowed = $('#numberAllowed');

    if (error) {
        return false;
    }

    $(dialog).dialog('close');

    // Parse form restrictions
    let characterSetRestrictions = {};
    let positionRestrictions = [];
    $.each($('#characterSetRestrictionsForm').serializeArray(), function () {
        characterSetRestrictions[this.name] = this.value;
    });
    $.each($('.positionRestrictionForm'), function () {
        let restriction = {};
        $.each($(this).serializeArray(), function () {
            restriction[this.name] = this.value;
        });
        if (restriction.restrictionContent === 'specific') {
            restriction.restrictionContent = restriction.specificRestriction;
            delete restriction.specificRestriction;
        }
        positionRestrictions.push(restriction);
    });

    const policy = convertFormToPolicy(characterSetRestrictions, positionRestrictions);

    browser.runtime.sendMessage({
        type: 'policyEntered',
        policy: policy
    });
}

/**
 * Converts the entered restrictions to valid policies
 * @param characterSetRestrictions
 * @param positionRestrictions
 * @returns {{allowedCharacterSets: {}, minLength, maxLength, compositionRequirements: Array}}
 */
function convertFormToPolicy(characterSetRestrictions, positionRestrictions) {
    let policy = {
        allowedCharacterSets: {},
        minLength: characterSetRestrictions.minLength,
        maxLength: characterSetRestrictions.maxLength,
        compositionRequirements: []
    };

    if (characterSetRestrictions.lowerAllowed) {
        policy.allowedCharacterSets.az = characterSetRestrictions.lowerSet;
    }

    if (characterSetRestrictions.capitalAllowed) {
        policy.allowedCharacterSets.AZ = characterSetRestrictions.capitalSet;
    }

    if (characterSetRestrictions.numberAllowed) {
        policy.allowedCharacterSets.num = characterSetRestrictions.numberSet;
    }

    if (characterSetRestrictions.specialAllowed) {
        policy.allowedCharacterSets.special = characterSetRestrictions.specialSet;
    }

    if (characterSetRestrictions.minLower) {
        let requirement = {
            kind: 'must',
            num: characterSetRestrictions.minLower,
            rule: {
                description: 'Must contain at least ' + characterSetRestrictions.minLower + ' lower case letters.',
                regexp: '.*[az].*'
            }
        };
        policy.compositionRequirements.push(requirement);
    }

    if (characterSetRestrictions.minCapital) {
        let requirement = {
            kind: 'must',
            num: characterSetRestrictions.minCapital,
            rule: {
                description: 'Must contain at least ' + characterSetRestrictions.minCapital + ' upper case letters.',
                regexp: '.*[AZ].*'
            }
        };
        policy.compositionRequirements.push(requirement);
    }

    if (characterSetRestrictions.minNumber) {
        let requirement = {
            kind: 'must',
            num: characterSetRestrictions.minNumber,
            rule: {
                description: 'Must contain at least ' + characterSetRestrictions.minNumber + ' numbers.',
                regexp: '.*[num].*'
            }
        };
        policy.compositionRequirements.push(requirement);
    }

    if (characterSetRestrictions.minSpecial) {
        let requirement = {
            kind: 'must',
            num: characterSetRestrictions.minSpecial,
            rule: {
                description: 'Must contain at least ' + characterSetRestrictions.minSpecial + ' special characters.',
                regexp: '.*[special].*'
            }
        };
        policy.compositionRequirements.push(requirement);
    }

    // Translate position restrictions
    for (let restriction of positionRestrictions) {
        let requirement = {
            kind: restriction.restrictionType,
            num: 1
        };

        if (restriction.restrictionType === 'must') {
            requirement.rule = {
                description: 'Position ' + restriction.restrictionPosition + ' must be ' + restriction.restrictionContent,
                regexp: '.*[' + restriction.restrictionContent + '].*'
            };
        } else {
            requirement.rule = {
                description: 'Position ' + restriction.restrictionPosition + ' must not be ' + restriction.restrictionContent,
                regexp: '.*^[' + restriction.restrictionContent + '].*'
            };
        }
        policy.compositionRequirements.push(requirement);
    }
    return policy;
}

/**
 * Handles click events
 */
function onClickEventHandler(event) {
    // ignore right button click and events triggered by javascript
    if (event.button === 0 && (event.clientX !== 0 || event.clientY !== 0)) {
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
    browser.runtime.sendMessage({
        type: 'blurHappened',
        webPage: window.content.location.href,
        scrollTop: document.documentElement.scrollTop,
        nodeNumber: nodeNumber,
        inputsLength: inputs.length,
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