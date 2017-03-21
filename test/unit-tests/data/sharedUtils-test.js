const sourcepath = '../../../';

const should = require('should');
const sharedUtils = require(sourcepath + 'data/sharedUtils');

describe('sharedUtils',function () {
   describe('formatString',function () {
       it('should replace placeholders with correct objects',function () {
           sharedUtils.formatString('XXX{0}XXX{1}XXX','0','1').should.equal('XXX0XXX1XXX');
           sharedUtils.formatString('XXX{1}XXX{0}XXX','0','1').should.equal('XXX1XXX0XXX');
       });
       
       it('should accept empty parameters',function () {
           sharedUtils.formatString('XYZ').should.equal('XYZ');
       });

       it('should accept empty string',function () {
           sharedUtils.formatString('').should.equal('');
       });
   }) 
});