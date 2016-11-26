var Recorder = require("../lib/Recorder");

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
        assert.fail("GUARD FAILED - passed arguments are not equal");
    }
}

exports["test recorder isactive should initially be false"] = function (assert) {
    var recorder = new Recorder();
    assertEqual(recorder.RecorderIsActive(), false, assert);
};

exports["test recorder getMainPageFromLink"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook.getMainPageFromLink("https://www.facebook.com/settings/password");
    assert.equal(result, "https://www.facebook.com", "example url worked");
};

// countAllChildrenOfType tests
exports["test recorder countAllChildrenOfType should find top-layer"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook.countAllChildrenOfType(testdata.rootNode, "notpw");
    assertEqual(result, 2, assert);
};
exports["test recorder countAllChildrenOfType should find in children"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook.countAllChildrenOfType(testdata.rootNode, "password");
    assertEqual(result, 1, assert);
};
exports["test recorder countAllChildrenOfType should find self"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook.countAllChildrenOfType(testdata.rootNode, "roottype");
    assertEqual(result, 2, assert);
};
exports["test recorder countAllChildrenOfType should work with not existing type"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook.countAllChildrenOfType(testdata.rootNode, "NotAType");
    assertEqual(result, 0, assert);
};

// onClick tests
/*exports["test recorder onClick submit "] = function (assert) {
 var e = {};
 var recorder = new Recorder();
 recorder.testhook.onClick(e);
 assertEqual(result, 0, assert);
 };*/

require("sdk/test").run(exports);