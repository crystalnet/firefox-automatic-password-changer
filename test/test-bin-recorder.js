var Recorder = require("../lib/Recorder");

exports["test recorder isactive should initially be false"] = function (assert) {
    var recorder = new Recorder();
    assert.ok(recorder.RecorderIsActive() === false, "initial is not active");
};

exports["test recorder _ getMainPageFromLink"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook("getMainPageFromLink")("https://www.facebook.com/settings/password");
    assert.equal(result, "https://www.facebook.com", "example url worked");
};

var testdata = (function () {
    var pwType = {
        type: "password",
        hasChildNodes: function () {
            return false;
        }
    };
    var otherType = {
        type: "roottype",
        childNodes: [pwType],
        hasChildNodes: function () {
            return true;
        }
    };
    var notPwType = {
        type: "notpw",
        hasChildNodes: function () {
            return false;
        }
    };
    return {
        rootNode: {
            type: "roottype",
            childNodes: [notPwType, notPwType, otherType],
            hasChildNodes: function () {
                return true;
            }
        }
    };
})();

function assertEqual(o1, o2, assert) {
    if (o1 != o2) {
        assert.fail("EQUAL FAILED");
    }
}

exports["test recorder _ countAllChildrenOfType find top-layer"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook("countAllChildrenOfType")(testdata.rootNode, "notpw");
    assertEqual(result, 2, assert);
};
exports["test recorder _ countAllChildrenOfType find children"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook("countAllChildrenOfType")(testdata.rootNode, "password");
    assertEqual(result, 1, assert);
};
exports["test recorder _ countAllChildrenOfType find self"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook("countAllChildrenOfType")(testdata.rootNode, "roottype");
    assertEqual(result, 2, assert);
};
exports["test recorder _ countAllChildrenOfType not found"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook("countAllChildrenOfType")(testdata.rootNode, "NOTATYPE");
    assertEqual(result, 0, assert);
};

require("sdk/test").run(exports);