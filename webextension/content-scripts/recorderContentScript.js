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
        specificationDialog.dialog('open');
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

    // Language specific content
    $('#lengthHeader').html(browser.i18n.getMessage('length'));

    $('#capitalHeader').html(browser.i18n.getMessage('capital-letters'));
    $('#capitalAllowedLabel').html(browser.i18n.getMessage('capital-allowed'));

    $('#lowercaseLetters').html(browser.i18n.getMessage('lowercase-letters'));
    $('#lowercaseAllowedLabel').html(browser.i18n.getMessage('lowercase-allowed'));

    $('#numbersHeader').html(browser.i18n.getMessage('numbers'));
    $('#numbersAllowedLabel').html(browser.i18n.getMessage('numbers-allowed'));

    $('#specialsHeader').html(browser.i18n.getMessage('special-characters'));
    $('#specialsAllowedLabel').html(browser.i18n.getMessage('special-allowed'));
    $('#whitespaceLabel').html(browser.i18n.getMessage('whitespace-allowed'));

    $('#posResHeader').html(browser.i18n.getMessage('position-specific'));
    $('#showPositionRestrictions').html(browser.i18n.getMessage('more'));
    $('#positionLabel').html(browser.i18n.getMessage('position'));
    $('#addPositionRestriction').html(browser.i18n.getMessage('add-Restriction'));
    $('#general-legend').html(browser.i18n.getMessage('general'));
    $('#characterset-legend-legend').html(browser.i18n.getMessage('allowed-character-sets'));
    $('#addRes-legend').html(browser.i18n.getMessage('additional-Restrictions'));
    //select options
    $('#mustNotBeOption').html(browser.i18n.getMessage('must-not-be'));
    $('#mustBeOption').html(browser.i18n.getMessage('must-be'));
    $('#capitalOption').html(browser.i18n.getMessage('capital-letter'));
    $('#lowercaseOption').html(browser.i18n.getMessage('lowercase-letter'));
    $('#numberOption').html(browser.i18n.getMessage('number'));
    $('#specialOption').html(browser.i18n.getMessage('special-characters'));
    $('#specificOption').html(browser.i18n.getMessage('specific'));

    $('#specificRestriction').attr("placeholder", browser.i18n.getMessage("specific-character"));
    $('#general-legend')
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
            $(this).html(browser.i18n.getMessage('more'));
        } else {
            positionRestrictions.show();
            $(this).html(browser.i18n.getMessage('less'));
        }
    });

    $('#addPositionRestriction').click(function () {
        let clone = $(data).find('.positionRestrictionForm').clone();


        // the clone() function clones the original div, without the custom language so we need to change them again
        //clone.find('#positionLabel').html(browser.i18n.getMessage('position'));
        clone.find('#mustNotBeOption').html(browser.i18n.getMessage('must-not-be'));
        clone.find('#mustBeOption').html(browser.i18n.getMessage('must-be'));
        clone.find('#capitalOption').html(browser.i18n.getMessage('capital-letter'));
        clone.find('#lowercaseOption').html(browser.i18n.getMessage('lowercase-letter'));
        clone.find('#numberOption').html(browser.i18n.getMessage('number'));
        clone.find('#specialOption').html(browser.i18n.getMessage('special-characters'));
        clone.find('#specificOption').html(browser.i18n.getMessage('specific'));
        clone.find('#specificRestriction').attr("placeholder", browser.i18n.getMessage("specific-character"));

        clone.appendTo('#positionRestrictionsContainer');
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
        minLength: parseInt(characterSetRestrictions.minLength),
        maxLength: parseInt(characterSetRestrictions.maxLength),
        compositionRequirements: []
    };

    if (characterSetRestrictions.lowerAllowed) {
        policy.allowedCharacterSets.az = characterSetRestrictions.lowerSet;

        let requirement = {
            kind: 'must',
            num: parseInt(characterSetRestrictions.minLower),
            rule: {
                description: 'Must contain at least ' + characterSetRestrictions.minLower + ' lower case letters.',
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
        policy.compositionRequirements.push(setRequirement)

    }

    if (characterSetRestrictions.capitalAllowed) {
        policy.allowedCharacterSets.AZ = characterSetRestrictions.capitalSet;

        let requirement = {
            kind: 'must',
            num: parseInt(characterSetRestrictions.minCapital),
            rule: {
                description: 'Must contain at least ' + characterSetRestrictions.minCapital + ' upper case letters.',
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
        policy.compositionRequirements.push(setRequirement)
    }

    if (characterSetRestrictions.numberAllowed) {
        policy.allowedCharacterSets.num = characterSetRestrictions.numberSet;

        let requirement = {
            kind: 'must',
            num: parseInt(characterSetRestrictions.minNumber),
            rule: {
                description: 'Must contain at least ' + characterSetRestrictions.minNumber + ' numbers.',
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
        policy.compositionRequirements.push(setRequirement)
    }

    if (characterSetRestrictions.specialAllowed) {
        policy.allowedCharacterSets.special = characterSetRestrictions.specialSet;

        let requirement = {
            kind: 'must',
            num: parseInt(characterSetRestrictions.minSpecial),
            rule: {
                description: 'Must contain at least ' + characterSetRestrictions.minSpecial + ' special characters.',
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
        policy.compositionRequirements.push(setRequirement)
    }


    if (characterSetRestrictions.lowerAllowed) {
        //we only create policies after checking whether the character set is allowed, because the input fields hold values regardless of that
        policy.allowedCharacterSets.az = characterSetRestrictions.lowerSet;
        if (characterSetRestrictions.minLower || characterSetRestrictions.maxLower){
            //if both min and max amount of lowercase letters are set
            if (characterSetRestrictions.minLower && characterSetRestrictions.maxLower){
                let requirement = {
                    kind: 'must',
                    num: parseInt(characterSetRestrictions.minLower),
                    rule: {
                        description: 'Must contain between ' + characterSetRestrictions.minLower + ' and '+ characterSetRestrictions.maxLower +' lower case letters.',
                        regexp: '^(([^'+ characterSetRestrictions.lowerSet+ ']*)['+ characterSetRestrictions.lowerSet +']([^'+characterSetRestrictions.lowerSet +']*)){' +characterSetRestrictions.minLower + ',' + characterSetRestrictions.maxLower+ '}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,3}$  The dot identifier could be used too.
                    }
                };
                policy.compositionRequirements.push(requirement);
                //if only a minimum is set
            } else if(characterSetRestrictions.minLower) {

                let requirement = {
                    kind: 'must',
                    num: parseInt(characterSetRestrictions.minLower),
                    rule: {
                        description: 'Must contain at least ' + characterSetRestrictions.minLower + ' lower case letters.',
                        regexp: '^(([^'+ characterSetRestrictions.lowerSet+ ']*)['+ characterSetRestrictions.lowerSet +']([^'+characterSetRestrictions.lowerSet +']*)){' +characterSetRestrictions.minLower + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                    }
                };
                policy.compositionRequirements.push(requirement);

                //the last case is when only a maximum is set
            } else {
                let requirement = {
                    kind: 'must',
                    num: 0,
                    rule: {
                        description: 'Must not contain more than ' + characterSetRestrictions.minLower + ' lower case letters.',
                        regexp: '^(([^'+ characterSetRestrictions.lowerSet+ ']*)['+ characterSetRestrictions.lowerSet +']?([^'+characterSetRestrictions.lowerSet +']*)){'+characterSetRestrictions.maxLower +'}$'
                        //basically looks like this: ^(([^0-9]*)[0-9]?(^0-9]*)){2}$  The questionmark let's it accept 0 occurences of the charSet
                    }
                };
                policy.compositionRequirements.push(requirement);
            }

        }


    }

    if (characterSetRestrictions.capitalAllowed) {
        policy.allowedCharacterSets.AZ = characterSetRestrictions.capitalSet;

        if (characterSetRestrictions.minCapital|characterSetRestrictions.maxCapital){
            //if both min and max amount of uppercase letters are set
            if (characterSetRestrictions.minCapital && characterSetRestrictions.maxCapital){
                let requirement = {
                    kind: 'must',
                    num: parseInt(characterSetRestrictions.minCapital),
                    rule: {
                        description: 'Must contain between ' + characterSetRestrictions.minCapital + ' and '+ characterSetRestrictions.maxCapital +' Capital case letters.',
                        regexp: '^(([^'+ characterSetRestrictions.capitalSet+ ']*)['+ characterSetRestrictions.capitalSet+']([^'+characterSetRestrictions.capitalSet +']*)){' +characterSetRestrictions.minCapital + ',' + characterSetRestrictions.maxCapital+ '}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,3}$  The dot identifier could be used too.
                    }
                };
                policy.compositionRequirements.push(requirement);
                //if only a minimum is set
            } else if(characterSetRestrictions.minCapital) {

                let requirement = {
                    kind: 'must',
                    num: parseInt(characterSetRestrictions.minCapital),
                    rule: {
                        description: 'Must contain at least ' + characterSetRestrictions.minCapital + ' Capital case letters.',
                        regexp: '^(([^'+ characterSetRestrictions.capitalSet+ ']*)['+ characterSetRestrictions.capitalSet +']([^'+characterSetRestrictions.capitalSet +']*)){' +characterSetRestrictions.minCapital + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                    }
                };
                policy.compositionRequirements.push(requirement);
                //the last case is when only a maximum is set
            } else {
                let requirement = {
                    kind: 'must',
                    num: 0,
                    rule: {
                        description: 'Must not contain more than ' + characterSetRestrictions.minCapital + ' Capital case letters.',
                        regexp: '^(([^'+ characterSetRestrictions.capitalSet+ ']*)['+ characterSetRestrictions.capitalSet +']?([^'+characterSetRestrictions.capitalSet +']*)){'+characterSetRestrictions.maxCapital +'}$'
                        //basically looks like this: ^(([^0-9]*)[0-9]?([^0-9]*)){2}$  The questionmark let's it accept 0 occurences of the charSet
                    }
                };
                policy.compositionRequirements.push(requirement);
            }
        }
    }

    if (characterSetRestrictions.numberAllowed) {
        policy.allowedCharacterSets.num = characterSetRestrictions.numberSet;

        if (characterSetRestrictions.minNumber|characterSetRestrictions.maxNumber){
            //if both min and max amount of uppercase letters are set
            if (characterSetRestrictions.minNumber && characterSetRestrictions.maxNumber){
                let requirement = {
                    kind: 'must',
                    num: parseInt(characterSetRestrictions.minNumber),
                    rule: {
                        description: 'Must contain between ' + characterSetRestrictions.minNumber + ' and '+ characterSetRestrictions.maxNumber +' Numbers.',
                        regexp: '^(([^'+ characterSetRestrictions.numberSet+ ']*)['+ characterSetRestrictions.numberSet+']([^'+characterSetRestrictions.numberSet +']*)){' +characterSetRestrictions.minNumber + ',' + characterSetRestrictions.maxNumber+ '}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,3}$  The dot identifier could be used too.
                    }
                };
                policy.compositionRequirements.push(requirement);
                //if only a minimum is set
            } else if(characterSetRestrictions.minNumber) {

                let requirement = {
                    kind: 'must',
                    num: parseInt(characterSetRestrictions.minNumber),
                    rule: {
                        description: 'Must contain at least ' + characterSetRestrictions.minNumber + ' numbers.',
                        regexp: '^(([^'+ characterSetRestrictions.numberSet+ ']*)['+ characterSetRestrictions.numberSet +']([^'+characterSetRestrictions.numberSet +']*)){' +characterSetRestrictions.minNumber + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                    }
                };
                policy.compositionRequirements.push(requirement);

                //the last case is when only a maximum is set
            } else {
                let requirement = {
                    kind: 'must',
                    num: 0,
                    rule: {
                        description: 'Must not contain more than ' + characterSetRestrictions.minNumber + ' numbers.',
                        regexp: '^(([^'+ characterSetRestrictions.numberSet+ ']*)['+ characterSetRestrictions.numberSet +']?([^'+characterSetRestrictions.numberSet +']*)){'+characterSetRestrictions.maxNumber +'}$'
                        //basically looks like this: ^(([^0-9]*)[0-9]?([^0-9]*)){2}$  The questionmark let's it accept 0 occurences of the charSet
                    }
                };
                policy.compositionRequirements.push(requirement);
            }
        }

    }

    if (characterSetRestrictions.specialAllowed) {

        policy.allowedCharacterSets.special = characterSetRestrictions.specialSet.replace(/"/g,"\\\"").replace(/'/g,"\\'");
        //escape all potentially problematic characters
        let specialRegExSet = characterSetRestrictions.specialSet.replace(/"/g,"\\\"").
        replace(/\[/g, "\\[").
        replace(/]/g, "\\]").
        replace(/\^/g, "\\^").
        replace(/\$/g, "\\$").
        replace(/'/g, "\\'").
        replace(/-/g, "\\-").
        replace(/\\/g, "\\");

        // add whitespaces if necessary
        if(characterSetRestrictions.whitespaceAllowed){
            policy.allowedCharacterSets.special = policy.allowedCharacterSets.special +" ";
            specialRegExSet = specialRegExSet + "\s";

        }
        if (characterSetRestrictions.minSpecial|characterSetRestrictions.maxSpecial){
            //if both min and max amount of uppercase letters are set
            if (characterSetRestrictions.minSpecial && characterSetRestrictions.maxSpecial){
                let requirement = {
                    kind: 'must',
                    num: parseInt(characterSetRestrictions.minSpecial),
                    rule: {
                        description: 'Must contain between ' + characterSetRestrictions.minSpecial + ' and '+ characterSetRestrictions.maxSpecial +' special Characters.',
                        regexp: '^(([^'+ specialRegExSet+ ']*)['+ specialRegExSet+']([^'+specialRegExSet +']*)){' + characterSetRestrictions.minSpecial + ',' + characterSetRestrictions.maxSpecial+ '}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,3}$  The dot identifier could be used too.
                    }
                };
                policy.compositionRequirements.push(requirement);
                //if only a minimum is set
            } else if(characterSetRestrictions.minSpecial) {

                let requirement = {
                    kind: 'must',
                    num: parseInt(characterSetRestrictions.minSpecial),
                    rule: {
                        description: 'Must contain at least ' + characterSetRestrictions.minSpecial + ' special characters.',
                        regexp: '^(([^'+ specialRegExSet+ ']*)['+ specialRegExSet +']([^'+specialRegExSet +']*)){' + characterSetRestrictions.minSpecial + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                    }
                };
                policy.compositionRequirements.push(requirement);

                //the last case is when only a maximum is set
            } else {
                let requirement = {
                    kind: 'must',
                    num: 0,
                    rule: {
                        description: 'Must not contain more than ' + characterSetRestrictions.minSpecial + ' special characters.',
                        regexp: '^(([^'+ specialRegExSet+ ']*)['+ specialRegExSet +']?([^'+specialRegExSet +']*)){'+characterSetRestrictions.maxSpecial +'}$'
                        //basically looks like this: ^(([^0-9]*)[0-9]?([^0-9]*)){2}$  The questionmark let's it accept 0 occurences of the charSet
                    }
                };
                policy.compositionRequirements.push(requirement);
            }
        }
    }
    // Translate position restrictions
    for (let restriction of positionRestrictions) {
        let requirement = {
            kind: restriction.restrictionType,
            num: parseInt(restriction.restrictionPosition)
        };
        let regExContent = "";
        if(restriction.restrictionContent == 'capital'){
            regExContent = characterSetRestrictions.capitalSet
        } else if(restriction.restrictionContent == 'lowercase'){
            regExContent = characterSetRestrictions.lowerSet
        } else if(restriction.restrictionContent == 'number'){
            regExContent = characterSetRestrictions.numberSet
        } else if(restriction.restrictionContent == 'special'){
            regExContent = characterSetRestrictions.characterSetRestrictions.specialSet.replace(/"/g,"\\\"").
            replace(/\[/g, "\\[").
            replace(/]/g, "\\]").
            replace(/\^/g, "\\^").
            replace(/\$/g, "\\$").
            replace(/-/g, "\\-").
            replace(/'/g, "\\'").
            replace(/\\/g, "\\");
        } else {
            regExContent = restriction.restrictionContent.replace(/"/g,"\\\"").
            replace(/\[/g, "\\[").
            replace(/]/g, "\\]").
            replace(/\^/g, "\\^").
            replace(/\$/g, "\\$").
            replace(/-/g, "\\-").
            replace(/'/g, "\\'").
            replace(/\\/g, "\\");
        }

        let pos = parseInt(restriction.restrictionPosition) - 1;
        if (restriction.restrictionType === 'must') {
            requirement.rule = {
                description: 'Position ' + restriction.restrictionPosition + ' must be: ' + restriction.restrictionContent,
                regexp: '^((.){'+ pos +'}['+ regExContent+'])'
            };
        } else {
            requirement.rule = {
                description: 'Position ' + restriction.restrictionPosition + ' must not be ' + restriction.restrictionContent,
                regexp: '^((.){'+ pos +'}['+ regExContent+'])'
            };
        }
        policy.compositionRequirements.push(requirement);
    }

    return policy;
    //don't need this anymore
    /**
    if (characterSetRestrictions.minLower) {
        if(characterSetRestrictions.maxLower) {
            let requirement = {
                kind: 'must',
                num: characterSetRestrictions.minLower,
                rule: {
                    description: 'Must contain at least ' + characterSetRestrictions.minLower + ' lower case letters.',
                    regexp: '.*[az].*'
                }
            };
        } else {
            let requirement = {
                kind: 'must',
                num: characterSetRestrictions.minLower,
                rule: {
                    description: 'Must contain at least ' + characterSetRestrictions.minLower + ' lower case letters.',
                    regexp: '.*[az].*'
                }
            };
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
     **/

}

/**
 * Handles click events
 */
function onClickEventHandler(event) {
    // ignore right button click and events triggered by javascript
    if (event.button === 0 && (event.clientX !== 0 || event.clientY !== 0) && !Boolean($(event.target).parents('.pwdChanger').length)) {
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