/**
 * Created by crystalneth on 10-Jun-17.
 */

const should = require('should');
describe('Player', function () {

    const Player = require('../webextension/background-scripts/player.js');
    const data = '[{"allowedCharacterSets":{"az":"abcdefghijklmnopqrstuvwxyz","AZ":"ABCDEFGHIJKLMNOPQRSTUVWXYZ","num":"0123456789","special":"!@#$%^*._"},"minLength":8,"compositionRequirements":[{"kind":"mustNot","num":1,"rule":{"description":"May not be the same as your username or contain your username.","regexp":".*[username].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one number.","regexp":".*[num].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one lower case letter.","regexp":".*[az].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one upper case letter.","regexp":".*[AZ].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one special character.","regexp":".*[special].*"}},{"kind":"mustNot","num":1,"rule":{"description":"The special character cannot be the first character in the password.","regexp":"^[special].*"}},{"kind":"mustNot","num":5,"rule":{"description":"May not be the same as any of the 5 previous passwords used.","regexp":"^[password]"}}]}]';
    const schema = '{"$schema":"http://json-schema.org/schema#","title":"Password Composition Policy","description":"Array of password policy descriptions for the automatic creation of new passwords, DRAFT 2017-02-10","id":"URI TBD","type":"array","items":{"type":"object","properties":{"allowedCharacterSets":{"type":"object","description":"The different sets of allowed characters. Threre are special charsets available to all policies: username (is filled with the username if available), emanresu (is filled with the reverse username if available), allASCII (represents all ASCII characters), allUnicode (represents all Unicode characters). The names of these special character sets must not be used by other charset definitions.","minProperties":1},"minLength":{"type":"number","description":"The minimum length of the password, if left out: assumed to be 1","minimum":1},"maxLength":{"type":"number","description":"The maximum length of the password, if left out: assumed to be infinite","minimum":1},"compositionRequirements":{"type":"array","description":"The list of composition requirements in this password policy. If left out: assumed that all character sets can be used in any combination.","items":{"type":"object","description":"Representations of composition requirements using rules (regexps) on the allowed character sets, which either must or must not be fulfilled by valid passwords.","required":["kind","num","rule"],"properties":{"kind":{"type":"string","enum":["must","mustNot"]},"num":{"type":"number"},"rule":{"type":"object","description":"The rule of this composition requirement as regexp.","properties":{"description":{"type":"string","description":"A textual description of the rule to display to the user in the UI."},"regexp":{"type":"string","description":"The actual regexp of the rule."}}}},"minItems":1,"uniqueItems":true}}}}}';
    const player = new Player(data, schema);

    describe('#_parseBlueprint()', function () {
        it('should have a to z property', function () {
            player._parseBlueprint(data, player.schema)[0].allowedCharacterSets.az.should.equal('abcdefghijklmnopqrstuvwxyz');
        });

        it('should composition requirements as array', function () {
            player._parseBlueprint(data, player.schema)[0].compositionRequirements[0].rule.description.should.equal('May not be the same as your username or contain your username.');
        });
    });

    describe('#_invokePasswordGenerator()', function () {
        it('should return a password', function () {
            player._invokePasswordGenerator().should.be.a.String();
        });
    });

    describe('#_validateGeneratedPassword()', function () {
        it('should reject a empty password', function () {
            player._validatePassword('', player.blueprint).should.not.be.ok;
        });

        it('should accept a valid password', function () {
            player._validatePassword('12345678Ab$', player.blueprint).should.be.ok;
        });

        it('should reject a password with only lowercase letters', function () {
            player._validatePassword('asdfasdf', player.blueprint).should.not.be.ok;
        });

        it('should reject a previously used password', function () {
            player._validatePassword('P@ssword123', player.blueprint).should.not.be.ok;
        });
    });
});
