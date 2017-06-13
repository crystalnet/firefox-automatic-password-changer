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
        this.blueprint = this._parseBlueprint(blueprintJson, this.schema);
    }

    /**
     * Generates a new password by using the PasswortGenerator and validating it against the blueprint
     *
     * @returns (String) new, valid password
     */
    generatePassword() {
        let validation = false;
        let password;

        while (!validation) {
            password = this._invokePasswordGenerator(this.blueprint);
            validation = this._validatePassword(password, this.blueprint);
        }
        return password;
    }

    /**
     * Validates the password policy blueprint against the Password Composition Policy schema
     *
     * @param blueprintJson JSON String of the password composition policy blueprint
     * @param schema JSON schema, the blueprint is validated against
     * @returns (Object) the parsed blueprint as object
     * @private
     */
    _parseBlueprint(blueprintJson) {
        const Ajv = require('ajv');
        const ajv = new Ajv();
        const validate = ajv.compile(this.schema);
        const blueprint = JSON.parse(blueprintJson);

        if (validate(blueprint)) {
            return blueprint;
        } else {
            console.log(validate.errors);
            throw  new Error("Blueprint doesn't follow JSON schema");
        }
    }

    /**
     * Invokes the password generator to generate a Password with the specified maximum length and allowed character set, which are specified in the blueprint
     *
     * @returns {String} password generated by the password generator.
     * @private
     */
    _invokePasswordGenerator() {
        // TODO replace with new password generator
        // const passwordGenerator = new PasswordGen();

        let maxLength = this.blueprint[0].maxLength;
        const allowsCharacterSets = this.blueprint[0].allowedCharacterSets;
        // TODO: use the get characterSet method?
        let alphabet = allowsCharacterSets.az + allowsCharacterSets.AZ + allowsCharacterSets.num + allowsCharacterSets.special;

        // TODO replace with new password generator
        // return passwordGenerator.generatePassword(maxLength, alphabet);
        return 'theS@testPassword1';
    }

    /**
     * Tests the password on all the Regular Expressions contained in the blueprint, that specify the password compostion policies.
     * Note that some policies can't be tested, like (May not be the same as the last 5 passwords used." As the old passwords are not stored in the password manager.
     *
     * @param password Password to be tested
     * @returns {boolean} true if the password satisfies the policies
     * @private
     */
    _validatePassword(password) {
        let charExp = new RegExp("[^"+ this.blueprint[0].allowedCharacterSets.az +this.blueprint[0].allowedCharacterSets.AZ + this.blueprint[0].allowedCharacterSets.num + this.blueprint[0].allowedCharacterSets.special+"]");
        charExp = new RegExp(charExp, 'g');
       // console.log(password);
       // console.log(charExp.test(password));
       // console.log(charExp);


        if((charExp.test(password))){
           // console.log(password);
            return false;
        }

        for (let requirement of this.blueprint[0].compositionRequirements) {
            if (!this._test(password, requirement, this.blueprint[0].allowedCharacterSets)) {
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
        const username = "testusernameA$0";
        const passwords = ['012345678', 'password', 'asdf', 'test', 'P@ssword123'];


        regExp = regExp.replace('az', az);
        regExp = regExp.replace('AZ', AZ);
        regExp = regExp.replace('num', num);
        regExp = regExp.replace('special', special);
        regExp = regExp.replace('[username]', username);


        if (regExp.includes('[password]')) {
            let newValue = '(';
            for (let pw of passwords) {
                newValue += pw + '|'
            }
            newValue = newValue.substr(0, newValue.length - 1) + ')';
            regExp = regExp.replace('[password]', newValue);
        }

        regExp = new RegExp(regExp, 'gi');
       // console.log(regExp);


        let result = regExp.test(password);

        //console.log(password,  ": ", regExp.toString(), ": ",requirement.kind,  ": ", result)
        if (requirement.kind === 'must') {
            return result
        } else {
            return !result
        }
    }

}

module.exports = Player;
