var Recorder = require("../lib/Recorder");
var tabs = require("sdk/tabs");
var HashTable = require("../lib/Hashtable");

var countAllChildrenOfType_testdata = (function () {
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

function assertShouldBe(o1, o2, assert, message) {
    if (typeof message === 'undefined') {
        message = "";
    }
    if (o1 != o2) {
        assert.fail("GUARD FAILED - actual was '" + o1 + "' but '"+ o2 + "' was expected. " + message);
    }
}

function assertShouldNotBe(o1, o2, assert, message) {
    if (typeof message === 'undefined') {
        message = "";
    }
    if (o1 == o2) {
        assert.fail("GUARD FAILED - actual value should not be '" + o2 + "'. " + message);
    }
}

function assertSequenceEquals(actualArray, expectedArray, assert, message) {
    if (typeof message === 'undefined') {
        message = "";
    }
    for (var i = 0; i < actualArray.length; i++) {
        if (i < expectedArray.length) {
            if (actualArray[i] != expectedArray[i]) {
                assert.fail("GUARD FAILED - actual was '" + actualArray[i] + "' but '"+ expectedArray[i] + "' was expected. (index " + i + "). " + message);
            }
        }
        else {
            assert.fail("GUARD FAILED - arrays dont have the same length. " + message);
        }
    }
}

exports["test recorder isactive should initially be false"] = function (assert) {
    var recorder = new Recorder();

    assertShouldBe(recorder.RecorderIsActive(), false, assert);
};

exports["test recorder getMainPageFromLink should extract host"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook.getMainPageFromLink("https://www.facebook.com/settings/password");

    assertShouldBe(result, "https://www.facebook.com", assert);
};

// countAllChildrenOfType tests
exports["test recorder countAllChildrenOfType should find top-layer"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook.countAllChildrenOfType(countAllChildrenOfType_testdata.rootNode, "notpw");
    assertShouldBe(result, 2, assert);
};
exports["test recorder countAllChildrenOfType should find in children"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook.countAllChildrenOfType(countAllChildrenOfType_testdata.rootNode, "password");

    assertShouldBe(result, 1, assert);
};
exports["test recorder countAllChildrenOfType should find self"] = function (assert) {
    // this test was not working in version 0.4
    var recorder = new Recorder();
    var result = recorder.testhook.countAllChildrenOfType(countAllChildrenOfType_testdata.rootNode, "roottype");

    assertShouldBe(result, 2, assert);
};
exports["test recorder countAllChildrenOfType should work with not existing type"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.testhook.countAllChildrenOfType(countAllChildrenOfType_testdata.rootNode, "NotAType");

    assertShouldBe(result, 0, assert);
};

// onClick tests
var onSubmit_testdata = (function () {
    var url = "https://www.facebook.com/settings/password";
    var form = {
        id: "formId",
        name: "formName",
        action: "formAction",
        getElementsByName: function (name) {
            return [{value: "byname"}]
        },
        hasChildNodes: function () {
            return false;
        }
    };
    return {
        form: form,
        eventStub: {
            target: form
        },
        url: url,
        tabs: {activeTab: {url: url}},
        window: {
            content: {
                document: {
                    getElementsByName: function (field) {
                        return [{value: "byname"}];
                    },
                    getElementById: function (id) {
                        return [{value: "byid"}];
                    },
                }
            }
        },
        // sets UsernameEmailFieldSet
        messageStubBE1: ["BE1", "", "", "usernameFieldId", "usernameField", "", "formSubmitUrl"],

        // sets actualPasswordFieldSet
        messageStubAP2: ["AP2", "", "", "passwordFieldId", "passwordField", "", "formSubmitUrl"],

        // sets newPasswordFieldSet
        messageStubNP3: ["NP3", "", "", "newPasswordFieldId", "newPasswordFieldName", "", "formSubmitUrl"],

        messageStubLogout: ["Logout"]
    };
})();
var onSubmit_header = [onSubmit_testdata.form.id, onSubmit_testdata.form.name, onSubmit_testdata.url, onSubmit_testdata.form.action];
exports["test recorder onSubmit actual password and username email fields set"] = function (assert) {
    var hashtable = new HashTable();
    var recorder = new Recorder();
    recorder.testhook.injectTabs(onSubmit_testdata.tabs);
    recorder.testhook.injectWindow(onSubmit_testdata.window)
    recorder.testhook.injectUserWebPath(hashtable);

    var i = 0;
    test_onSubmit_combination(recorder, assert, hashtable, false, false, false, ["Submit"], i++);
    test_onSubmit_combination(recorder, assert, hashtable, false, false, true, ["newPasswordFieldName", "newPasswordFieldId", "0" /* numOfPWFields */, "N" /* PWInfo */, "SubmitPWChange"], i++);
    test_onSubmit_combination(recorder, assert, hashtable, false, true, false, ["passwordField", "passwordFieldId", "", "", "SubmitLogin"], i++);
    test_onSubmit_combination(recorder, assert, hashtable, false, true, true, ["0" /* numOfPWFields */, "AN" /* PWInfo */, "SubmitPWChange"], i++);
    test_onSubmit_combination(recorder, assert, hashtable, true, false, false, ["", "", "usernameField", "usernameFieldId", "SubmitLogin"], i++);
    //test_onSubmit_combination(recorder, assert, hashtable, true, false, true, ["passwordField", "passwordFieldId", "usernameField", "usernameFieldId", "SubmitLogin"], i++);
    test_onSubmit_combination(recorder, assert, hashtable, true, true, false, ["passwordField", "passwordFieldId", "usernameField", "usernameFieldId", "SubmitLogin"], i++);
    //test_onSubmit_combination(recorder, assert, hashtable, true, true, true, ["passwordField", "passwordFieldId", "usernameField", "usernameFieldId", "SubmitLogin"], i++);

    // TODO: test logout
};

function test_onSubmit_combination(recorder, assert, injectedHashTable, usernameSet, actualpasswordSet, newpasswordSet, expectedInsert, index) {
    var combinationToString = usernameSet + ":" + actualpasswordSet + ":" + newpasswordSet;
    if (usernameSet) {
        recorder.testhook.setMessageValues(onSubmit_testdata.messageStubBE1);
    }
    if (actualpasswordSet) {
        recorder.testhook.setMessageValues(onSubmit_testdata.messageStubAP2);
    }
    if (newpasswordSet) {
        recorder.testhook.setMessageValues(onSubmit_testdata.messageStubNP3);
    }

    recorder.testhook.onSubmit(onSubmit_testdata.eventStub);

    // test if it inserted the expected result
    assertSequenceEquals(injectedHashTable.getItem(index), onSubmit_header.concat(expectedInsert), assert, "combination is " + combinationToString);

    // test if webpage was set
    assertShouldNotBe(recorder.GetWebPage4PWChange(), "", assert, "webpage was empty for " + combinationToString);

    // test if modes were reset
    var branch = recorder.testhook.extractSubmitBranch();
    assertShouldBe(branch.usernameSet, false, assert, "usernameSet for " + combinationToString);
    assertShouldBe(branch.actualPasswordSet, false, assert, "actualPasswordSet for " + combinationToString);
    assertShouldBe(branch.newPasswordSet, false, assert, "newPasswordSet for " + combinationToString);
}

exports["test recorder onSubmit orderNumber should be increased"] = function (assert) {
    var hashtable = new HashTable();
    var recorder = new Recorder();
    recorder.testhook.injectTabs(onSubmit_testdata.tabs);
    recorder.testhook.injectWindow(onSubmit_testdata.window)
    recorder.testhook.injectUserWebPath(hashtable);

    // set actual password and username-email
    recorder.testhook.setMessageValues(onSubmit_testdata.messageStubAP2);
    recorder.testhook.setMessageValues(onSubmit_testdata.messageStubBE1);
    recorder.testhook.onSubmit(onSubmit_testdata.eventStub);
    assertShouldBe(hashtable.keys()[0], 0, assert);

    // set just actualPassword
    recorder.testhook.setMessageValues(onSubmit_testdata.messageStubAP2);
    recorder.testhook.onSubmit(onSubmit_testdata.eventStub);
    var keys = hashtable.keys();
    assertShouldBe(keys[keys.length - 1], 1, assert);

    // set just username-email
    recorder.testhook.setMessageValues(onSubmit_testdata.messageStubBE1);
    recorder.testhook.onSubmit(onSubmit_testdata.eventStub);
    var keys = hashtable.keys();
    assertShouldBe(keys[keys.length - 1], 2, assert);

    // set actualPassword and newPassword
    recorder.testhook.setMessageValues(onSubmit_testdata.messageStubAP2);
    recorder.testhook.setMessageValues(onSubmit_testdata.messageStubNP3);
    recorder.testhook.onSubmit(onSubmit_testdata.eventStub);
    var keys = hashtable.keys();
    assertShouldBe(keys[keys.length - 1], 3, assert);

    // set just newPassword
    recorder.testhook.setMessageValues(onSubmit_testdata.messageStubNP3);
    recorder.testhook.onSubmit(onSubmit_testdata.eventStub);
    var keys = hashtable.keys();
    assertShouldBe(keys[keys.length - 1], 4, assert);

    // no field set
    recorder.testhook.onSubmit(onSubmit_testdata.eventStub);
    var keys = hashtable.keys();
    assertShouldBe(keys[keys.length - 1], 5, assert);
};

// test recorder onSubmit/onClick exclusiveness

require("sdk/test").run(exports);