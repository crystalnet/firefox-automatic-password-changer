var assert = require("sdk/test/assert").Assert;

Object.defineProperty(assert.prototype,"shouldBe",{
    value: function shouldBe(o1, o2, optionalMessage) {
        if (typeof optionalMessage === 'undefined') {
            optionalMessage = "";
        }
        if (o1 != o2) {
            this.fail("TEST FAILED - actual was '" + o1 + "' but '"+ o2 + "' was expected. " + optionalMessage);
        }
    }
});

Object.defineProperty(assert.prototype,"shouldNotBe",{
    value: function shouldNotBe(o1, o2, optionalMessage) {
        if (typeof optionalMessage === 'undefined') {
            optionalMessage = "";
        }
        if (o1 == o2) {
            this.fail("TEST FAILED - actual value should not be '" + o2 + "'. " + optionalMessage);
        }
    }
});

Object.defineProperty(assert.prototype,"sequenceShouldBe",{
    value: function sequenceShouldBe(actualArray, expectedArray, optionalMessage) {
        if (typeof optionalMessage === 'undefined') {
            optionalMessage = "";
        }
        for (var i = 0; i < actualArray.length; i++) {
            if (i < expectedArray.length) {
                if (actualArray[i] != expectedArray[i]) {
                    this.fail("TEST FAILED - actual was '" + actualArray[i] + "' but '"+ expectedArray[i] + "' was expected. (index " + i + "). " + message);
                }
            }
            else {
                this.fail("GUARD FAILED - arrays dont have the same length. " + optionalMessage);
            }
        }
    }
});