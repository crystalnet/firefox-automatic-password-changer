/**
 * This is a simple password generator
 */
class PasswordGen {
    /**
     * Note: Must be passwordLength = numericNumber + punctNumber + charNumber
     * @param passwordLength length of the password that will be generated
     * @param numericNumber how much numeric character should be in the generated password
     * @param charNumber how much string character should be in the generated password
     * @param punctNumber how much punctuations should be in the generated password
     */
    constructor(passwordLength, numericNumber, charNumber, punctNumber) {
        this.lastPassword = "";
        this.passwordLength = passwordLength;
        this.numericNumber = numericNumber;
        this.charNumber = charNumber;
        this.punctNumber = punctNumber;
        this.chars = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
        this.numeric = '0123456789';
        this.punctuation = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    }

    generatePassword() {
        let password = "";
        let actualCharNumber = 0;
        let actualNumericNumber = 0;
        let actualPunctNumber = 0;

        if ((this.numericNumber + this.charNumber + this.punctNumber) !== this.passwordLength) {
            console.log("Invalid parameter at PasswordGen!");
            console.log("numericNumber+charNumber+punctNumber = " + (this.numericNumber + this.charNumber + this.punctNumber) + " but passwordLength is " + this.passwordLength);
            console.log("These values must be equal!");
            return;
        }

        while (password.length < this.passwordLength) {
            let entity1 = Math.floor(this.chars.length * Math.random() * Math.random());
            let entity2 = Math.ceil(this.numeric.length * Math.random() * Math.random());
            let entity3 = Math.floor(this.punctuation.length * Math.random() * Math.random());

            let luckyNumber = (Math.floor(Math.random() * 10) % 3);
            let actualChar = "";

            switch (luckyNumber) {
                case 0:
                    if (actualCharNumber < this.charNumber) {
                        actualChar = this.chars.charAt(entity1);
                        actualCharNumber++;
                    }
                    break;
                case 1:
                    if (actualNumericNumber < this.numericNumber) {
                        actualChar = this.numeric.charAt(entity2);
                        actualNumericNumber++;
                    }
                    break;
                case 2:
                    if (actualPunctNumber < this.punctNumber) {
                        actualChar = this.punctuation.charAt(entity3);
                        actualPunctNumber++;
                    }
            }
            password += actualChar;
        }
        this.lastPassword = password;
        return password;
    }

    getLastPassword() {
        let passwordToReturn = this.lastPassword;
        this.lastPassword = "";
        return passwordToReturn;
    }
}