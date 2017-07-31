/**
 * Player class reads handles password specification blueprints (JSON-String) and the password generator
 * Created by crystalneth on 10-Jun-17.
 */
class Player {

    /**
     * Constructor for a player object. Note that the constructor immediately checks,
     * whether the provided blueprint-string is a valid JSON-Password Composition Policy or not.
     *
     * @param blueprintJson password policy specification blueprint (JSON String)
     * @param schema JSON String containing JSON schema for password policies
     */
    constructor(blueprintJson, schema) {
        this.schema = JSON.parse(schema);
        this.blueprint = this._parseBlueprint(blueprintJson);
    }

    /**
     * Validates the password policy blueprint against the Password Composition Policy schema.
     *
     * @param blueprintJson JSON String of the password composition policy blueprint.
     * @returns (Object) the parsed blueprint as object.
     * @private
     */
    _parseBlueprint(blueprintJson) {
        //const Ajv = require('ajv');
        const ajv = new Ajv();
        const validate = ajv.compile(this.schema);
        const blueprint = JSON.parse(blueprintJson);

        if (validate(blueprint)) {
            return blueprint;
        } else {
            // console.log(validate.errors);
            throw new Error('Blueprint doesn\'t follow JSON schema');
        }
    }

    /**
     * Invokes the password generator to generate a Password with the specified maximum length and allowed character set, which are specified in the blueprint
     *
     * @returns {Promise} password generated by the password generator.
     * @private
     */
    _invokePasswordGenerator() {
        const passwordGenerator = new PasswordGen();
        let maxLength = this.blueprint[0].pwdPolicy[0].maxLength;
        let arrayOfChars = [];
        let lowerCaseCounter = 0;
        let upperCaseCounter = 0;
        let digitCounter = 0;
        let specialCounter = 0;
        let RequirementSet = this.blueprint[0].pwdPolicy[0].compositionRequirements;
        let array = ['[az]', '[AZ]', '[num]', '[special]'];
        // go through the array of requirements
        for (let count = 0; count < RequirementSet.length; count++) {
            let r = RequirementSet[count];
            if (r.kind === 'must') {
                let regexp = r.rule.regexp;
                //go through every element of array
                for (let arrCount = 0; arrCount < array.length; arrCount++) {
                    //check whether the element array[arrCount] is included in regexp
                    //if so, check which element array[arrCount] is and add num of the rule to the counter
                    if (regexp.includes(array[arrCount])) {
                        switch (array[arrCount]) {
                        case '[az]':
                            lowerCaseCounter += r.num;
                            break;
                        case '[AZ]':
                            upperCaseCounter += r.num;
                            break;
                        case '[num]':
                            digitCounter += r.num;
                            break;
                        case '[special]':
                            specialCounter += r.num;
                            break;
                        }
                    }
                }
            }
        }

        let characterSets = this.blueprint[0].pwdPolicy[0].allowedCharacterSets;
        //go through every property of the object characterSets of the blueprint
        Object.keys(characterSets).forEach(prop => {
            //check, which set of characters is part of the property and add the fitting one to the arrayOfChars
            // as well as the counter for that set
            switch (prop) {
            case 'az':
                arrayOfChars.push({char: characterSets[prop], min: lowerCaseCounter});
                break;
            case 'AZ':
                arrayOfChars.push({char: characterSets[prop], min: upperCaseCounter});
                break;
            case 'num':
                arrayOfChars.push({char: characterSets[prop], min: digitCounter});
                break;
            case 'special':
                arrayOfChars.push({char: characterSets[prop], min: specialCounter});
                break;
            }
        });

        //console.log(JSON.parse(arrayOfChars));
        return passwordGenerator.generatePassword(maxLength, arrayOfChars).then(function (result) {
            return result;
        });
    }

    /**
     * Tests the password on the Regular Expressions contained in the blueprint, that specify the password compostion policies.
     * Stops after the first failed Regular Expression.
     * Note that some policies can't be tested, like (May not be the same as the last 5 passwords used." As the old passwords are not stored in the password manager.
     *
     * @param password Password to be tested
     * @returns {boolean} true if the password satisfies the policies
     * @private
     */
    _validatePassword(password) {
        let pwdPolicy = this.blueprint[0].pwdPolicy[0];
        let charExp = new RegExp('[^' + pwdPolicy.allowedCharacterSets.az + pwdPolicy.allowedCharacterSets.AZ + pwdPolicy.allowedCharacterSets.num + pwdPolicy.allowedCharacterSets.special + ']');
        charExp = new RegExp(charExp, 'g');
        let minLength = pwdPolicy.minLength;
        let maxLength = pwdPolicy.maxLength;

        if (minLength !== 'undefined') {
            if (password.length < minLength) {
                return false;
            }
        }

        if (maxLength !== 'undefined') {
            if (password.length > maxLength) {
                return false;
            }
        }

        if (charExp.test(password)) {
            return false;
        }

        for (let requirement of pwdPolicy.compositionRequirements) {
            if (!this._test(password, requirement, pwdPolicy.allowedCharacterSets)) {
                return false;
            }
        }
        return true;
    }

    /**
     * tests the password on the passed regular expression requirement, with respect to the allowed  Character Sets.
     *
     * @param password the password to be tested
     * @param requirement a regular expression
     * @param allowedCharacterSets the allowed character sets
     * @returns {boolean} only true if the password meets the specified requirements
     * @private
     */
    _test(password, requirement, allowedCharacterSets) {
        let regExp = requirement.rule.regexp;

        const az = allowedCharacterSets.az;
        const AZ = allowedCharacterSets.AZ;
        const num = allowedCharacterSets.num;
        const special = allowedCharacterSets.special;
        const username = 'testusernameA$0';
        const passwords = ['012345678', 'password', 'asdf', 'test', 'P@ssword123'];

        regExp = regExp.replace('az', az);
        regExp = regExp.replace('AZ', AZ);
        regExp = regExp.replace('num', num);
        regExp = regExp.replace('special', special);
        regExp = regExp.replace('[username]', username);

        if (regExp.includes('[password]')) {
            let newValue = '(';
            for (let pw of passwords) {
                newValue += pw + '|';
            }
            newValue = newValue.substr(0, newValue.length - 1) + ')';
            regExp = regExp.replace('[password]', newValue);
        }

        regExp = new RegExp(regExp, 'gi');
        let result = regExp.test(password);

        if (requirement.kind === 'must') {
            return result;
        } else {
            return !result;
        }
    }

    /**
     * Tests the password on all the Regular Expressions contained in the blueprint, that specify the password compostion policies.
     * Collects the descriptions of the failed requirements in an array and returns them.
     * Also returns a boolean that is true, if no requirement was failed, and is false otherwise.
     * @param password
     * @returns {{sat: boolean, failReq: Array, passReq: Array}} sat= boolean, true if the password satisfies all requirements specified in the blueprint.
     *                                                           failReq= an array filled with textual descriptions of the unsatisfied requirements as strings.
     *                                                           passReq= an array filled with textual descriptions of all satisfied requirements. Always contains a description of which characters are not allowed.
     */
    validateUserPassword(password) {
        let pwdPolicy = this.blueprint[0].pwdPolicy[0];
        let unSatReq = [];
        let satReq = [];
        let satisfied = true;
        let minLength = pwdPolicy.minLength;
        let maxLength = pwdPolicy.maxLength;

        if (minLength !== 'undefined') {
            if (password.length < minLength) {
                satisfied = false;
                unSatReq.push('Must contain at least ' + minLength + ' letters.');
            } else {
                satReq.push('Must contain at least ' + minLength + ' letters.');
            }
        }

        if (maxLength !== 'undefined') {
            if (password.length > maxLength) {
                satisfied = false;
                unSatReq.push('May not contain more than ' + maxLength + ' letters.');
            } else {
                satReq.push('May not contain more than ' + maxLength + ' letters.');
            }
        }

        let charExp = new RegExp('[^' + pwdPolicy.allowedCharacterSets.az + pwdPolicy.allowedCharacterSets.AZ + pwdPolicy.allowedCharacterSets.num + pwdPolicy.allowedCharacterSets.special + ']');
        charExp = new RegExp(charExp, 'g');

        let check = password.match(charExp);

        if (check !== null) {
            satisfied = false;
            check = [...new Set(check)].toString();
            unSatReq.push('Your password contains: ' + check + ' , please do not use these characters.');
        }

        let ascii = '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
        ascii = ascii.match(charExp);

        if (ascii !== null) {
            ascii = [...new Set(ascii)].toString();
            satReq.push('You can\'t use: ' + ascii + 'in your password.');
        }


        for (let requirement of pwdPolicy.compositionRequirements) {
            if (!this._test(password, requirement, pwdPolicy.allowedCharacterSets)) {
                satisfied = false;
                unSatReq.push(requirement.rule.description);
            } else {
                satReq.push(requirement.rule.description);
            }
        }
        return {sat: satisfied, failReq: unSatReq, passReq: satReq};
    }

    /**
     * Generates a new password by using the PasswordGenerator and validating it against the blueprint
     *
     * @returns (Promise) new, valid password
     */
    generatePassword() {
        return this._invokePasswordGenerator();
        /**
         let validation = false;
         let password;

         while (!validation) {
            password = this._invokePasswordGenerator(this.blueprint);
            validation = this._validatePassword(password, this.blueprint);
        }
         return password;
         **/
    }
}
