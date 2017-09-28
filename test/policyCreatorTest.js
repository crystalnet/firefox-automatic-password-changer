/**
 * Created by Marius on 28.09.2017.
 */

describe('Player', function () {
    let policyCreator = new PolicyCreator();
    describe('createLength()', function () {
        policyCreator._createLength({
            minLength: 3,
            maxLength: 6
        });

        it('should set minimum length', function () {
            policyCreator.policy.minLength.should.equal(3);
        });
        it('should set minimum length', function () {
            policyCreator.policy.maxLength.should.equal(6);
        });
    });
});

