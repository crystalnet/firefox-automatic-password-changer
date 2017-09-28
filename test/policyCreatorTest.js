/**
 * Created by Marius on 28.09.2017.
 */

describe('Player', function () {
    let policyCreator1 = new PolicyCreator();
    let policyCreator2 = new PolicyCreator();
    let policyCreator3 = new PolicyCreator();
    let policyCreator4 = new PolicyCreator();
    let policyCreator5 = new PolicyCreator();
    let policyCreator6 = new PolicyCreator();
    let policyCreator7 = new PolicyCreator();

    describe('createLength()', function () {
        policyCreator1._createLength({
            minLength: 3,
            maxLength: 6
        });

        it('should set minimum length', function () {
            policyCreator1.policy.minLength.should.equal(3);
        });
        it('should set minimum length', function () {
            policyCreator1.policy.maxLength.should.equal(6);
        });
    });

    describe('createCharactersets()', function(){
        policyCreator1._createcharacterSets({lowerAllowed: true, capitalAllowed: true, numberAllowed: true, specialAllowed: true, unicodeAllowed: true}, { lowerSet: 'abc', capitalSet: 'ABC', numberSet: '1234', specialSet: '#?()[]$%', whitespaceAllowed: true, unicode: 'unicode'});
        policyCreator2._createcharacterSets({lowerAllowed: false, capitalAllowed: false, numberAllowed: false, specialAllowed: true, unicodeAllowed: false}, {specialSet: '#?()[]$%', whitespaceAllowed: false});
        policyCreator3._createcharacterSets({lowerAllowed: false, capitalAllowed: true, numberAllowed: false, specialAllowed: false, unicodeAllowed: false}, {capitalSet: 'ABC'});

        it('should set characterSet in which all charsets are allowed including unicode and whitespace', function(){
            policyCreator1.policy.allowedCharacterSets.az.should.equal('abc');
        });
        it('should set characterSet in which all charsets are allowed including unicode and whitespace', function(){
            policyCreator1.policy.allowedCharacterSets.AZ.should.equal('ABC');
        });
        it('should set characterSet in which all charsets are allowed including unicode and whitespace', function(){
            policyCreator1.policy.allowedCharacterSets.num.should.equal('1234');
        });
        it('should set characterSet in which all charsets are allowed including unicode and whitespace', function(){
            policyCreator1.policy.allowedCharacterSets.special.should.equal('#?()[]$% ');
        });
        it('should set characterSet in which all charsets are allowed including unicode and whitespace', function(){
            policyCreator1.policy.allowedCharacterSets.unicode.should.equal('unicode');
        });

        it('should set characterSet in which only special characters are allowed without whitespace', function(){
            policyCreator2.policy.allowedCharacterSets.special.should.equal('#?()[]$%');
        });
        it('should set characterSet in which only capital letters are allowed', function(){
            policyCreator3.policy.allowedCharacterSets.AZ.should.equal('ABC');
        });
    });

    describe('createMinimumRequirement()', function(){
        policyCreator1._createMinimumRequirement({lowerAllowed: true, minLower: 1, capitalAllowed: false, minCapital: null, numberAllowed: true, minNumber: 1, specialAllowed: true, minSpecial: null});
        policyCreator2._createMinimumRequirement({lowerAllowed: false, minLower: null, capitalAllowed: true, minCapital: null, numberAllowed: true, minNumber: null,  specialAllowed: true, minSpecial: 2});
        policyCreator3._createMinimumRequirement({lowerAllowed: true, minLower: null, capitalAllowed: true, minCapital: 3, numberAllowed: false, minNumber: null, specialAllowed: false, minSpecial: null});

        it('should create requirements for the minimum amount different allowed of characters mandatory for password', function(){
            policyCreator1.policy.compositionRequirements[0].rule.description.should.equal('Must-contain-at-least 1 lower-case-letters.');
        });
        it('should create requirements for the minimum amount different allowed of characters mandatory for password', function(){
            policyCreator2.policy.compositionRequirements[0].rule.description.should.equal('Must-contain-at-least 2 special-characters.');
        });
        it('should create requirements for the minimum amount different allowed of characters mandatory for password', function(){
            policyCreator3.policy.compositionRequirements[0].rule.description.should.equal('Must-contain-at-least 3 capital-case-letters.');
        });
    });
    describe('createPositionRequirements()', function(){
        policyCreator4._createPositionRequirements([{restrictionPosition: '4', restrictionType: 'must', restrictionContent: 'capital'},{restrictionPosition: '1', restrictionType: 'mustNot', restrictionContent: 'lowercase'},{restrictionPosition: '3', restrictionType: 'must', restrictionContent: 'number'},{restrictionPosition: '5', restrictionType: 'mustNot', restrictionContent: 'special'},{restrictionPosition: '5', restrictionType: 'mustNot', restrictionContent: null}]);

        it('should create position requirement for a capital letter on position 4 in password', function(){
            policyCreator4.policy.compositionRequirements[0].rule.description.should.equal('Position: 4 must-be: a-capital-letter.');
        });
        it('should create position restriction for a lowercase letter on position 1 in password', function(){
            policyCreator4.policy.compositionRequirements[1].rule.description.should.equal('Position: 1 must-not-be: a-lowercase-letter.');
        });
        it('should create position requirement for a number on position 3 in password', function(){
            policyCreator4.policy.compositionRequirements[2].rule.description.should.equal('Position: 3 must-be: a-number.');
        });
        it('should create position restriction for a special character on position 5 in password', function(){
            policyCreator4.policy.compositionRequirements[3].rule.description.should.equal('Position: 5 must-not-be: a-special-character.');
        });

    });
    describe('createAdvancedRequirements()', function(){
        policyCreator5._createAdvancedRequirements([{customRegEx: null, customRegExDesc: null}], {usernameAllowed: true});
        policyCreator6._createAdvancedRequirements([{customRegEx: '.*[testRegex]*.', customRegExDesc: 'This is a regular expression for testing purposes.'}], {usernameAllowed: false});

        it('should create position requirement for a capital letter on position 4 in password', function(){
            policyCreator5.policy.compositionRequirements[0].rule.description.should.equal('May-not-contain-username.');
        });
        it('should create position requirement for a capital letter on position 4 in password', function(){
            policyCreator6.policy.compositionRequirements[0].rule.description.should.equal('Custom: This is a regular expression for testing purposes.');
        });

    });
    describe('createPolicy()', function(){
        policyCreator7.createPolicy({minLength: 7, maxLength: 15}, {lowerAllowed: true, capitalAllowed: true, numberAllowed: true, specialAllowed: true, unicodeAllowed: true},{ lowerSet: 'abc', capitalSet: 'ABC', numberSet: '1234', specialSet: '#?()[]$%', whitespaceAllowed: true, unicode: 'unicode'},[{restrictionPosition: '4', restrictionType: 'must', restrictionContent: 'capital'}],[{customRegEx: '.*[testRegex]*.', customRegExDesc: 'This is a regular expression for testing purposes.'}], {usernameAllowed: false});
        it('should create a valid policy', function(){
        policyCreator7.policy.minLength.should.equal(7);
        });
    });

});

