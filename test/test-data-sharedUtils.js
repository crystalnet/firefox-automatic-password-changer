require("./assertExtension");
const sharedUtils = require('../data/sharedUtils');


exports["test data sharedUtils formatString replace with correct objects"] = function (assert) {
    assert.announce("test data sharedUtils formatString replace with correct objects");

    let result1 = sharedUtils.formatString("XXX{0}XXX{1}XXX","0","1");
    assert.shouldBe(result1,"XXX0XXX1XXX");

    let result2 = sharedUtils.formatString("XXX{1}XXX{0}XXX","0","1");
    assert.shouldBe(result2,"XXX1XXX0XXX");
};

require("sdk/test").run(exports);
