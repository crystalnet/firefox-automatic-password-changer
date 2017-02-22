const should = require('should');
const sharedUtils = require('../../../data/sharedUtils');

describe('sharedUtils',function () {
   describe('formatString',function () {
       it('should replace placeholders with correct objects',function () {
           sharedUtils.formatString("XXX{0}XXX{1}XXX","0","1").should.equal('XXX0XXX1XXX');
           sharedUtils.formatString("XXX{1}XXX{0}XXX","0","1").should.equal('XXX1XXX0XXX');
       })
   }) 
});