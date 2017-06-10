/**
 * Created by crystalneth on 10-Jun-17.
 */

const should = require('should');
describe('Player', function () {

    const Player = require('../webextension/background-scripts/player.js');
    const data = '[{"allowedCharacterSets":{"az":"abcdefghijklmnopqrstuvwxyz","AZ":"ABCDEFGHIJKLMNOPQRSTUVWXYZ","num":"0123456789","special":"!@#$%^*._"},"minLength":8,"compositionRequirements":[{"kind":"mustNot","num":1,"rule":{"description":"May not be the same as your username or contain your username.","regexp":".*[username].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one number.","regexp":".*[num].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one lower case letter.","regexp":".*[az].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one upper case letter.","regexp":".*[AZ].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one special character.","regexp":".*[special].*"}},{"kind":"mustNot","num":1,"rule":{"description":"The special character cannot be the first character in the password.","regexp":"^[special].*"}},{"kind":"mustNot","num":5,"rule":{"description":"May not be the same as any of the 5 previous passwords used.","regexp":"^[password]"}}]}]';
    const player = new Player(data);

    describe('#_parseBlueprint()', function () {
        it('should have a to z property', function () {
            player._parseBlueprint(data)[0].allowedCharacterSets.az.should.equal('abcdefghijklmnopqrstuvwxyz');
        });

        it('should composition requirements as array', function () {
            player._parseBlueprint(data)[0].compositionRequirements[0].rule.description.should.equal('May not be the same as your username or contain your username.');
        });
    });

    describe('#_invokePasswordGenerator()', function () {
        it('should return a password', function () {
            player._invokePasswordGenerator().should.be.a.String();
        });

        it('should return a password of at least 8 symbols', function () {
            player._invokePasswordGenerator().length.should.be.aboveOrEqual(8);
        });
    });

    describe('#_validateGeneratedPassword()', function () {
        it('should reject a empty password', function () {
            player._validatePassword('').should.not.be.ok;
        });

        it('should accept a valid password', function () {
            player._validatePassword('12345678Ab$').should.be.ok;
        });
    });
});
