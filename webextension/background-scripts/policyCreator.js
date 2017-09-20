/**
 * Created by crystalneth on 20-Sep-17.
 */
/* exported PolicyCreator */
class PolicyCreator {
    constructor() {
        this.policy = {};
        this.policy.allowedCharacterSets = {};
        this.policy.compositionRequirements = [];
    }

    _createLength(length) {
        this.policy.minLength = parseInt(length.minLength);
        this.policy.maxLength = parseInt(length.maxLength);
    }

    /**
     * Converts the entered restrictions to valid policies
     * @param length
     * @param characterRestrictions
     * @param characterSets
     * @param positionRestrictions
     * @param customRestrictions
     * @param advancedRestrictions
     * @returns {{allowedCharacterSets: {}, minLength, maxLength, compositionRequirements: Array}}
     */
    createPolicy(length, characterRestrictions, characterSets, positionRestrictions, customRestrictions, advancedRestrictions) {
        this._createLength(length);

        if (characterRestrictions.lowerAllowed) {
            this.policy.allowedCharacterSets.az = characterSets.lowerSet;

            let requirement = {
                kind: 'must',
                num: parseInt(characterRestrictions.minLower),
                rule: {
                    description: 'Must contain at least ' + characterRestrictions.minLower + ' lower case letters.',
                    regexp: '.*[az].*'
                }
            };
            this.policy.compositionRequirements.push(requirement);

        } else {
            let setRequirement = {
                kind: 'mustNot',
                num: 0,
                rule: {
                    description: '[az]',
                    regexp: '.*' + '[az]' + '.*'
                }
            };
            this.policy.compositionRequirements.push(setRequirement);

        }

        if (characterRestrictions.capitalAllowed) {
            this.policy.allowedCharacterSets.AZ = characterSets.capitalSet;

            let requirement = {
                kind: 'must',
                num: parseInt(characterRestrictions.minCapital),
                rule: {
                    description: 'Must contain at least ' + characterRestrictions.minCapital + ' upper case letters.',
                    regexp: '.*[AZ].*'
                }
            };
            this.policy.compositionRequirements.push(requirement);

        } else {
            let setRequirement = {
                kind: 'mustNot',
                num: 0,
                rule: {
                    description: '[AZ]',
                    regexp: '.*' + '[AZ]' + '.*'
                }
            };
            this.policy.compositionRequirements.push(setRequirement);
        }

        if (characterRestrictions.numberAllowed) {
            this.policy.allowedCharacterSets.num = characterSets.numberSet;

            let requirement = {
                kind: 'must',
                num: parseInt(characterRestrictions.minNumber),
                rule: {
                    description: 'Must contain at least ' + characterRestrictions.minNumber + ' numbers.',
                    regexp: '.*[num].*'
                }
            };
            this.policy.compositionRequirements.push(requirement);

        } else {
            let setRequirement = {
                kind: 'mustNot',
                num: 0,
                rule: {
                    description: '[num]',
                    regexp: '.*' + '[num]' + '.*'
                }
            };
            this.policy.compositionRequirements.push(setRequirement);
        }

        if (characterRestrictions.specialAllowed) {
            this.policy.allowedCharacterSets.special = characterSets.specialSet;

            let requirement = {
                kind: 'must',
                num: parseInt(characterRestrictions.minSpecial),
                rule: {
                    description: 'Must contain at least ' + characterRestrictions.minSpecial + ' special characters.',
                    regexp: '.*[special].*'
                }
            };
            this.policy.compositionRequirements.push(requirement);

        } else {
            let setRequirement = {
                kind: 'mustNot',
                num: 0,
                rule: {
                    description: '[special]',
                    regexp: '.*' + '[special]' + '.*'
                }
            };
            this.policy.compositionRequirements.push(setRequirement);
        }
        if (characterRestrictions.lowerAllowed) {
            //we only create policies after checking whether the character set is allowed, because the input fields hold values regardless of that
            this.policy.allowedCharacterSets.az = characterSets.lowerSet;

            //if a minimum is set
            if (parseInt(characterRestrictions.minLower)) {

                let requirement = {
                    kind: 'must',
                    num: parseInt(characterRestrictions.minLower),
                    rule: {
                        description: 'Must contain at least ' + characterRestrictions.minLower + ' lower case letters.',
                        regexp: '^(([^' + characterSets.lowerSet + ']*)[' + characterSets.lowerSet + ']([^' + characterSets.lowerSet + ']*)){' + characterRestrictions.minLower + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                    }
                };
                this.policy.compositionRequirements.push(requirement);


            }
        }

        if (characterRestrictions.capitalAllowed) {
            this.policy.allowedCharacterSets.AZ = characterSets.capitalSet;


            //if a minimum is set
            if (parseInt(characterRestrictions.minCapital)) {

                let requirement = {
                    kind: 'must',
                    num: parseInt(characterRestrictions.minCapital),
                    rule: {
                        description: 'Must contain at least ' + characterRestrictions.minCapital + ' Capital case letters.',
                        regexp: '^(([^' + characterSets.capitalSet + ']*)[' + characterSets.capitalSet + ']([^' + characterSets.capitalSet + ']*)){' + characterRestrictions.minCapital + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                    }
                };
                this.policy.compositionRequirements.push(requirement);
            }

        }

        if (characterRestrictions.numberAllowed) {
            this.policy.allowedCharacterSets.num = characterSets.numberSet;


            //if a minimum is set
            if (parseInt(characterRestrictions.minNumber)) {

                let requirement = {
                    kind: 'must',
                    num: parseInt(characterRestrictions.minNumber),
                    rule: {
                        description: 'Must contain at least ' + characterRestrictions.minNumber + ' numbers.',
                        regexp: '^(([^' + characterSets.numberSet + ']*)[' + characterSets.numberSet + ']([^' + characterSets.numberSet + ']*)){' + characterRestrictions.minNumber + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                    }
                };
                this.policy.compositionRequirements.push(requirement);

            }


        }

        if (characterRestrictions.specialAllowed) {

            this.policy.allowedCharacterSets.special = characterSets.specialSet;
            //escape all potentially problematic characters
            let specialRegExSet = characterSets.specialSet.replace(/\\/, '\\\\').replace(/\[/g, '\\[').replace(/]/g, '\\]').replace(/\^/g, '\\^').replace(/\$/g, '\\$').replace(/-/g, '\\-');

            // add whitespaces if necessary
            if (advancedRestrictions.whitespaceAllowed) {
                this.policy.allowedCharacterSets.special = this.policy.allowedCharacterSets.special + ' ';
                specialRegExSet = specialRegExSet + ' ';

            }

            //if a minimum is set
            if (parseInt(characterRestrictions.minSpecial)) {

                let requirement = {
                    kind: 'must',
                    num: parseInt(characterRestrictions.minSpecial),
                    rule: {
                        description: 'Must contain at least ' + characterRestrictions.minSpecial + ' special characters.',
                        regexp: '^(([^' + specialRegExSet + ']*)[' + specialRegExSet + ']([^' + specialRegExSet + ']*)){' + characterRestrictions.minSpecial + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                    }
                };
                this.policy.compositionRequirements.push(requirement);
            }

        }
        // Translate position restrictions
        for (let restriction of positionRestrictions) {
            if (restriction.restrictionContent) {
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
                    regExContent = characterSets.specialSet.replace(/\\/, '\\\\').replace(/\[/g, '\\[').replace(/]/g, '\\]').replace(/\^/g, '\\^').replace(/\$/g, '\\$').replace(/-/g, '\\-');
                } else {
                    regExContent = restriction.restrictionContent.replace(/\\/, '\\\\').replace(/\[/g, '\\[').replace(/]/g, '\\]').replace(/\^/g, '\\^').replace(/\$/g, '\\$').replace(/-/g, '\\-');
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
                this.policy.compositionRequirements.push(requirement);
            }
        }

        for (let restriction of customRestrictions) {
            if (restriction.customRegEx) {
                let customRequirement = {
                    kind: 'must',
                    num: 0,
                    rule: {
                        description: restriction.customRegExDesc,
                        regexp: restriction.customRegEx

                    }
                };
                this.policy.compositionRequirements.push(customRequirement);
            }
        }

        return this.policy;
    }
}

browser.runtime.onMessage.addListener(function (message) {
    if (message.type === 'createPolicy') {
        const policyCreator = new PolicyCreator();

        const policy = policyCreator.createPolicy(
            message.lengthRestrictions,
            message.characterRestrictions,
            message.characterSets,
            message.positionRestrictions,
            message.customRestrictions,
            message.advancedRestrictions
        );

        recorder.policyEntered(policy);
    }
});
