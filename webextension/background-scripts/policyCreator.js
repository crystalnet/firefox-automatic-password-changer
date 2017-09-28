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

    /**
     * Sets the minimum and maximum length of the password in the policy
     * @param length {String} length of the password
     * @private
     */
    _createLength(length) {
        this.policy.minLength = parseInt(length.minLength);
        this.policy.maxLength = parseInt(length.maxLength);
    }

    /**
     * Sets the character Sets in the policy and creates a rule, for each with it's identifier, with num set to the minimum amount of characters of the specified character Set
     * @param characterRestrictions {Array} restrictions as objects
     * @param characterSets {Object} the character sets
     * @private
     */
    _createcharacterSets(characterRestrictions,characterSets){

        if (characterRestrictions.lowerAllowed) {
            this.policy.allowedCharacterSets.az = characterSets.lowerSet;

        }

        if (characterRestrictions.capitalAllowed) {
            this.policy.allowedCharacterSets.AZ = characterSets.capitalSet;

        }

        if (characterRestrictions.numberAllowed) {
            this.policy.allowedCharacterSets.num = characterSets.numberSet;
        }

        if (characterRestrictions.specialAllowed) {
            this.policy.allowedCharacterSets.special = characterSets.specialSet;
            //because it's hard to see for the user whether there is a whitespace or not in the
            //character set, the user can also specify this through a button
            if (characterSets.whitespaceAllowed) {
                this.policy.allowedCharacterSets.special = this.policy.allowedCharacterSets.special + ' ';
            }
        }
        if(characterRestrictions.unicodeAllowed){
            this.policy.allowedCharacterSets.unicode = 'unicode';
        }


    }

    /**
     * Converts the entered restrictions to valid policies
     * @param length {String} length of the password
     * @param characterRestrictions {Array} restrictions as objects
     * @param characterSets  {Object} the character sets
     * @param positionRestrictions {Array} restrictions as objects
     * @param customRestrictions {Array} restrictions as objects
     * @param advancedRestrictions {Array} restrictions as objects
     * @returns {{allowedCharacterSets: {}, minLength, maxLength, compositionRequirements: Array}}
     */
    createPolicy(length, characterRestrictions, characterSets, positionRestrictions, customRestrictions, advancedRestrictions) {

        this._createLength(length);

        this._createcharacterSets(characterRestrictions,characterSets);


        if (characterRestrictions.lowerAllowed) {
            //we only create policies after checking whether the character set is allowed, because the input fields hold values regardless of that

            //if a minimum is set
            if (parseInt(characterRestrictions.minLower)) {

                let requirement = {
                    kind: 'must',
                    num: parseInt(characterRestrictions.minLower),
                    rule: {
                        description: 'Must-contain-at-least ' + characterRestrictions.minLower + ' lower-case-letters.',
                        regexp: '^(([^az]*)[az]([^az]*)){' + characterRestrictions.minLower + ',}$'
                        //the az identifier will be replaced by the character set when checking the requirement in the player.js class
                    }
                };
                this.policy.compositionRequirements.push(requirement);


            }
        }

        if (characterRestrictions.capitalAllowed) {


            //if a minimum is set
            if (parseInt(characterRestrictions.minCapital)) {

                let requirement = {
                    kind: 'must',
                    num: parseInt(characterRestrictions.minCapital),
                    rule: {
                        description: 'Must-contain-at-least ' + characterRestrictions.minCapital + ' capital-case-letters.',
                        regexp: '^(([^AZ]*)[AZ]([^AZ]*)){' + characterRestrictions.minCapital + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                    }
                };
                this.policy.compositionRequirements.push(requirement);
            }

        }

        if (characterRestrictions.numberAllowed) {

            //if a minimum is set
            if (parseInt(characterRestrictions.minNumber)) {

                let requirement = {
                    kind: 'must',
                    num: parseInt(characterRestrictions.minNumber),
                    rule: {
                        description: 'Must-contain-at-least ' + characterRestrictions.minNumber + ' numbers.',
                        regexp: '^(([^num]*)[num]([^num]*)){' + characterRestrictions.minNumber + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                    }
                };
                this.policy.compositionRequirements.push(requirement);

            }


        }

        if (characterRestrictions.specialAllowed) {

            //if a minimum is set
            if (parseInt(characterRestrictions.minSpecial)) {

                let requirement = {
                    kind: 'must',
                    num: parseInt(characterRestrictions.minSpecial),
                    rule: {
                        description: 'Must-contain-at-least ' + characterRestrictions.minSpecial + ' special-characters.',
                        regexp: '^(([^special]*)[special]([^special]*)){' + characterRestrictions.minSpecial + ',}$'
                        //basically looks like this: ^(([^0-9]*)[0-9](^0-9]*)){2,}$  The dot identifier could be used too.
                    }
                };
                this.policy.compositionRequirements.push(requirement);
            }

        }

        if(advancedRestrictions.usernameAllowed){

            let requirement = {
                kind: 'mustNot',
                num: 0,
                rule: {
                    description: 'May-not-contain-username.',
                    regexp: '.*[username].*'
                }
            };
            this.policy.compositionRequirements.push(requirement);

        }
        // Translate position restrictions
        for (let restriction of positionRestrictions) {
            if (restriction.restrictionContent) {
                let requirement = {
                    kind: restriction.restrictionType,
                    num: parseInt(restriction.restrictionPosition)
                };
                // Choosing the right identifier to write into the RegExp. If specific characters are provided, they are being escaped and written directly into the RegExp
                let regExContent = '';
                let type = '';
                if (restriction.restrictionContent === 'capital') {
                    regExContent = 'AZ';
                    type = 'a-capital-letter.';
                } else if (restriction.restrictionContent === 'lowercase') {
                    regExContent = 'az';
                    type = 'a-lowercase-letter.';
                } else if (restriction.restrictionContent === 'number') {
                    regExContent = 'num';
                    type = 'a-number.';
                } else if (restriction.restrictionContent === 'special') {
                    regExContent = 'special';
                    type = 'a-special-character.';
                } else {
                    regExContent = restriction.restrictionContent.replace(/\\/, '\\\\').replace(/\[/g, '\\[').replace(/]/g, '\\]').replace(/\^/g, '\\^').replace(/\$/g, '\\$').replace(/-/g, '\\-');
                    type = ': ' + restriction.restrictionContent;
                }

                let pos = parseInt(restriction.restrictionPosition) - 1;
                if (restriction.restrictionType === 'must') {
                    requirement.rule = {
                        description: 'Position: ' + restriction.restrictionPosition + ' must-be: ' + type,
                        regexp: '^((.){' + pos + '}[' + regExContent + '])'
                    };
                } else {
                    requirement.rule = {
                        description: 'Position: ' + restriction.restrictionPosition + ' must-not-be: ' + type,
                        regexp: '^((.){' + pos + '}[' + regExContent + '])'
                    };
                }
                this.policy.compositionRequirements.push(requirement);
            }
        }

        for (let restriction of customRestrictions) {
            if (restriction.customRegEx) {
                let desc = 'Custom: ' + restriction.customRegExDesc;
                let customRequirement = {
                    kind: 'must',
                    num: 0,
                    rule: {
                        description: desc,
                        regexp: restriction.customRegEx

                    }
                };
                this.policy.compositionRequirements.push(customRequirement);
            }
        }

        return this.policy;
    }
}

chrome.runtime.onMessage.addListener(function (message) {
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
