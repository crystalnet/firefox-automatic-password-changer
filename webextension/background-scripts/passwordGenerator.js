/**
* Predefined aliases for charsets
*/
const PasswordGenCharset = {
   'upper': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
   'lower': 'abcdefghijklmnopqrstuvwxyz'.split(''),
   'digit': '0123456789'.split(''),
   'punct': '!"§$%&/()=?-_,.;:#+*@[]|{}<>'.split('')
};


/**
* Cryptographically Secure Password Generator
*/
class PasswordGen {

   constructor() {
       this.seeder = new Randomness();
       // this.hashAlgo = new Argon2();
       // this.encAlgo = new Salsa20();
   }


   /**
   * @param {Array|String} charsetsArray - Array containing charset objects (see below) or JSON string representing such an array.
   * @param {Number} pwdLength - password length
   * @returns Promise that returns generated password on resolve.
   * Note: charset object consists at least of properties 'char' and 'min', e.g. {char: 'upper', min: 3}
   *       value of property 'char' can be either a string with concatinated characters, e.g. 'abcdefg0123'
   *       or one of the aliases defined in PasswordGenCharset, e.g. 'upper'
   */
   generatePassword(charsetsArray, pwdLength) {

     let password = '';

     try {

         let charsets = charsetsArray;
         let charsetsMaxLength = 0;

         // parse json for charsets if it's a string
         if(typeof charsetsArray === 'string')
             charsets = JSON.parse(charsets);

         // replace charset alias with charset array
         // add counter to object
         charsets.forEach(function(item, index, array) {

               // add charset array to charset object for any known alias
               if(Object.keys(PasswordGenCharset).indexOf(item.char) >= 0)
                   item.char = PasswordGenCharset[item.char];
               // otherwise treat any string as a character and add to charset object
               else if(typeof item.char === 'string')
                   item.char = item.char.split('');

               // find max length of charsets
               if(item.char.length > charsetsMaxLength)
                   charsetsMaxLength = item.char.length;

               // add counter to charset object
               item.count = 0;
           }
         );

         // how many random bytes are needed to determine each character
         let bytesNeededPerChar = Math.ceil(charsetsMaxLength / 256);


         // new PRNG object
         let prng = new PRNG(new Argon2(), new Salsa20(), this.seeder.getNonce());


         // get as many random bytes as needed for given password length
         return prng.getRandomBytes(pwdLength * bytesNeededPerChar)
             .then(randomBytes => {

                 let num = 0;
                 let byteCounter = 0;

                 randomBytes.forEach(byte => {

                     // concatenate as many consecutive random bytes as needed (bytesNeededPerChar)
                     num = (num << 8) ^ byte;
                     byteCounter++;

                     // check if we got enough bytes concatenated (i.e. number big enough)
                     if(byteCounter >= bytesNeededPerChar) {

                         // get number of chars for all unsatisfied min requirements
                         let sumCharsNeeded = 0;
                         charsets.map(charset => sumCharsNeeded += ((charset.min - charset.count) < 0)  ? 0 : charset.min - charset.count );

                         // filter/remove charsets for which the min requirement is already satisfied.
                         if(pwdLength - password.length <= sumCharsNeeded)
                             charsets = charsets.filter(charset => charset.count < charset.min);

                         // build allowedChars for this iteration
                         let allowedChars = [];
                         charsets.map(charset => allowedChars = allowedChars.concat(charset.char));

                         // add character from allowd chars with index [number mod number of allowed chars] to password
                         let nextChar = allowedChars[num % allowedChars.length];
                         password += nextChar;

                         // increase counter in charsets
                         charsets.find(charset => charset.char.indexOf(nextChar) >= 0).count++;

                         // reset number and byteCounter
                         num = 0;
                         byteCounter = 0;
                     }


                 });

                 // set last password and return password.
                 this.lastPassword = password;
                 return password;

             })
             .catch(e => console.error(e.message));



     } catch (e) {
         console.error("Unhandled exception: ", e.message);
         return;
     }

   }


   getLastPassword() {
       let pass = this.lastPassword;
       this.lastPassword = '';
       return pass;
   }

}


/**
* Cryptographically Secure PRNG
* takes random nonce as seed and returns as many random bytes as requested.
*/
class PRNG {

 constructor(algoHashing, algoEncrypt, seed) {
   this.hashAlgo = algoHashing;
   this.encAlgo = algoEncrypt;
   this.state = seed;
 }

 /**
 * @param {number} b - number of bytes to retrieve
 */
 getRandomBytes(b) {

   // create a byte array as counter with length specified in parameter b
   let counter = new Uint8Array([...Array(b)].map((_, index) => index + 1));

   // get 16 random bytes as key for Salsa20
   return this.nextState(16).then(key => this.encAlgo.encrypt(key, counter, "cd23ef45ab670189", 0))
              .catch(e => console.error(e.message, e.code));

 }



 /**
 * @param {number} b - number of bytes to retrieve
 * @return Promise which returns the b random bytes on resolve
 */
 nextState(b) {

   function* hashGenerator(algo, state, repetitions) {
     let i = 0;
     while(i < repetitions) {
       yield algo.argon2Hash({ pass: new Uint8Array([i++]), salt: state }).then(h => h.hash);
     }
   }

   return Promise.all([...hashGenerator(this.hashAlgo, this.state, 4)])
       .then(values => {
         // flatten the result array
         let x = values.reduce(
           ( acc, cur ) => {
             let a = new Uint8Array(acc.length + cur.length);
             a.set(acc);
             a.set(cur, acc.length);
             return a;
           },
           []
         );
         // override state of PRNG
         this.state = x.slice(b+1);
         // return first b random bytes
         return x.slice(0, b);
       }
       )
       .catch(e => console.error(e.message, e.code));

 }



}


/**
* Randomness source.
* must implement getNonce() which returns an array of random bytes.
*/
class Randomness {

 getNonce() {
     let nonce = new Uint8Array(16);
     window.crypto.getRandomValues(nonce);
     return nonce;
 }

}
