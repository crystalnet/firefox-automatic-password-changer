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
        //Ich glaube wir brauchen auch noch irgendwo den Username als Parameter, da wir den bei den RegExp
    }

    // Bekommen wir einen JSON-String oder ein JSON-Objekt?
    _parseBlueprint(blueprintJson) {
        const Ajv = require('ajv');
        const ajv = new Ajv();
        const validate = ajv.compile(this.schema);
        const blueprint = JSON.parse(blueprintJson);

        if (validate(blueprint)) {
            return blueprint;
        } else {
            console.log(validate.errors);
            throw 'Invalid blueprint';
        }
    }

    _invokePasswordGenerator() {
        const passwordGenerator = new PasswordGen();

        let maxLength = this.blueprint[0].maxLength;
        const allowsCharacterSets = this.blueprint[0].allowedCharacterSets;
        //TODO: use the get characterSet method?
        let alphabet = allowsCharacterSets.az + allowsCharacterSets.AZ + allowsCharacterSets.num +  allowsCharacterSets.special;
        this.password = passwordGenerator.generatePassword(maxLength, alphabet);
        // validate and regenerate password
        let validation = false;
        while(!validation){
            validation =_validatePassword(password);
            if(!validation){
                this.password = passwordGenerator.generatePassword(maxLength, alphabet);
            }
        }

    }

    _validatePassword(password) {
        for (let requirement in this.blueprint[0].compositionRequirements) {
            let rule = requirement.rule.regexp;
            if (!rule.test(password)) {
                return false;
            }
        }
        password = null;
        return true;
    }
    /**
     * Get method for Password minimum length
     * @returns {number} Password minimum length
     * @constructor
     */
    getPasswordMinLength() {
        let minLength = 1;
        if(this.blueprint[0].minLength  !== null){
            let minLength = this.blueprint[0].minLength;
        }

        return minLength;
    }
    getPasswordMaxLength(){
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
