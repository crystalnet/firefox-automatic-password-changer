/**
 * Created by crystalneth on 10-Jun-17.
 */

describe('Player', function () {
    const blueprint2 =  {'version':1,'scope':['github.com','www.github.com'],'changeProcedure':[{'action':'Click','parameters':[1052,33,736,1366,0,'https://github.com/','true']},{'action':'Input','parameters':['U',5,2,'https://github.com/login']},{'action':'Input','parameters':['C',5,3,'https://github.com/login']},{'action':'Click','parameters':[684,355,736,1366,0,'https://github.com/login','true']},{'action':'Click','parameters':[1141,28,736,1366,0,'https://github.com/','false']},{'action':'Click','parameters':[1033,304,736,1366,0,'https://github.com/','true']},{'action':'Click','parameters':[236,172,736,1366,0,'https://github.com/settings/profile','false']},{'action':'Input','parameters':['C',20,9,'https://github.com/settings/admin']},{'action':'Input','parameters':['N',20,10,'https://github.com/settings/admin']},{'action':'Input','parameters':['N',20,11,'https://github.com/settings/admin']},{'action':'Click','parameters':[520,388,736,1366,0,'https://github.com/settings/admin','true']},{'action':'Click','parameters':[1142,30,736,1366,0,'https://github.com/settings/admin','false']},{'action':'Click','parameters':[1043,329,736,1366,0,'https://github.com/settings/admin','true']}],'pwdPolicy':[{'allowedCharacterSets':{'az':'abcdefghijklmnopqrstuvwxyz','AZ':'ABCDEFGHIJKLMNOPQRSTUVWXYZ','num':'0123456789','special':'!@#$%^*._'},'minLength':7,'maxLength':15,'compositionRequirements':[{'kind':'mustNot','num':5,'rule':{'description':'May not be the same as any of the 5 previous passwords used.','regexp':'^[password]'}},{'kind':'mustNot','num':5,'rule':{'description':'May not be the same as any of the 5 previous passwords used.','regexp':'^[password]'}},{'kind':'mustNot','num':5,'rule':{'description':'May not be the same as any of the 5 previous passwords used.','regexp':'^[password]'}},{'kind':'mustNot','num':5,'rule':{'description':'May not be the same as any of the 5 previous passwords used.','regexp':'^[password]'}},{'kind':'mustNot','num':5,'rule':{'description':'May not be the same as any of the 5 previous passwords used.','regexp':'^[password]'}},{'kind':'mustNot','num':1,'rule':{'description':'May not be the same as your username or contain your username.','regexp':'.*[username].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one number.','regexp':'.*[num].*'}},{'kind':'mustNot','num':1,'rule':{'description':'The special character cannot be the first character in the password.','regexp':'^[special].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one lower case letter.','regexp':'.*[az].*'}},{'kind':'mustNot','num':1,'rule':{'description':'May not be the same as your username or contain your username.','regexp':'.*[username].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one number.','regexp':'.*[num].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one special character.','regexp':'.*[special].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one lower case letter.','regexp':'.*[az].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one upper case letter.','regexp':'.*[AZ].*'}}]}]};
    const data = JSON.stringify(blueprint2);
    const abBlueprint = {'version': 1, 'scope': ['github.com', 'www.github.com'], 'changeProcedure': [{'action' : 'Click', 'parameters' : [1052,33,736,1366,0,'https://github.com/','true']}, {'action' : 'Input', 'parameters' : ['U',5,2,'https://github.com/login']}, {'action' : 'Input', 'parameters' : ['C',5,3,'https://github.com/login']}, {'action' : 'Click', 'parameters' : [684,355,736,1366,0,'https://github.com/login','true']}, {'action' : 'Click', 'parameters' : [1141,28,736,1366,0,'https://github.com/','false']}, {'action' : 'Click', 'parameters' : [1033,304,736,1366,0,'https://github.com/','true']}, {'action' : 'Click', 'parameters' : [236,172,736,1366,0,'https://github.com/settings/profile','false']}, {'action' : 'Input', 'parameters' : ['C',20,9,'https://github.com/settings/admin']}, {'action' : 'Input', 'parameters' : ['N',20,10,'https://github.com/settings/admin']},{'action' : 'Input', 'parameters' : ['N',20,11,'https://github.com/settings/admin']}, {'action' : 'Click', 'parameters' : [520,388,736,1366,0,'https://github.com/settings/admin','true']}, {'action' : 'Click', 'parameters' : [1142,30,736,1366,0,'https://github.com/settings/admin','false']}, {'action' : 'Click', 'parameters' : [1043,329,736,1366,0,'https://github.com/settings/admin','true']}], 'pwdPolicy' : [{'allowedCharacterSets' : {'az':'ab','AZ':'AB','num':'01','special':'$'}, 'minLength' : 4, 'maxLength' : 10, 'compositionRequirements' : [{'kind':'mustNot','num':1,'rule':{'description':'May not be the same as your username or contain your username.','regexp':'.*[username].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one number.','regexp':'.*[num].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one lower case letter.','regexp':'.*[az].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one upper case letter.','regexp':'.*[AZ].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one special character.','regexp':'.*[special].*'}},{'kind':'mustNot','num':1,'rule':{'description':'The special character cannot be the first character in the password.','regexp':'^[special].*'}},{'kind':'mustNot','num':5,'rule':{'description':'May not be the same as any of the 5 previous passwords used.','regexp':'^[password]'}}]}, {'allowedCharacterSets' : {'az' : 'abcdefghijklmnopqrstuvwxyz', 'AZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'num' : '0123456789'}, 'minLength' : 16}]};
    const abData = JSON.stringify(abBlueprint);
    const schema = '{"$schema":"http://json-schema.org/schema#","title":"Blueprint","description":"Blueprint Format Schema, DRAFT v3","type":"object","required":["version","scope","changeProcedure"],"properties":{"version":{"type":"number"},"scope":{"type":"array","description":"Scope, to which domains this blueprint applies (in particular wildcard * as for *.wikipedia.org)","items":{"type":"string"},"minItems":1,"uniqueItems":true},"changeProcedure":{"type":"array","description":"Step, by step description of the procedure to change the password","items":{"type":"object","properties":{"action":{"type":"string"},"parameters":{"type":"array","items":{"type":["string","number"]}}}},"minItems":1,"uniqueItems":true},"pwdPolicy":{"type":"array","items":{"type":"object","description":"Array of password policy descriptions for the automatic creation of new passwords, DRAFT v3","properties":{"allowedCharacterSets":{"type":"object","description":"The different sets of allowed characters. Threre are special charsets available to all policies: username (is filled with the username if available), emanresu (is filled with the reverse username if available), allASCII (represents all ASCII characters), allUnicode (represents all Unicode characters). The names of these special character sets must not be used by other charset definitions.","minProperties":1},"minLength":{"type":"number","description":"The minimum length of the password, if left out: assumed to be 1","minimum":1},"maxLength":{"type":"number","description":"The maximum length of the password, if left out: assumed to be infinite","minimum":1},"compositionRequirements":{"type":"array","description":"The list of composition requirements in this password policy. If left out: assumed that all character sets can be used in any combination.","items":{"type":"object","description":"Representations of composition requirements using rules (regexps) on the allowed character sets, which either must or must not be fulfilled by valid passwords.","required":["kind","num","rule"],"properties":{"kind":{"type":"string","enum":["must","mustNot"]},"num":{"type":"number"},"rule":{"type":"object","description":"The rule of this composition requirement as regexp.","properties":{"description":{"type":"string","description":"A textual description of the rule to display to the user in the UI."},"regexp":{"type":"string","description":"The actual regexp of the rule."}}}},"minItems":1,"uniqueItems":true}}}}}}}';
    const faulty = '[{"allowedCharacterSets":{"az":"abcdefghijklmnopqrstuvwxyz","num":"0123456789","special":"!@#$%^*._"},"minLength":8,"maxLength":30,"compositionRequirements":[{"kind":"mustNot","num":1,"rule":{"description":"May not be the same as your username or contain your username.","regexp":".*[username].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one number.","regexp":".*[num].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one lower case letter.","regexp":".*[az].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one upper case letter.","regexp":".*[AZ].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one special character.","regexp":".*[special].*"}},{"kind":"mustNot","num":1,"rule":{"description":"The special character cannot be the first character in the password.","regexp":"^[special].*"}},{"rule":{"description":"May not be the same as any of the 5 previous passwords used.","regexp":"^[password]"}}]}]';
    const faulty2 = '[{"allowedCharacterSets":{"az":"abcdefghijklmnopqrstuvwxyz","AZ":"ABCDEFGHIJKLMNOPQRSTUVWXYZ","num":"0123456789","special":"!@#$%^*._"},"minLength":0,"maxLength":30,"compositionRequirements":[{"kind":"mustNot","num":1,"rule":{"description":"May not be the same as your username or contain your username.","regexp":".*[username].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one number.","regexp":".*[num].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one lower case letter.","regexp":".*[az].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one upper case letter.","regexp":".*[AZ].*"}},{"kind":"must","num":1,"rule":{"description":"Must contain at least one special character.","regexp":".*[special].*"}},{"kind":"mustNot","num":1,"rule":{"description":"The special character cannot be the first character in the password.","regexp":"^[special].*"}},{"kind":"mustNot","num":5,"rule":{"description":"May not be the same as any of the 5 previous passwords used.","regexp":"^[password]"}}]}]';
    const player = new Player(data, schema);
    const abPlayer = new Player(abData, schema);

    // blueprint with an undefined regexp to get an false-value for the if-condition (regexp.includes(array[arrCount]))
    const blueprintRegTest =  {'version': 1, 'scope': ['github.com', 'www.github.com'], 'changeProcedure': [{'action' : 'Click', 'parameters' : [1052,33,736,1366,0,'https://github.com/','true']}, {'action' : 'Input', 'parameters' : ['U',5,2,'https://github.com/login']}, {'action' : 'Input', 'parameters' : ['C',5,3,'https://github.com/login']}, {'action' : 'Click', 'parameters' : [684,355,736,1366,0,'https://github.com/login','true']}, {'action' : 'Click', 'parameters' : [1141,28,736,1366,0,'https://github.com/','false']}, {'action' : 'Click', 'parameters' : [1033,304,736,1366,0,'https://github.com/','true']}, {'action' : 'Click', 'parameters' : [236,172,736,1366,0,'https://github.com/settings/profile','false']}, {'action' : 'Input', 'parameters' : ['C',20,9,'https://github.com/settings/admin']}, {'action' : 'Input', 'parameters' : ['N',20,10,'https://github.com/settings/admin']},{'action' : 'Input', 'parameters' : ['N',20,11,'https://github.com/settings/admin']}, {'action' : 'Click', 'parameters' : [520,388,736,1366,0,'https://github.com/settings/admin','true']}, {'action' : 'Click', 'parameters' : [1142,30,736,1366,0,'https://github.com/settings/admin','false']}, {'action' : 'Click', 'parameters' : [1043,329,736,1366,0,'https://github.com/settings/admin','true']}], 'pwdPolicy' : [{'allowedCharacterSets' : {'az' : 'abcdefghijklmnopqrstuvwxyz', 'AZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'num' : '0123456789', 'special' : '!@#$%^*._'}, 'minLength' : 7, 'maxLength' : 15, 'compositionRequirements' : [{'kind':'mustNot','num':5,'rule':{'description':'May not be the same as any of the 5 previous passwords used.','regexp':'^[password]'}},{'kind':'mustNot','num':1,'rule':{'description':'May not be the same as your username or contain your username.','regexp':'.*[username].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one number.','regexp':'.*[num].*'}},{'kind':'mustNot','num':1,'rule':{'description':'The special character cannot be the first character in the password.','regexp':'^[special].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one lower case letter.','regexp':'.*[az].*'}},{'kind':'mustNot','num':1,'rule':{'description':'May not be the same as your username or contain your username.','regexp':'.*[username].*'}},{'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one number.', 'regexp' : '.*[num].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one special character.','regexp':'.*[special].*'}},{'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one lower case letter.', 'regexp' : '.*[az].*'}},  {'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'That´s just an unexpected regexp to test.', 'regexp' : '.*[test].*'}}, {'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one upper case letter.', 'regexp' : '.*[AZ].*'}}]}]};
    const dataReg = JSON.stringify(blueprintRegTest);
    const playerReg = new Player(dataReg,schema);

    // blueprint without compositionRequirement 'password' and 'username'
    const blueprintWithout =  {'version': 1, 'scope': ['github.com', 'www.github.com'], 'changeProcedure': [{'action' : 'Click', 'parameters' : [1052,33,736,1366,0,'https://github.com/','true']}, {'action' : 'Input', 'parameters' : ['U',5,2,'https://github.com/login']}, {'action' : 'Input', 'parameters' : ['C',5,3,'https://github.com/login']}, {'action' : 'Click', 'parameters' : [684,355,736,1366,0,'https://github.com/login','true']}, {'action' : 'Click', 'parameters' : [1141,28,736,1366,0,'https://github.com/','false']}, {'action' : 'Click', 'parameters' : [1033,304,736,1366,0,'https://github.com/','true']}, {'action' : 'Click', 'parameters' : [236,172,736,1366,0,'https://github.com/settings/profile','false']}, {'action' : 'Input', 'parameters' : ['C',20,9,'https://github.com/settings/admin']}, {'action' : 'Input', 'parameters' : ['N',20,10,'https://github.com/settings/admin']},{'action' : 'Input', 'parameters' : ['N',20,11,'https://github.com/settings/admin']}, {'action' : 'Click', 'parameters' : [520,388,736,1366,0,'https://github.com/settings/admin','true']}, {'action' : 'Click', 'parameters' : [1142,30,736,1366,0,'https://github.com/settings/admin','false']}, {'action' : 'Click', 'parameters' : [1043,329,736,1366,0,'https://github.com/settings/admin','true']}], 'pwdPolicy' : [{'allowedCharacterSets' : {'az' : 'abcdefghijklmnopqrstuvwxyz', 'AZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'num' : '0123456789', 'special' : '!@#$%^*._'}, 'minLength' : 7, 'maxLength' : 15, 'compositionRequirements' : [{'kind':'must','num':1,'rule':{'description':'Must contain at least one number.','regexp':'.*[num].*'}},{'kind':'mustNot','num':1,'rule':{'description':'The special character cannot be the first character in the password.','regexp':'^[special].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one lower case letter.','regexp':'.*[az].*'}},{'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one number.', 'regexp' : '.*[num].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one special character.','regexp':'.*[special].*'}},{'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one lower case letter.', 'regexp' : '.*[az].*'}}, {'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one upper case letter.', 'regexp' : '.*[AZ].*'}}]}]};
    const dataWithout = JSON.stringify(blueprintWithout);
    const playerWithout = new Player(dataWithout, schema);

    const blueprint3 =  {'version': 1, 'scope': ['github.com', 'www.github.com'], 'changeProcedure': [{'action' : 'Click', 'parameters' : [1052,33,736,1366,0,'https://github.com/','true']}, {'action' : 'Input', 'parameters' : ['U',5,2,'https://github.com/login']}, {'action' : 'Input', 'parameters' : ['C',5,3,'https://github.com/login']}, {'action' : 'Click', 'parameters' : [684,355,736,1366,0,'https://github.com/login','true']}, {'action' : 'Click', 'parameters' : [1141,28,736,1366,0,'https://github.com/','false']}, {'action' : 'Click', 'parameters' : [1033,304,736,1366,0,'https://github.com/','true']}, {'action' : 'Click', 'parameters' : [236,172,736,1366,0,'https://github.com/settings/profile','false']}, {'action' : 'Input', 'parameters' : ['C',20,9,'https://github.com/settings/admin']}, {'action' : 'Input', 'parameters' : ['N',20,10,'https://github.com/settings/admin']},{'action' : 'Input', 'parameters' : ['N',20,11,'https://github.com/settings/admin']}, {'action' : 'Click', 'parameters' : [520,388,736,1366,0,'https://github.com/settings/admin','true']}, {'action' : 'Click', 'parameters' : [1142,30,736,1366,0,'https://github.com/settings/admin','false']}, {'action' : 'Click', 'parameters' : [1043,329,736,1366,0,'https://github.com/settings/admin','true']}], 'pwdPolicy' : [{'allowedCharacterSets' : {'az' : 'abcdefghijklmnopqrstuvwxyz', 'AZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'num' : '0123456789', 'special' : '!@#$%^*._'}, 'minLength' : 7, 'maxLength' : 15, 'compositionRequirements' : [{'kind':'must','num':1,'rule':{'description':'Must contain at least one lower case letter.','regexp':'.*[az].*'}},{'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one upper case letter.', 'regexp' : '.*[AZ].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one number.','regexp':'.*[num].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one special character.','regexp':'.*[special].*'}},{'kind':'mustNot','num':5,'rule':{'description':'May not be the same as any of the 5 previous passwords used.','regexp':'^[password]'}},{'kind':'mustNot','num':1,'rule':{'description':'May not be the same as your username or contain your username.','regexp':'.*[username].*'}},{'kind':'mustNot','num':1,'rule':{'description':'The special character cannot be the first character in the password.','regexp':'^[special].*'}},{'kind':'mustNot','num':1,'rule':{'description':'May not be the same as your username or contain your username.','regexp':'.*[username].*'}},{'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one number.', 'regexp' : '.*[num].*'}}, {'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one lower case letter.', 'regexp' : '.*[az].*'}}]}]};
    const data3 = JSON.stringify(blueprint3);
    const invokePGPlayer = new Player(data3, schema);
    const username = 'testusernameA$0';

    const blueprint4 =  {'version': 1, 'scope': ['github.com', 'www.github.com'], 'changeProcedure': [{'action' : 'Click', 'parameters' : [1052,33,736,1366,0,'https://github.com/','true']}, {'action' : 'Input', 'parameters' : ['U',5,2,'https://github.com/login']}, {'action' : 'Input', 'parameters' : ['C',5,3,'https://github.com/login']}, {'action' : 'Click', 'parameters' : [684,355,736,1366,0,'https://github.com/login','true']}, {'action' : 'Click', 'parameters' : [1141,28,736,1366,0,'https://github.com/','false']}, {'action' : 'Click', 'parameters' : [1033,304,736,1366,0,'https://github.com/','true']}, {'action' : 'Click', 'parameters' : [236,172,736,1366,0,'https://github.com/settings/profile','false']}, {'action' : 'Input', 'parameters' : ['C',20,9,'https://github.com/settings/admin']}, {'action' : 'Input', 'parameters' : ['N',20,10,'https://github.com/settings/admin']},{'action' : 'Input', 'parameters' : ['N',20,11,'https://github.com/settings/admin']}, {'action' : 'Click', 'parameters' : [520,388,736,1366,0,'https://github.com/settings/admin','true']}, {'action' : 'Click', 'parameters' : [1142,30,736,1366,0,'https://github.com/settings/admin','false']}, {'action' : 'Click', 'parameters' : [1043,329,736,1366,0,'https://github.com/settings/admin','true']}], 'pwdPolicy' : [{'allowedCharacterSets' : {'az' : 'abcdefghijklmnopqrstuvwxyz', 'AZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'num' : '0123456789', 'special' : '!@#$%^*._'}, 'minLength' : 7, 'maxLength' : 15, 'compositionRequirements' : [{'kind':'must','num':1,'rule':{'description':'Must contain at least one lower case letter.','regexp':'.*[az].*'}},{'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one upper case letter.', 'regexp' : '.*[AZ].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one number.','regexp':'.*[num].*'}},{'kind':'must','num':1,'rule':{'description':'Must contain at least one special character.','regexp':'.*[special].*'}},{'kind':'mustNot','num':5,'rule':{'description':'May not be the same as any of the 5 previous passwords used.','regexp':'^[password]'}},{'kind':'mustNot','num':1,'rule':{'description':'May not be the same as your username or contain your username.','regexp':'.*[username].*'}},{'kind':'mustNot','num':1,'rule':{'description':'The special character cannot be the first character in the password.','regexp':'^[\\S].*'}},{'kind':'mustNot','num':1,'rule':{'description':'May not be the same as your username or contain your username.','regexp':'.*[username].*'}},{'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one number.', 'regexp' : '.*[num].*'}}, {'kind' : 'must', 'num' : 1, 'rule' : {'description' : 'Must contain at least one lower case letter.', 'regexp' : '.*[az].*'}}]}]};
    const data4 = JSON.stringify(blueprint4);
    const impossiblePlayer = new Player(data4, schema);

    // blueprint with unicode
    const blueprintUnicode = {'version':0,'scope':['https://github.com'],'changeProcedure':[{'action':'Click','parameters':[1216,40,774,1708,0,'https://github.com/','true']},{'action':'Click','parameters':[870,220,774,1708,0,'https://github.com/login','false']},{'action':'Input','parameters':['U',5,2,'https://github.com/login']},{'action':'Click','parameters':[794,311,774,1708,0,'https://github.com/login','false']},{'action':'Input','parameters':['C',5,3,'https://github.com/login']},{'action':'Click','parameters':[811,345,774,1708,0,'https://github.com/login','true']},{'action':'Click','parameters':[1315,33,774,1708,0,'https://github.com/','false']},{'action':'Click','parameters':[1179,251,774,1708,0,'https://github.com/','true']},{'action':'Click','parameters':[379,158,774,1708,0,'https://github.com/settings/profile','false']},{'action':'Click','parameters':[734,180,774,1708,0,'https://github.com/settings/admin','false']},{'action':'Input','parameters':['C',21,10,'https://github.com/settings/admin']},{'action':'Input','parameters':['N',21,11,'https://github.com/settings/admin']},{'action':'Input','parameters':['N',21,12,'https://github.com/settings/admin']},{'action':'Click','parameters':[673,229,774,1708,149,'https://github.com/settings/admin','true']},{'action':'Click','parameters':[1326,33,774,1708,0,'https://github.com/settings/admin','false']},{'action':'Click','parameters':[1206,263,774,1708,0,'https://github.com/settings/admin','true']}],'pwdPolicy':[{'allowedCharacterSets':{'az':'abcdefghijklmnopqrstuvwxyz','AZ':'ABCDEFGHIJKLMNOPQRSTUVWXYZ','num':'0123456789','special':'!\“^$%\\/()=?-_,.;:#+*@[]|{}<>&`~','unicode':'unicode'},'compositionRequirements':[{'kind':'must','num':1,'rule':{'description':'Must-contain-at-least 1 lower-case-letters.','regexp':'^(([^az]*)[az]([^az]*)){1,}$'}},{'kind':'must','num':1,'rule':{'description':'Must-contain-at-least 1 capital-case-letters.','regexp':'^(([^AZ]*)[AZ]([^AZ]*)){1,}$'}},{'kind':'must','num':1,'rule':{'description':'Must-contain-at-least 1 special-characters.','regexp':'^(([^special]*)[special]([^special]*)){1,}$'}}],'minLength':7,'maxLength':15}]};
    const dataUnicode = JSON.stringify(blueprintUnicode);
    const playerUnicode = new Player(dataUnicode, schema);

    describe('#constructor()', function () {
        it('should not accept a faulty JSON as Input', function () {
            (function () {
                new Player(faulty, schema);
            }).should.throw('Blueprint doesn\'t follow JSON schema');
        });

        it('should successfully create an instance of Player', function () {
            new Player(data, schema).should.be.an.instanceOf(Player);
        });
    });

    describe('#_parseBlueprint()', function () {
        it('should have a to z property', function () {
            player._parseBlueprint(data, player.schema).pwdPolicy[0].allowedCharacterSets.az.should.equal('abcdefghijklmnopqrstuvwxyz');
        });

        it('should composition requirements as array', function () {
            player._parseBlueprint(data, player.schema).pwdPolicy[0].compositionRequirements[0].rule.description.should.equal('May not be the same as any of the 5 previous passwords used.');
        });

        it('should not accept a faulty JSON blueprint ', function () {
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

    //the following tests call _validatePassword() but necessarily test the _test() function too, as the validation function just calls upon the test function for each regular expression.
    describe('#_validatePassword()', function () {
        it('should reject a password containing only numbers', function () {
            abPlayer._validatePassword( '00000', username).should.be.false();
        });

        it('should reject a empty password', function () {
            player._validatePassword('', username).should.be.false();
        });

        it('should reject an overlong password', function () {
            player._validatePassword('123456789abcdef', username).should.be.false();
        });

        it('should reject a number as a password instead of a String', function() {
            player._validatePassword(6214332, username).should.be.false();
        });

        it('should accept a valid password', function () {
            player._validatePassword('12345678Ab$', username).should.be.true();
        });

        it('should reject the username as password', function () {
            player._validatePassword('testusernameA$0', username).should.be.false();
        });

        it('should reject a password with only lowercase letters', function () {
            player._validatePassword('asdfasdf', username).should.be.false();
        });

        it('should reject a previously used password', function () {
            player._validatePassword('P@ssword123', username).should.be.false();
        });

        // using blueprint without compositionRequirement about [password] and [username]
        it('should accept a valid password even if it´s equal to the username', function() {
            playerWithout._validatePassword('testusernameA$0', 'testusernameA$0').should.be.true();
        });

        // using blueprint included unicode as allowed charset
        it('should accept a password with unicode if this is an allowed charset', function() {
            playerUnicode._validatePassword('8Unicode!🌂😉⋚↩', username).should.be.true();
        });
    });

    // TODO: tests for the failExp descriptions
    describe('#validateUserPassword()', function () {
        it('should reject password containig excluded letters', function () {
            abPlayer.validateUserPassword('0a++BCc7&$', username).sat.should.be.false();
        });

        it('should reject a empty password', function () {
            player.validateUserPassword('', username).sat.should.be.false();
        });

        it('should reject an overlong password', function () {
            player.validateUserPassword('0123456789Ab$012345678901234567890123456789', username).sat.should.be.false();
        });

        it('should reject an too short password', function() {
            player.validateUserPassword('3.aH!#', username).sat.should.be.false();
        });

        it('should accept a valid password', function () {
            player.validateUserPassword('12345678Ab$', username).sat.should.be.true();
        });

        it('should reject the username as password', function () {
            player.validateUserPassword('testusernameA$0', username).sat.should.be.false();
        });

        it('should reject a password with only lowercase letters', function () {
            player.validateUserPassword('asdfasdf', username).sat.should.be.false();
        });

        it('should reject a previously used password', function () {
            player.validateUserPassword('P@ssword123', username).sat.should.be.false();
        });

        it('should reject a password with non ascii characters if only ascii is allowed', function () {
            player.validateUserPassword('i37.HDoe♦f', username).sat.should.be.false();
        });

        it('should accept a password with unicode if this is an allowed charset', function () {
            playerUnicode.validateUserPassword('WoW😙!⇎1🌼👻₩⊕', username).sat.should.be.true();
        });
    });

    describe('#_invokePasswordGenerator()', function () {
        it('should resolve the promise', () => {
            return invokePGPlayer._invokePasswordGenerator().should.be.fulfilled();
        });

        it('should resolve with a string', () => {
            return invokePGPlayer._invokePasswordGenerator().should.finally.be.a.String();
        });

        it('should resolve with a password', () => {
            return invokePGPlayer._invokePasswordGenerator().should.finally.not.be.empty();
        });

        // test with undefined regexp
        it('should resolve the promise', () => {
            return playerReg._invokePasswordGenerator().should.be.fulfilled();
        });

        it('should resolve the promise', () => {
            return playerUnicode._invokePasswordGenerator().should.be.fulfilled();
        });
    });

    describe('#_generateDescription()', function () {
        it('should not change a custom description', () => {
            return player._generateDescription('Custom: It´s a test description.').should.equal('It´s a test description.');
        });

        it('should not change a custom description', () => {
            return player._generateDescription('Custom: Eine deutsche Beschreibung!').should.equal('Eine deutsche Beschreibung!');
        });

        // don´t know which language will be used by identifier
        it('should change identifier to a valid description', () => {
            return player._generateDescription('do-not-use').should.be.a.String();
        });
    });

    describe('#generatePassword()', function () {
        it('should resolve the promise', () => {
            return invokePGPlayer.generatePassword(username).should.be.fulfilled();
        });

        it('should resolve with a string', () => {
            return invokePGPlayer.generatePassword(username).should.finally.be.a.String();
        });

        it('should resolve with a password', () => {
            return invokePGPlayer.generatePassword(username).should.finally.not.be.empty();
        });

        it('should return empty password when impossible policy', () => {
            return impossiblePlayer.generatePassword(username, 1).should.finally.not.be.ok();
        }).timeout(5000);
    });
});