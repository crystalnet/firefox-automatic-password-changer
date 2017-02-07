/*
 * This provides should behavior for jpm tests
 */

const assert = require("sdk/test/assert");

function tryPrintMessage(message) {
    let optionalMessage = "";
    if (typeof message !== 'undefined') {
        optionalMessage = "Message: '" + message + "'.";
    }
    return optionalMessage;
}

Object.defineProperty(assert.prototype, "shouldBe", {
    value: function shouldBe(o1, o2, optionalMessage) {
        if (o1 != o2) {
            this.fail("TEST FAILED - actual was '" + o1 + "' but '" + o2 + "' was expected. " + tryPrintMessage(optionalMessage));
        }
    }
});

Object.defineProperty(assert.prototype, "shouldNotBe", {
    value: function shouldNotBe(o1, o2, optionalMessage) {
        if (o1 == o2) {
            this.fail("TEST FAILED - actual value should not be '" + o2 + "'. " + tryPrintMessage(optionalMessage));
        }
    }
});

Object.defineProperty(assert.prototype, "sequenceShouldBe", {
    value: function sequenceShouldBe(actualArray, expectedArray, optionalMessage) {
        if (typeof actualArray === 'undefined') {
            this.fail("TEST FAILED - actualArray was undefined. " + tryPrintMessage(optionalMessage));
            return;
        }
        // no need to test expectedArray for undefined, since that is the responsibility of the test developer

        for (let i = 0; i < actualArray.length; i++) {
            if (i < expectedArray.length) {
                if (actualArray[i] != expectedArray[i]) {
                    this.fail("TEST FAILED - actual was '" + actualArray[i] + "' but '" + expectedArray[i] + "' was expected. (index " + i + "). " + tryPrintMessage(optionalMessage));
                }
            }
            else {
                this.fail("TEST FAILED - arrays dont have the same length. " + tryPrintMessage(optionalMessage));
            }
        }
    }
});

Object.defineProperty(assert.prototype, "shouldBeTrue", {
    value: function shouldBe(o1, optionalMessage) {
        if (!o1) {
            this.fail("TEST FAILED - condition was not true, but it should be. " + tryPrintMessage(optionalMessage));
        }
    }
});

Object.defineProperty(assert.prototype, "announce", {
    value: function announce(message) {
        console.log("Test '" + message + "' started.");
    }
});
// Object.defineProperty(assert.prototype, "pass", {
//     value: function pass(message) {
//         console.log("Test message: " + message);
//     }
// });