/**
 * Created by crystalneth on 10-Jun-17.
 */

class Player {
    // TODO documentation
    constructor(blueprintJson) {
        this.schema = JSON.parse('{"$schema":"http://json-schema.org/schema#","title":"Password Composition Policy","description":"Array of password policy descriptions for the automatic creation of new passwords, DRAFT 2017-02-10","id":"URI TBD","type":"array","items":{"type":"object","properties":{"allowedCharacterSets":{"type":"object","description":"The different sets of allowed characters. Threre are special charsets available to all policies: username (is filled with the username if available), emanresu (is filled with the reverse username if available), allASCII (represents all ASCII characters), allUnicode (represents all Unicode characters). The names of these special character sets must not be used by other charset definitions.","minProperties":1},"minLength":{"type":"number","description":"The minimum length of the password, if left out: assumed to be 1","minimum":1},"maxLength":{"type":"number","description":"The maximum length of the password, if left out: assumed to be infinite","minimum":1},"compositionRequirements":{"type":"array","description":"The list of composition requirements in this password policy. If left out: assumed that all character sets can be used in any combination.","items":{"type":"object","description":"Representations of composition requirements using rules (regexps) on the allowed character sets, which either must or must not be fulfilled by valid passwords.","required":["kind","num","rule"],"properties":{"kind":{"type":"string","enum":["must","mustNot"]},"num":{"type":"number"},"rule":{"type":"object","description":"The rule of this composition requirement as regexp.","properties":{"description":{"type":"string","description":"A textual description of the rule to display to the user in the UI."},"regexp":{"type":"string","description":"The actual regexp of the rule."}}}},"minItems":1,"uniqueItems":true}}}}}');
        this.blueprint = this._parseBlueprint(blueprintJson, this.schema);
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
        // TODO validate and regenerate password
        let length = this.blueprint[0].minLength;
        const allowsCharacterSets = this.blueprint[0].allowedCharacterSets;
        let alphabet = allowsCharacterSets.az + allowsCharacterSets.AZ + allowsCharacterSets.num +  allowsCharacterSets.special;
        this.password = passwordGenerator.generatePassword(length, alphabet);
    }

    _validatePassword(password) {
        for (let requirement in this.blueprint[0].compositionRequirements) {
            let rule = requirement.rule.regexp;
            if (!rule.test(password)) {
                return false;
            }
        }
        return true;
    }
}

module.exports = Player;
