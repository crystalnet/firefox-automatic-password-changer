const string = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
const numeric = '0123456789';
const punctuation = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

/**
 * This is a simple password generator
 * Note: Must be passwordLength = numericNumber + punctNumber + charNumber
 * @param passwordLength length of the password that will be generated
 * @param numericNumber how much numeric character should be in the generated password
 * @param charNumber how much string character should be in the generated password
 * @param punctNumber how much punctuations should be in the generated password
 */
module.exports = function PasswordGen(passwordLength, numericNumber, charNumber, punctNumber) {

    this.generatePassword = function () {
        let password = "";
        let actualCharNumber = 0;
        let actualNumericNumber = 0;
        let actualPunctNumber = 0;

        if ((numericNumber + charNumber + punctNumber) != passwordLength) {
            console.log("Invalid parameter at PasswordGen!");
            console.log("numericNumber+charNumber+punctNumber = " + (numericNumber + charNumber + punctNumber) + " but passwordLength is " + PasswordGen);
            console.log("These values must be equal!");
        }

        while (password.length < passwordLength) {
            //TODO check if the following used functions are really random
            let entity1 = Math.floor(string.length * Math.random() * Math.random());
            let entity2 = Math.ceil(numeric.length * Math.random() * Math.random());
            let entity3 = Math.floor(punctuation.length * Math.random() * Math.random());

            let luckyNumber = (Math.floor(Math.random() * 10) % 3);
            let actualChar = "";


            switch (luckyNumber) {
                case 0:
                    if (actualCharNumber < charNumber) {
                        actualChar = string.charAt(entity1);
                        actualCharNumber++;
                    }
                    break;
                case 1:
                    if (actualNumericNumber < numericNumber) {
                        actualChar = numeric.charAt(entity2);
                        actualNumericNumber++;
                    }
                    break;
                case 2:
                    if (actualPunctNumber < punctNumber) {
                        actualChar = punctuation.charAt(entity3);
                        actualPunctNumber++;
                    }
            }
            password += actualChar;
            actualChar = "";

        }
        return password;
    };

    this.passwordSet = function () {
        return password !== "";
    };

    this.getPassword = function () {
        return password;
    };
};