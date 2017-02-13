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
    })
});