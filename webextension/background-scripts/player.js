/**
 * Created by crystalneth on 10-Jun-17.
 */

class Player {
    // TODO documentation
    /**
     *
     * @param blueprintJson password policy specification blueprint (JSON File)
     */
    constructor(blueprintJson, schema) {
        this.schema = JSON.parse(schema);
        this.blueprint = this._parseBlueprint(blueprintJson, this.schema);
        // Ich glaube wir brauchen auch noch irgendwo den Username als Parameter, da wir den bei den RegExp
    }

    generateValidPassword() {
        let validation = false;

        while(!validation){
            try {
                this.password = this._invokePasswordGenerator(this.blueprint);
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
        for (let requirement of blueprint[0].compositionRequirements) {
            if (!this._test(password, requirement, blueprint[0].allowedCharacterSets)) {
                return false;
            }
        }
        return true;
    }

    _test(password, requirement, allowedCharacterSets) {
        let regExp = requirement.rule.regexp;

        const az = allowedCharacterSets.az;
        const AZ = allowedCharacterSets.AZ;
        const num = allowedCharacterSets.num;
        const special = allowedCharacterSets.special;
        const username = 'testusername';
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

        let result = regExp.test(password);

        //console.log(password,  ": ", regExp.toString(), ": ",requirement.kind,  ": ", result)
        if (requirement.kind === 'must') {
            return result
        } else {
            return !result
        }
    }

    get password() {return this.pw;}

    set password(newPassword) {
        if (this._validatePassword(newPassword, this.blueprint)) {
            this.pw = newPassword;
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
