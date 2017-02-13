const proxyquire = require('proxyquire').noCallThru();
const HashTable = require("../../../lib/Hashtable");
const should = require('should');

const utils = proxyquire("../../../lib/Utils", {
    'lib/Hashtable': HashTable
});

describe('Utils', function () {
    describe('getMainpageFromLink', function () {
        it('should extract host correctly', function () {
            utils.getMainPageFromLink("https://www.facebook.com/settings/password").should.be.equal("https://www.facebook.com")
        });
        
        it('should be empty for empty input',function () {
            utils.getMainPageFromLink("").should.be.equal("");
        });
    });
    
    describe('sleep',function () {
        it('should sleep exactly the milliseconds specified in the parameter',function () {
            let start = new Date().getTime();
            const milliseconds = 2000;
            utils.sleep(milliseconds);
            let end = new Date().getTime();
            let diff = end - start;
            diff.should.be.equal(milliseconds);
        })
    });

    describe('removeTrailingSlash',function () {
        it('should remove trailing slash',function () {
            utils.removeTrailingSlash('https://www.url.com/').should.be.equal('https://www.url.com');
        });

        it('should leave url as is if no trailing slash is present',function () {
            let url = 'https://www.url.com';
            utils.removeTrailingSlash(url).should.be.equal(url);
        });
    });
});