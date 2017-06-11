/**
 * Created by crystalneth on 10-Jun-17.
 */

class Player {
    // TODO documentation
    /**
     *
     * @param blueprintJson password policy specification blueprint (JSON File)
     */
    constructor(blueprintJson) {
        this.schema = JSON.parse('{"$schema":"http://json-schema.org/schema#","title":"Password Composition Policy","description":"Array of password policy descriptions for the automatic creation of new passwords, DRAFT 2017-02-10","id":"URI TBD","type":"array","items":{"type":"object","properties":{"allowedCharacterSets":{"type":"object","description":"The different sets of allowed characters. Threre are special charsets available to all policies: username (is filled with the username if available), emanresu (is filled with the reverse username if available), allASCII (represents all ASCII characters), allUnicode (represents all Unicode characters). The names of these special character sets must not be used by other charset definitions.","minProperties":1},"minLength":{"type":"number","description":"The minimum length of the password, if left out: assumed to be 1","minimum":1},"maxLength":{"type":"number","description":"The maximum length of the password, if left out: assumed to be infinite","minimum":1},"compositionRequirements":{"type":"array","description":"The list of composition requirements in this password policy. If left out: assumed that all character sets can be used in any combination.","items":{"type":"object","description":"Representations of composition requirements using rules (regexps) on the allowed character sets, which either must or must not be fulfilled by valid passwords.","required":["kind","num","rule"],"properties":{"kind":{"type":"string","enum":["must","mustNot"]},"num":{"type":"number"},"rule":{"type":"object","description":"The rule of this composition requirement as regexp.","properties":{"description":{"type":"string","description":"A textual description of the rule to display to the user in the UI."},"regexp":{"type":"string","description":"The actual regexp of the rule."}}}},"minItems":1,"uniqueItems":true}}}}}');
        this.blueprint = this._parseBlueprint(blueprintJson, this.schema);
        // Ich glaube wir brauchen auch noch irgendwo den Username als Parameter, da wir den bei den RegExp
    }

    generateValidPassword() {
        let validation = false;

        while(!validation){
            try {
                this.password(this._invokePasswordGenerator(this.blueprint));
            } catch(err) {
                validation = false;
            }
            validation = true;
        }
    }

    // Bekommen wir einen JSON-String oder ein JSON-Objekt?
    _parseBlueprint(blueprintJson, schema) {
        const Ajv = require('ajv');
        const ajv = new Ajv();
        const validate = ajv.compile(schema);
        const blueprint = JSON.parse(blueprintJson);

        if (validate(blueprint)) {
            return blueprint;
        } else {
            console.log(validate.errors);
            throw "Blueprint doesn't follow JSON schema"
        }
    }

    _invokePasswordGenerator(blueprint) {
        const passwordGenerator = new PasswordGen();

        let maxLength = this.blueprint[0].maxLength;
        const allowsCharacterSets = this.blueprint[0].allowedCharacterSets;
        //TODO: use the get characterSet method?
        let alphabet = allowsCharacterSets.az + allowsCharacterSets.AZ + allowsCharacterSets.num +  allowsCharacterSets.special;

        return passwordGenerator.generatePassword(maxLength, alphabet);
    }

    _validatePassword(password, blueprint) {
        for (let requirement in blueprint[0].compositionRequirements) {
            if (!this._test(password, requirement, blueprint)) {
                return false;
            }
        }
        return true;
    }

    _test(password, requirement, blueprint) {
        let regExp = requirement.rule.regexp;

        const az = blueprint[0].allowedCharacterSets.az;
        const AZ = blueprint[0].allowedCharacterSets.AZ;
        const num = blueprint[0].allowedCharacterSets.num;
        const special = blueprint[0].allowedCharacterSets.special;
        const username = 'testusername';
        const passwords = ['012345678', 'passsword', 'asdf', 'test', 'password123'];

        regExp.replace('[az]', az);
        regExp.replace('[AZ]', AZ);
        regExp.replace('[num]', num);
        regExp.replace('[special]', special);
        regExp.replace('[username]', username);

        if (regExp.includes('[password]')) {
            newValue = '(';
            for (password in passwords) {
                newValue += password + '|'
            }
            newValue = newValue.substr(0, newValue.length - 1) + ')';
        }

        regExp = new RegExp(regExp, 'gi');

        result = regExp.test(password);

        if (requirement.kind === 'must') {
            return !result
        } else {
            return result
        }
    }

    get password() {return this.password;}

    set password(newPassword) {
        if (this._validatePassword(newPassword, this.blueprint)) {
            this.password = newPassword;
        } else {
            throw "New password is not valid";
        }
    }

    /**
     * Get method for Password minimum length
     * @returns {number} Password minimum length
     * @constructor
     */
    get passwordMinLength() {
        let minLength = 1;
        if(this.blueprint[0].minLength !== null){
            let minLength = this.blueprint[0].minLength;
        }

        return minLength;
    }
    get passwordMaxLength(){
        let maxLength = 16;
        if(this.blueprint[0].maxLength !== null){
            maxLength = pwScheme.items.maxLength;
        }
        return maxLength;
    }

    /**
     * Returns the allowed character Set
     * @returns {*} specified character Set or a basic set if nothing was specified
     */
    getCharacterSet(){
        //basic character set that is assumed, if nothing is specified in the JSON scheme
        let baseCharSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890";
        let charSet = "";
        //add all specified Characters to the charSet-String that will be passed on to the Generator
        if(this.blueprint[0].allowedCharacterSets !== null){
            for(c in this.blueprint[0].allowedCharacterSets){
                charSet += c;
            }
        }
        //if no characters have been added to the set use the assumed basic set
        if(charSet !== ""){
            return charSet;
        }else{
            return baseCharSet;
        }

    }
}

module.exports = Player;
