/**
 * Created by crystalneth on 10-Jun-17.
 */

const should = require('should');
describe('Player', function () {

    const Player = require('../webextension/background-scripts/player.js');
    const blueprint2 =  [{"version": 1, "scope": ["github.com", "www.github.com"], "changeProcedure": [{"action" : "Click", "parameters" : [1052,33,736,1366,0,"https://github.com/","true"]}, {"action" : "Input", "parameters" : ["U",5,2,"https://github.com/login"]}, {"action" : "Input", "parameters" : ["C",5,3,"https://github.com/login"]}, {"action" : "Click", "parameters" : [684,355,736,1366,0,"https://github.com/login","true"]}, {"action" : "Click", "parameters" : [1141,28,736,1366,0,"https://github.com/","false"]}, {"action" : "Click", "parameters" : [1033,304,736,1366,0,"https://github.com/","true"]}, {"action" : "Click", "parameters" : [236,172,736,1366,0,"https://github.com/settings/profile","false"]}, {"action" : "Input", "parameters" : ["C",20,9,"https://github.com/settings/admin"]}, {"action" : "Input", "parameters" : ["N",20,10,"https://github.com/settings/admin"]},{"action" : "Input", "parameters" : ["N",20,11,"https://github.com/settings/admin"]}, {"action" : "Click", "parameters" : [520,388,736,1366,0,"https://github.com/settings/admin","true"]}, {"action" : "Click", "parameters" : [1142,30,736,1366,0,"https://github.com/settings/admin","false"]}, {"action" : "Click", "parameters" : [1043,329,736,1366,0,"https://github.com/settings/admin","true"]}], "pwdPolicy" : [{"allowedCharacterSets" : {"az" : "abcdefghijklmnopqrstuvwxyz", "AZ" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "num" : "0123456789", "special" : "!@#$%^*._"}, "minLength" : 7, "maxLength" : 15, "compositionRequirements" : [{"kind":"mustNot","num":5,"rule":{"description":"May not be the same as any of the 5 previous passwords used.","regexp":"^[password]"}},{"kind":"mustNot","num":1,"rule":{"description":"May not be the same as your username or contain your username.","regexp":".*[username].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one number.","regexp":".*[num].*"}},{"kind":"mustNot","num":1,"rule":{"description":"The special character cannot be the first character in the password.","regexp":"^[special].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one lower case letter.","regexp":".*[az].*"}},{"kind":"mustNot","num":1,"rule":{"description":"May not be the same as your username or contain your username.","regexp":".*[username].*"}},{"kind" : "must", "num" : 1, "rule" : {"description" : "Must contain at least one number.", "regexp" : ".*[num].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one special character.","regexp":".*[special].*"}}, {"kind" : "must", "num" : 1, "rule" : {"description" : "Must contain at least one lower case letter.", "regexp" : ".*[az].*"}}]}]}];
    const data = JSON.stringify(blueprint2);
    const abBlueprint = [{"version": 1, "scope": ["github.com", "www.github.com"], "changeProcedure": [{"action" : "Click", "parameters" : [1052,33,736,1366,0,"https://github.com/","true"]}, {"action" : "Input", "parameters" : ["U",5,2,"https://github.com/login"]}, {"action" : "Input", "parameters" : ["C",5,3,"https://github.com/login"]}, {"action" : "Click", "parameters" : [684,355,736,1366,0,"https://github.com/login","true"]}, {"action" : "Click", "parameters" : [1141,28,736,1366,0,"https://github.com/","false"]}, {"action" : "Click", "parameters" : [1033,304,736,1366,0,"https://github.com/","true"]}, {"action" : "Click", "parameters" : [236,172,736,1366,0,"https://github.com/settings/profile","false"]}, {"action" : "Input", "parameters" : ["C",20,9,"https://github.com/settings/admin"]}, {"action" : "Input", "parameters" : ["N",20,10,"https://github.com/settings/admin"]},{"action" : "Input", "parameters" : ["N",20,11,"https://github.com/settings/admin"]}, {"action" : "Click", "parameters" : [520,388,736,1366,0,"https://github.com/settings/admin","true"]}, {"action" : "Click", "parameters" : [1142,30,736,1366,0,"https://github.com/settings/admin","false"]}, {"action" : "Click", "parameters" : [1043,329,736,1366,0,"https://github.com/settings/admin","true"]}], "pwdPolicy" : [{"allowedCharacterSets" : {"az":"ab","AZ":"AB","num":"01","special":"$"}, "minLength" : 4, "maxLength" : 10, "compositionRequirements" : [{"kind":"mustNot","num":1,"rule":{"description":"May not be the same as your username or contain your username.","regexp":".*[username].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one number.","regexp":".*[num].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one lower case letter.","regexp":".*[az].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one upper case letter.","regexp":".*[AZ].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one special character.","regexp":".*[special].*"}},{"kind":"mustNot","num":1,"rule":{"description":"The special character cannot be the first character in the password.","regexp":"^[special].*"}},{"kind":"mustNot","num":5,"rule":{"description":"May not be the same as any of the 5 previous passwords used.","regexp":"^[password]"}}]}, {"allowedCharacterSets" : {"az" : "abcdefghijklmnopqrstuvwxyz", "AZ" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "num" : "0123456789"}, "minLength" : 16}]}];
    const abData = JSON.stringify(abBlueprint);
    const schema = '{"$schema":"http://json-schema.org/schema#","title":"Password Composition Policy","description":"Array of password policy descriptions for the automatic creation of new passwords, DRAFT 2017-02-10","id":"URI TBD","type":"array","items":{"type":"object","properties":{"allowedCharacterSets":{"type":"object","description":"The different sets of allowed characters. There are special charsets available to all policies: username (is filled with the username if available), emanresu (is filled with the reverse username if available), allASCII (represents all ASCII characters), allUnicode (represents all Unicode characters). The names of these special character sets must not be used by other charset definitions.","minProperties":1},"minLength":{"type":"number","description":"The minimum length of the password, if left out: assumed to be 1","minimum":1},"maxLength":{"type":"number","description":"The maximum length of the password, if left out: assumed to be infinite","minimum":1},"compositionRequirements":{"type":"array","description":"The list of composition requirements in this password policy. If left out: assumed that all character sets can be used in any combination.","items":{"type":"object","description":"Representations of composition requirements using rules (regexps) on the allowed character sets, which either must or must not be fulfilled by valid passwords.","required":["kind","num","rule"],"properties":{"kind":{"type":"string","enum":["must","mustNot"]},"num":{"type":"number"},"rule":{"type":"object","description":"The rule of this composition requirement as regexp.","properties":{"description":{"type":"string","description":"A textual description of the rule to display to the user in the UI."},"regexp":{"type":"string","description":"The actual regexp of the rule."}}}},"minItems":1,"uniqueItems":true}}}}}';
    const faulty = '[{"allowedCharacterSets":{"az":"abcdefghijklmnopqrstuvwxyz","num":"0123456789","special":"!@#$%^*._"},"minLength":8,"maxLength":30,"compositionRequirements":[{"kind":"mustNot","num":1,"rule":{"description":"May not be the same as your username or contain your username.","regexp":".*[username].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one number.","regexp":".*[num].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one lower case letter.","regexp":".*[az].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one upper case letter.","regexp":".*[AZ].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one special character.","regexp":".*[special].*"}},{"kind":"mustNot","num":1,"rule":{"description":"The special character cannot be the first character in the password.","regexp":"^[special].*"}},{"rule":{"description":"May not be the same as any of the 5 previous passwords used.","regexp":"^[password]"}}]}]';
    const faulty2 = '[{"allowedCharacterSets":{"az":"abcdefghijklmnopqrstuvwxyz","AZ":"ABCDEFGHIJKLMNOPQRSTUVWXYZ","num":"0123456789","special":"!@#$%^*._"},"minLength":0,"maxLength":30,"compositionRequirements":[{"kind":"mustNot","num":1,"rule":{"description":"May not be the same as your username or contain your username.","regexp":".*[username].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one number.","regexp":".*[num].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one lower case letter.","regexp":".*[az].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one upper case letter.","regexp":".*[AZ].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one special character.","regexp":".*[special].*"}},{"kind":"mustNot","num":1,"rule":{"description":"The special character cannot be the first character in the password.","regexp":"^[special].*"}},{"kind":"mustNot","num":5,"rule":{"description":"May not be the same as any of the 5 previous passwords used.","regexp":"^[password]"}}]}]';
    const player = new Player(data, schema);
    const abPlayer = new Player(abData, schema);


    //tests for the parse blueprint function
    describe('#_parseBlueprint()', function () {
        it('should have a to z property', function () {
            player._parseBlueprint(data, player.schema)[0].pwdPolicy[0].allowedCharacterSets.az.should.equal('abcdefghijklmnopqrstuvwxyz');
        });

        it('should composition requirements as array', function () {
            player._parseBlueprint(data, player.schema)[0].pwdPolicy[0].compositionRequirements[0].rule.description.should.equal('May not be the same as any of the 5 previous passwords used.');
        });


        it('should not accept a faulty JSON blueprint with no A-Z specification', function () {

            (function () {
                player._parseBlueprint(faulty, player.schema);
            }).should.throw('Blueprint doesn\'t follow JSON schema');
        });
        it('should not accept a faulty JSON blueprint', function () {

            (function () {
                player._parseBlueprint(faulty2, player.schema);
            }).should.throw('Blueprint doesn\'t follow JSON schema');
        });

    });

    /*describe('#_invokePasswordGenerator()', function () {

        it('should return a password', function () {

            player._invokePasswordGenerator().should.be.String();

        });

    });
    */

    describe('#_new_Player()', function () {
        it('should not accept a faulty JSON as Input', function () {
            (function () {
                new Player(faulty, schema);
            }).should.throw('Blueprint doesn\'t follow JSON schema');
        });

        it('should successfully create an instance of Player', function () {

            new Player(data, schema).should.be.an.instanceOf(Player);

        });

    });


    //the following tests call _validateGeneratedPassword() but necessarily test the _test() function too, as the validation function just calls upon the test function for each regular expression.
    describe('#_validateGeneratedPassword()', function () {
        it('should reject password containig excluded letters', function () {
            abPlayer._validatePassword('0aBCc7&$', abPlayer.blueprint).should.be.false();
        });

        it('should reject a empty password', function () {
            player._validatePassword('', player.blueprint).should.be.false();
        });
        it('should reject an overlong password', function () {
            player._validatePassword('0123456789Ab$012345678901234567890123456789').should.be.false();
        })
        it('should accept a valid password', function () {
            player._validatePassword('12345678Ab$', player.blueprint).should.be.true();
        });
        it('should reject the username as password', function () {
            player._validatePassword('testusernameA$0', player.blueprint).should.be.false();
        });
        it('should reject a password with only lowercase letters', function () {
            player._validatePassword('asdfasdf', player.blueprint).should.be.false();
        });

        it('should reject a previously used password', function () {
            player._validatePassword('P@ssword123', player.blueprint).should.be.false();
        });
    });
    //#TODO: tests for the failExp descriptions
    describe('#validateUserPassword()', function () {
        it('should reject password containig excluded letters', function () {
            abPlayer.validateUserPassword('0a++BCc7&$', abPlayer.blueprint).sat.should.be.false();
        });

        it('should reject a empty password', function () {
            player.validateUserPassword('', player.blueprint).sat.should.be.false();
        });
        it('should reject an overlong password', function () {
            player.validateUserPassword('0123456789Ab$012345678901234567890123456789').sat.should.be.false();
        })
        it('should accept a valid password', function () {
            player.validateUserPassword('12345678Ab$', player.blueprint).sat.should.be.true();
        });
        it('should reject the username as password', function () {
            player.validateUserPassword('testusernameA$0', player.blueprint).sat.should.be.false();
        });
        it('should reject a password with only lowercase letters', function () {
            player.validateUserPassword('asdfasdf', player.blueprint).sat.should.be.false();
        });

        it('should reject a previously used password', function () {
            player.validateUserPassword('P@ssword123', player.blueprint).sat.should.be.false();
        });
    });

});

