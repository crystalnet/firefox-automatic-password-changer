/*
 This is a simple password generator
a new instance of this class gets 4 parameter
passwordLength: Length of the password that will be generated
numericNumber: how much numeric character should be in the generated password
charNumber: how much string character should be in the generated password
punctNumber: how much punctuations should be in the generated password
(Attention! it must be : passwordLength = numericNumber + punctNumber + charNumber)
return value is a generated password
*/

var string = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
var numeric = '0123456789';
var punctuation = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
var password = "";
var actualChar = "";
var actualCharNumber = 0;
var actualNumericNumber = 0;
var actualPunctNumber = 0;
var luckyNumber;

module.exports = function PasswordGen(passwordLength,numericNumber,charNumber,punctNumber){

    

    this.GeneratePassword = function(){
    	password = "";

    	if((numericNumber+charNumber+punctNumber) != passwordLength){
			console.log("Invalid parameter at PasswordGen!");
			console.log("numericNumber+charNumber+punctNumber = " + (numericNumber+charNumber+punctNumber) + " but passwordLength is " + PasswordGen);
			console.log("These values must be equal!");
		}

		while(password.length<passwordLength) {
	        entity1 = Math.floor(string.length * Math.random()*Math.random());
	        entity2 = Math.ceil(numeric.length * Math.random()*Math.random());
	        entity3 = Math.floor(punctuation.length * Math.random()*Math.random());

	        luckyNumber = (Math.floor(Math.random() * 10) % 3); 

	        switch(luckyNumber){
	        	case 0: if(actualCharNumber < charNumber){
	        				actualChar = string.charAt( entity1 );;
	        				actualCharNumber++;
	        			}
	        			break;
	        	case 1: if(actualNumericNumber < numericNumber){
	        				actualChar = numeric.charAt( entity2 );
	        				actualNumericNumber++;
	        			}
	        			break;
	        	case 2: if(actualPunctNumber < punctNumber){
	        			actualChar = punctuation.charAt( entity3 );
	        			actualPunctNumber++;
	        		}
	        }
	        password += actualChar;
	        actualChar = "";
	        
    	}
    	actualCharNumber = 0;
		actualNumericNumber = 0;
		actualPunctNumber = 0;
    	return password;
	}
}