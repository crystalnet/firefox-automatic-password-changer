const sourcepath = '../../../';

const proxyquire = require('proxyquire').noCallThru();
const HashTable = require(sourcepath + 'lib/Hashtable');
const should = require('should');

const utils = proxyquire(sourcepath + 'lib/Utils', {
    'lib/Hashtable': HashTable
});

describe('Utils', function () {
    describe('getMainpageFromLink', function () {
        it('should extract host correctly', function () {
            utils.getMainPageFromLink('https://www.facebook.com/settings/password').should.be.equal('https://www.facebook.com')
        });

        it('should be empty for empty input', function () {
            utils.getMainPageFromLink('').should.be.equal('');
        });
    });

    describe('removeTrailingSlash', function () {
        it('should remove trailing slash', function () {
            utils.removeTrailingSlash('https://www.url.com/').should.be.equal('https://www.url.com');
        });

        it('should leave url as is if no trailing slash is present', function () {
            let url = 'https://www.url.com';
            utils.removeTrailingSlash(url).should.be.equal(url);
        });
    });

    describe('arraysEqual', function () {
        it('should not throw error on null', function () {
            utils.arraysEqual(null,[]).should.be.false();
            utils.arraysEqual([],null).should.be.false();
            utils.arraysEqual(null,[1]).should.be.false();
            utils.arraysEqual([1],null).should.be.false();
        });
        it('should return true if both are null', function () {
            utils.arraysEqual(null,null).should.be.true();
        });
        it('should return false if arrays have different lengths', function () {
            utils.arraysEqual([1],[1,2]).should.be.false();
        });
        it('should return true if arrays are equal', function () {
            utils.arraysEqual([1,4,3], [1,4,3]).should.be.true();
        });
        it('should return false if arrays are not equal', function () {
            utils.arraysEqual([1,4,3], [1,1,2]).should.be.false();
            utils.arraysEqual([1,4,3], [1,1,1]).should.be.false();
        });
    });
});