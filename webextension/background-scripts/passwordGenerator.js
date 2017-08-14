/**
* Predefined aliases for charsets
*/
const PasswordGenCharset = {
   'upper': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
   'lower': 'abcdefghijklmnopqrstuvwxyz'.split(''),
   'digit': '0123456789'.split(''),
   'punct': '!"§$%&/()=?-_,.;:#+*@[]|{}<>'.split(''),
   'umlauts': "äöüß".split(''),
   'currency': "؋​₳​฿​₿​₵​¢​₡​₢​$​₫​₯​֏​₠​€​ƒ​₣​₲​₴​₭​₺​₾​₼​ℳ​₥​₦​₧​₱​₰​£​元圆圓​﷼​៛​₽​₹₨​₪​৳​₸​₮​₩​¥円".split(''),
   'arrow': "←↑→↓↔↕↖↗↘↙↚↛↜↝↞↟↠↡↢↣↤↥↦↧↨↩↪↫↬↭↮↯↰↱↲↳↴↵↶↷↸↹↺↻↼↽↾↿⇀⇁⇂⇃⇄⇅⇆⇇⇈⇉⇊⇋⇌⇍⇎⇏⇐⇑⇒⇓⇔⇕⇖⇗⇘⇙⇚⇛⇜⇝⇞⇟⇠⇡⇢⇣⇤⇥⇦⇧⇨⇩⇪⇫⇬⇭⇮⇯⇰⇱⇲⇳⇴⇵⇶⇷⇸⇹⇺⇻⇼⇽-⇾-⇿".split(''),
   'emoji_common': [
     "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","😘","😗",
     "😙","😚","😋","😜","😝","😛","🤑","🤗","🤓","😎","🤡","🤠","😏","😒","😞","😔","😟",
     "😕","🙁","☹️","😣","😖","😫","😩","😤","😠","😡","😶","😐","😑","😯","😦","😧","😮",
     "😲","😵","😳","😱","😨","😰","😢","😥","🤤","😭","😓","😪","😴","🙄","🤔","😬","🤐",
     "🤢","🤝","👍","👎","👊","✊️","🤛","🤜","🤞","✌️","🤘","👌","👈","👉","👆","👇","☝️",
     "✋️","🤚","🖐","🖖","👋","💪","🤙","🖕"
   ],
   /**
   * @param {Character} char - character to be checked
   * @returns Returns true if char is in PasswordGenCharset
   */
   containsChar: function(char) {
     for(let set in this) {
       if(Array.isArray(this[set])) {
         for(let c in this[set]) {
           if(this[set][c] == char) return true;
         }
       }
     }
     return false;
   }
};


/**
* Cryptographically Secure Password Generator
*/
class PasswordGen {

   constructor() {
     // create objects for random nonce, hash and encryption algorithms
     try {
       this.seeder = new Randomness();
       this.hashAlgo = new Argon2();
       this.encAlgo = new Salsa20();
     }
     catch(e) {
       console.error("Could not load external scripts for password generator: " + e.message, e.code);
     }
   }


   /**
   * @param {Number} pwdLength - password length
   * @param {Array|String} charsetsArray - Array containing charset objects (see below) or JSON string representing such an array.
   * @param {Boolean} applyWhitelist - if set to true, PasswordGenCharset is used as a whitelist for filtering charsets.
   * @returns Promise that returns generated password on resolve.
   * Note: charset object consists at least of properties 'char' and 'min', e.g. {char: 'upper', min: 3}
   *       value of property 'char' can be either a string with concatinated characters, e.g. 'abcdefg0123'
   *       or one of the aliases defined in PasswordGenCharset, e.g. 'upper'
   */
   generatePassword(pwdLength, charsetsArray, applyWhitelist = false) {

     let password = '';

     try {

         let charsets = undefined;
         let charsetsMaxLength = 0;

         // validate and parse charsetsArray
         switch(typeof charsetsArray) {
           case('string'):
              // parse string as JSON
              charsets = JSON.parse(charsetsArray);
           break;

           case('object'):

              if(Array.isArray(charsetsArray)) {

                charsets = [];

                // replace charset alias with charset array
                // add counter to object
                charsetsArray.forEach(function(item, index, array) {

                      // skip the item if it has no char property
                      if(!item.hasOwnProperty('char'))
                        return;

                      // // make sure the item has the property 'min'
                      if(!item.hasOwnProperty('min'))
                        item.min = 0;

                      // add charset array to charset object for any known alias
                      if(Object.keys(PasswordGenCharset).indexOf(item.char) >= 0)
                          item.char = PasswordGenCharset[item.char];
                      // otherwise treat any string as characters and add to charset object
                      else if(typeof item.char === 'string' && item.char.length > 0) {
                          item.char = item.char.split('');
                          // apply the PasswordGenCharset as a whitelist to the charset
                          if(applyWhitelist)
                            item.char = item.char.filter(c => PasswordGenCharset.containsChar(c));
                      }


                      // find max length of charsets
                      if(item.char.length > charsetsMaxLength)
                          charsetsMaxLength = item.char.length;

                      // add counter to charset object
                      item.count = 0;

                      // push new charset item to charsets array
                      if(Array.isArray(item.char) && item.char.length > 0)
                        charsets.push(item);
                  }
                );
              }

           break;

           default:
              // if no charsets are specified or the type could not be validate,
              // use all charsets in PasswordGenCharset
              charsets = [];
              for(let alias in PasswordGenCharset)
                  charsets.push({ char: PasswordGenCharset[alias], min: 0});

         }


         // if there is no valid charsets array object, throw exception
         if(!Array.isArray(charsets))
            throw new Error("Could not parse charsetsArray parameter.");

         // how many random bytes are needed to determine each character
         let bytesNeededPerChar = Math.ceil(charsetsMaxLength / 256);


         // new PRNG object
         let prng = new PRNG(this.hashAlgo, this.encAlgo, this.seeder.getNonce());


         // get as many random bytes as needed for given password length
         return prng.getRandomBytes(pwdLength * bytesNeededPerChar)
             .then(randomBytes => {

                 let num = 0;
                 let byteCounter = 0;
                 let currentLength = 0; // we keep track of the current password length since unicode characters (multiple bytes) would count as 2 characters with attribute .length

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
                         if(pwdLength - currentLength <= sumCharsNeeded)
                             charsets = charsets.filter(charset => charset.count < charset.min);

                         // build allowedChars for this iteration
                         let allowedChars = [];
                         charsets.map(charset => allowedChars = allowedChars.concat(charset.char));

                         // add character from allowd chars with index [number mod number of allowed chars] to password
                         let nextChar = allowedChars[num % allowedChars.length];
                         password += nextChar;
                         currentLength++;

                         // increase counter in charsets
                         charsets.find(charset => charset.char.indexOf(nextChar) !== -1).count++;

                         // reset number and byteCounter
                         num = 0;
                         byteCounter = 0;
                     }
                 });

                 // Check if all minimum requirements are satisfied, otherwise print a warning
                 if(charsets.find(c => c.count < c.min) !== undefined)
                    console.warn("Password Generator: Sum of all minimum requirements is greater than specified password length. Therefore not all minimum requirements could be satisfied.");

                 // set last password and return password.
                 this.lastPassword = password;
                 return password;

             })

     } catch (e) {
         console.error("Exception in password generator: ", e.message);
         return;
     }

   }

   /**
   * @returns Returns the password and resets it to an empty string.
   */
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
