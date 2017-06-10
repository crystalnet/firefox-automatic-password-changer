/**
 * Created by crystalneth on 10-Jun-17.
 */

var should = require('should');
describe('Player', function () {
    describe('#test()', function () {
        it('should test test test', function () {
            var Player = require('../webextension/background-scripts/player.js');
            var player = new Player('');
            player.test(true).should.be.ok;
        });
    });
});
