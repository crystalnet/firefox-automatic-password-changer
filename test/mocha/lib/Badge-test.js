const should = require('should');
const Badge = require('../../../lib/Badge');

function createButton() {
    return {
        badge: '',
        badgeColor: ''
    };
}

describe('Badge', function () {
    describe('init', function () {
        it('should initialize the badge', function () {
            let button = createButton();
            let badge = new Badge(button);
            button.badge.should.not.be.equal('');
            button.badgeColor.should.not.be.equal('');
        });
    });

    describe('set', function () {
        it('should reset the badge if value is zero', function () {
            let button = createButton();
            let badge = new Badge(button);
            badge.set(0);
            button.badge.should.be.equal('ok');
        });

        it('should set the badge to the provided value', function () {
            let button = createButton();
            let badge = new Badge(button);
            badge.set(5);
            button.badge.should.be.equal(5);
        });
    });

    describe('increment', function () {
        it('should increment badge', function () {
            let button = createButton();
            let badge = new Badge(button);
            badge.increment();
            button.badge.should.be.equal(1);
        });
    });

    describe('decrement', function () {
        it('should not decrement below zero', function () {
            let button = createButton();
            let badge = new Badge(button);
            badge.decrement();
            button.badge.should.be.equal('ok');

            badge.increment();
            button.badge.should.be.equal(1);
        });

        it('should reset if resulting value is zero', function () {
            let button = createButton();
            let badge = new Badge(button);
            badge.set(1);
            badge.decrement();
            button.badge.should.be.equal('ok');
        });

        it('should decrement the value', function () {
            let button = createButton();
            let badge = new Badge(button);
            badge.set(5);
            badge.decrement();
            button.badge.should.be.equal(4);
        })
    });

    describe('activateRecording',function () {
        it('should activate recording icon',function(){
        let button = createButton();
        let badge = new Badge(button);
        badge.activateRecording();
        button.badge.should.be.equal('rec');
        });
    });

    describe('deactivateRecording',function () {
        it('should deactivate recording icon and restore previous',function(){
            let button = createButton();
            let badge = new Badge(button);
            badge.set(11);
            badge.activateRecording();
            badge.deactivateRecording();
            button.badge.should.be.equal(11);
        });
    });
});
