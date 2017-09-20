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
    $('#lengthLegend').html(browser.i18n.getMessage('length-legend'));

    $('label.minimum').html(browser.i18n.getMessage('minimum'));
    $('label.maximum').html(browser.i18n.getMessage('maximum'));

    $('#characterSetLegend').html(browser.i18n.getMessage('characterset-legend'));
    $('#capitalAllowedLabel').html(browser.i18n.getMessage('capital-allowed'));

    $('#lowercaseLetters').html(browser.i18n.getMessage('lowercase-letters'));
    $('#lowercaseAllowedLabel').html(browser.i18n.getMessage('lowercase-allowed'));


    $('#numbersAllowedLabel').html(browser.i18n.getMessage('numbers-allowed'));


    $('#specialsAllowedLabel').html(browser.i18n.getMessage('special-allowed'));
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
    $('.ui-dialog-title').html('&#9664; <img src="' + browser.extension.getURL('/images/icons/icon-16.png') + '"/> ' +  browser.i18n.getMessage('password-specification'));
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
    let length = {};
    let characterRestrictions = {};
    let characterSets = {};
    let advancedRestrictions = {};
    let positionRestrictions = [];
    let customRestrictions = [];
    $.each($('#lengthForm').serializeArray(), function () {
        length[this.name] = this.value;
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
        $.each($(this).serializeArray(), function () {
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
        $.each($(this).serializeArray(), function () {
            restriction[this.name] = this.value;
        });
        customRestrictions.push(restriction);
    });

    const policy = convertFormToPolicy(length, characterRestrictions, characterSets, positionRestrictions, customRestrictions, advancedRestrictions);

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
function convertFormToPolicy(length, characterRestrictions, characterSets, positionRestrictions, customRestrictions, advancedRestrictions) {

    let policy = {
        allowedCharacterSets: {},
        minLength: parseInt(length.minLength),
        maxLength: parseInt(length.maxLength),
        compositionRequirements: []
    };

    if (characterRestrictions.lowerAllowed) {
        policy.allowedCharacterSets.az = characterSets.lowerSet;

        let requirement = {
            kind: 'must',
            num: parseInt(characterRestrictions.minLower),
            rule: {
                description: 'Must contain at least ' + characterRestrictions.minLower + ' lower case letters.',
                regexp: '.*[az].*'
            }
        };
        policy.compositionRequirements.push(requirement);

    } else {
        let setRequirement = {
            kind: 'mustNot',
            num: 0,
            rule: {
                description:  '[az]',
                regexp: '.*'+ '[az]' +'.*'
            }
        };
        policy.compositionRequirements.push(setRequirement);

    }

    if (characterRestrictions.capitalAllowed) {
        policy.allowedCharacterSets.AZ = characterSets.capitalSet;

        let requirement = {
            kind: 'must',
            num: parseInt(characterRestrictions.minCapital),
            rule: {
                description: 'Must contain at least ' + characterRestrictions.minCapital + ' upper case letters.',
                regexp: '.*[AZ].*'
            }
        };
        policy.compositionRequirements.push(requirement);

    } else {
        let setRequirement = {
            kind: 'mustNot',
            num: 0,
            rule: {
                description:  '[AZ]',
                regexp: '.*'+ '[AZ]' +'.*'
            }
        };
        policy.compositionRequirements.push(setRequirement);
    }

    if (characterRestrictions.numberAllowed) {
        policy.allowedCharacterSets.num = characterSets.numberSet;

        let requirement = {
            kind: 'must',
            num: parseInt(characterRestrictions.minNumber),
            rule: {
                description: 'Must contain at least ' + characterRestrictions.minNumber + ' numbers.',
                regexp: '.*[num].*'
            }
        };
        policy.compositionRequirements.push(requirement);

    } else {
        let setRequirement = {
            kind: 'mustNot',
            num: 0,
            rule: {
                description:  '[num]',
                regexp: '.*'+ '[num]' +'.*'
            }
        };
        policy.compositionRequirements.push(setRequirement);
    }

    if (characterRestrictions.specialAllowed) {
        policy.allowedCharacterSets.special = characterSets.specialSet;

        let requirement = {
            kind: 'must',
            num: parseInt(characterRestrictions.minSpecial),
            rule: {
                description: 'Must contain at least ' + characterRestrictions.minSpecial + ' special characters.',
                regexp: '.*[special].*'
            }
        };
        policy.compositionRequirements.push(requirement);

    } else {
        let setRequirement = {
            kind: 'mustNot',
            num: 0,
            rule: {
                description:  '[special]',
                regexp: '.*'+ '[special]' +'.*'
            }
        };
        policy.compositionRequirements.push(setRequirement);
    }
    if (characterRestrictions.lowerAllowed) {
        //we only create policies after checking whether the character set is allowed, because the input fields hold values regardless of that
        policy.allowedCharacterSets.az = characterSets.lowerSet;

            //if a minimum is set
        if(parseInt(characterRestrictions.minLower)) {

            let requirement = {
                kind: 'must',
                num: parseInt(characterRestrictions.minLower),
                rule: {
                    description: 'Must contain at least ' + characterRestrictions.minLower + ' lower case letters.',
                    regexp: '^(([^'+ characterSets.lowerSet+ ']*)['+ characterSets.lowerSet +']([^'+characterSets.lowerSet +']*)){' +characterRestrictions.minLower + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                }
            };
            policy.compositionRequirements.push(requirement);


        }
    }

    if (characterRestrictions.capitalAllowed) {
        policy.allowedCharacterSets.AZ = characterSets.capitalSet;


            //if a minimum is set
        if(parseInt(characterRestrictions.minCapital)) {

            let requirement = {
                kind: 'must',
                num: parseInt(characterRestrictions.minCapital),
                rule: {
                    description: 'Must contain at least ' + characterRestrictions.minCapital + ' Capital case letters.',
                    regexp: '^(([^'+ characterSets.capitalSet+ ']*)['+ characterSets.capitalSet +']([^'+characterSets.capitalSet +']*)){' +characterRestrictions.minCapital + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                }
            };
            policy.compositionRequirements.push(requirement);
        }

    }

    if (characterRestrictions.numberAllowed) {
        policy.allowedCharacterSets.num = characterSets.numberSet;


            //if a minimum is set
        if(parseInt(characterRestrictions.minNumber)) {

            let requirement = {
                kind: 'must',
                num: parseInt(characterRestrictions.minNumber),
                rule: {
                    description: 'Must contain at least ' + characterRestrictions.minNumber + ' numbers.',
                    regexp: '^(([^'+ characterSets.numberSet+ ']*)['+ characterSets.numberSet +']([^'+characterSets.numberSet +']*)){' +characterRestrictions.minNumber + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                }
            };
            policy.compositionRequirements.push(requirement);

        }


    }

    if (characterRestrictions.specialAllowed) {

        policy.allowedCharacterSets.special = characterSets.specialSet;
        //escape all potentially problematic characters
        let specialRegExSet = characterSets.specialSet.
            replace(/\\/,'\\\\').
            replace(/\[/g, '\\[').
            replace(/]/g, '\\]').
            replace(/\^/g, '\\^').
            replace(/\$/g, '\\$').
            replace(/-/g, '\\-');

        // add whitespaces if necessary
        if(advancedRestrictions.whitespaceAllowed){
            policy.allowedCharacterSets.special = policy.allowedCharacterSets.special +' ';
            specialRegExSet = specialRegExSet + ' ';

        }

            //if a minimum is set
        if(parseInt(characterRestrictions.minSpecial)) {

            let requirement = {
                kind: 'must',
                num: parseInt(characterRestrictions.minSpecial),
                rule: {
                    description: 'Must contain at least ' + characterRestrictions.minSpecial + ' special characters.',
                    regexp: '^(([^'+ specialRegExSet+ ']*)['+ specialRegExSet +']([^'+specialRegExSet +']*)){' + characterRestrictions.minSpecial + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                }
            };
            policy.compositionRequirements.push(requirement);
        }

    }
    // Translate position restrictions
    for (let restriction of positionRestrictions) {
        if(restriction.restrictionContent) {


            let requirement = {
                kind: restriction.restrictionType,
                num: parseInt(restriction.restrictionPosition)
            };
            let regExContent = '';
            if (restriction.restrictionContent == 'capital') {
                regExContent = characterSets.capitalSet;
            } else if (restriction.restrictionContent == 'lowercase') {
                regExContent = characterSets.lowerSet;
            } else if (restriction.restrictionContent == 'number') {
                regExContent = characterSets.numberSet;
            } else if (restriction.restrictionContent == 'special') {
                regExContent = characterSets.specialSet.
                replace(/\\/,'\\\\').
                replace(/\[/g, '\\[').
                replace(/]/g, '\\]').
                replace(/\^/g, '\\^').
                replace(/\$/g, '\\$').
                replace(/-/g, '\\-');
            } else {
                regExContent = restriction.restrictionContent.
                replace(/\\/,'\\\\').
                replace(/\[/g, '\\[').
                replace(/]/g, '\\]').
                replace(/\^/g, '\\^').
                replace(/\$/g, '\\$').
                replace(/-/g, '\\-');
            }

            let pos = parseInt(restriction.restrictionPosition) - 1;
            if (restriction.restrictionType === 'must') {
                requirement.rule = {
                    description: 'Position ' + restriction.restrictionPosition + ' must be: ' + restriction.restrictionContent,
                    regexp: '^((.){' + pos + '}[' + regExContent + '])'
                };
            } else {
                requirement.rule = {
                    description: 'Position ' + restriction.restrictionPosition + ' must not be ' + restriction.restrictionContent,
                    regexp: '^((.){' + pos + '}[' + regExContent + '])'
                };
            }
            policy.compositionRequirements.push(requirement);
        }
    }


    if(customRestrictions.customRegEx){
        let customRequirement = {
            kind: 'must',
            num: 0,
            rule: {
                description: customRestrictions.customRegExDesc,
                regexp: customRestrictions.customRegEx

            }
        };
        policy.compositionRequirements.push(customRequirement);
    }

    console.log(customRestrictions);

    return policy;
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