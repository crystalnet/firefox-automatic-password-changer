var Recorder = require("../lib/Recorder");
var tabs = require("sdk/tabs");
var HashTable = require("../lib/Hashtable");
require("./assertExtension");

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

exports["test recorder isactive should only be active if the recorder is started"] = function (assert) {
    assert.announce("test recorder isactive should only be active if the recorder is started");
    var recorder = new Recorder();

    assert.shouldBe(recorder.RecorderIsActive(), false);
    recorder.StartRecording();
    assert.shouldBe(recorder.RecorderIsActive(), true);
    recorder.StopRecording();
    assert.shouldBe(recorder.RecorderIsActive(), false);

};

exports["test recorder getMainPageFromLink should extract host"] = function (assert) {
    assert.announce("test recorder getMainPageFromLink should extract host");
    var recorder = new Recorder();
    var result = recorder.testhook.getMainPageFromLink("https://www.facebook.com/settings/password");

    assert.shouldBe(result, "https://www.facebook.com");
};

// countAllChildrenOfType tests
exports["test recorder countAllChildrenOfType should find top-layer"] = function (assert) {
    assert.announce("test recorder countAllChildrenOfType should find top-layer");
    var recorder = new Recorder();
    var result = recorder.testhook.countAllChildrenOfType(countAllChildrenOfType_testdata.rootNode, "notpw");
    assert.shouldBe(result, 2);
};
exports["test recorder countAllChildrenOfType should find in children"] = function (assert) {
    assert.announce("test recorder countAllChildrenOfType should find in children");
    var recorder = new Recorder();
    var result = recorder.testhook.countAllChildrenOfType(countAllChildrenOfType_testdata.rootNode, "password");

    assert.shouldBe(result, 1);
};
exports["test recorder countAllChildrenOfType should find self"] = function (assert) {
    assert.announce("test recorder countAllChildrenOfType should find self");
    // this test was not working in version 0.4
    var recorder = new Recorder();
    var result = recorder.testhook.countAllChildrenOfType(countAllChildrenOfType_testdata.rootNode, "roottype");

    assert.shouldBe(result, 2);
};
exports["test recorder countAllChildrenOfType should work with not existing type"] = function (assert) {
    assert.announce("test recorder countAllChildrenOfType should work with not existing type");
    var recorder = new Recorder();
    var result = recorder.testhook.countAllChildrenOfType(countAllChildrenOfType_testdata.rootNode, "NotAType");

    assert.shouldBe(result, 0);
};

var submitOrClick_testdata = (function () {
    var url = "https://www.facebook.com/settings/password";
    var form = {
        id: "formId",
        name: "formName",
        action: "formAction",
        getElementsByName: function (name) {
            return [{value: "byname"}]
        },
        hasChildNodes: function () {
            return true;
        },
        childNodes: [{
            type: "password",
            hasChildNodes: function () {
                return false;
            }
        }]
    };
    return {
        form: form,
        formWithoutPasswordField: {
            id: "formId",
            name: "formName",
            action: "formAction",
            getElementsByName: function (name) {
                return [{value: "byname"}]
            },
            hasChildNodes: function () {
                return false;
            },
            childNodes: []
        },
        eventStub: {
            target: form
        },
        onClickEventStub: {
            target: {
                id: "submitId",
                type: "submit",
                hasChildNodes: function () {
                    return false;
                },
                form: form
            }
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

var tableEntry_header = [submitOrClick_testdata.form.id,
    submitOrClick_testdata.form.name,
    submitOrClick_testdata.url,
    submitOrClick_testdata.form.action];

function test_one_message_combination_for(recorder, assert, injectedHashTable,
                                          usernameSet, actualpasswordSet, newpasswordSet,
                                          expectedInsert, index, executeFunction) {
    // reset of submitSeen is not actually needed for onSubmitEventHandler
    recorder.testhook.resetSubmitSeen();
    var combinationToString = usernameSet + ":" + actualpasswordSet + ":" + newpasswordSet;
    if (usernameSet) {
        recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubBE1);
    }
    if (actualpasswordSet) {
        recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubAP2);
    }
    if (newpasswordSet) {
        recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubNP3);
    }
    executeFunction();
    // test if it inserted the expected result
    assert.sequenceShouldBe(injectedHashTable.getItem(index), tableEntry_header.concat(expectedInsert), "combination is " + combinationToString);

    // test if webpage was set
    assert.shouldNotBe(recorder.GetWebPage(), "", "webpage was empty for " + combinationToString);

    // test if modes were reset
    var branch = recorder.testhook.extractSubmitBranch();
    assert.shouldBe(branch.usernameSet, false, "usernameSet for " + combinationToString);
    assert.shouldBe(branch.actualPasswordSet, false, "actualPasswordSet for " + combinationToString);
    assert.shouldBe(branch.newPasswordSet, false, "newPasswordSet for " + combinationToString);
}

function test_all_message_combinations_for(recorder, assert, executeFunction) {
    var hashtable = new HashTable();
    recorder.testhook.injectTabs(submitOrClick_testdata.tabs);
    recorder.testhook.injectWindow(submitOrClick_testdata.window);
    recorder.testhook.injectUserWebPath(hashtable);

    var i = 0;
    test_one_message_combination_for(recorder, assert, hashtable, false, false, false, ["Submit"], i++, executeFunction);
    test_one_message_combination_for(recorder, assert, hashtable, false, false, true,
        ["newPasswordFieldName", "newPasswordFieldId", "1" /* numOfPWFields */, "N" /* PWInfo */, "SubmitPWChange"], i++, executeFunction);
    test_one_message_combination_for(recorder, assert, hashtable, false, true, false,
        ["passwordField", "passwordFieldId", "", "", "SubmitLogin"], i++, executeFunction);
    test_one_message_combination_for(recorder, assert, hashtable, false, true, true,
        ["1" /* numOfPWFields */, "AN" /* PWInfo */, "SubmitPWChange"], i++, executeFunction);
    test_one_message_combination_for(recorder, assert, hashtable, true, false, false,
        ["", "", "usernameField", "usernameFieldId", "SubmitLogin"], i++, executeFunction);
    //test_one_message_combination_for(recorder, assert, hashtable, true, false, true, ["passwordField", "passwordFieldId", "usernameField", "usernameFieldId", "SubmitLogin"], i++, executeFunction);
    test_one_message_combination_for(recorder, assert, hashtable, true, true, false,
        ["passwordField", "passwordFieldId", "usernameField", "usernameFieldId", "SubmitLogin"], i++, executeFunction);
    //test_one_message_combination_for(recorder, assert, hashtable, true, true, true, ["passwordField", "passwordFieldId", "usernameField", "usernameFieldId", "SubmitLogin"], i++, executeFunction);
    // TODO: test logout
}

function test_orderNumber_increase_for_all_message_combinations(recorder, assert, executeFunction) {
    var hashtable = new HashTable();
    recorder.testhook.injectTabs(submitOrClick_testdata.tabs);
    recorder.testhook.injectWindow(submitOrClick_testdata.window);
    recorder.testhook.injectUserWebPath(hashtable);

    var i = 0;
    // set actual password and username-email
    recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubAP2);
    recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubBE1);
    executeFunction();
    assert.shouldBe(hashtable.keys()[0], i++);

    // set just actualPassword
    recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubAP2);
    recorder.testhook.resetSubmitSeen();
    executeFunction();
    var keys = hashtable.keys();
    assert.shouldBe(keys[keys.length - 1], i++);

    // set just username-email
    recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubBE1);
    recorder.testhook.resetSubmitSeen();
    executeFunction();
    var keys = hashtable.keys();
    assert.shouldBe(keys[keys.length - 1], i++);

    // set actualPassword and newPassword
    recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubAP2);
    recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubNP3);
    recorder.testhook.resetSubmitSeen();
    executeFunction();
    var keys = hashtable.keys();
    assert.shouldBe(keys[keys.length - 1], i++);

    // set just newPassword
    recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubNP3);
    recorder.testhook.resetSubmitSeen();
    executeFunction();
    var keys = hashtable.keys();
    assert.shouldBe(keys[keys.length - 1], i++);

    // no field set
    recorder.testhook.resetSubmitSeen();
    executeFunction();
    var keys = hashtable.keys();
    assert.shouldBe(keys[keys.length - 1], i++);
}

// onSubmit tests
exports["test recorder onSubmit actual password and username email fields set"] = function (assert) {
    assert.announce("test recorder onSubmit actual password and username email fields set");
    var recorder = new Recorder();
    test_all_message_combinations_for(recorder, assert, function () {
        recorder.testhook.onSubmit(submitOrClick_testdata.eventStub);
    });
};
exports["test recorder onSubmit orderNumber should be increased"] = function (assert) {
    assert.announce("test recorder onSubmit orderNumber should be increased");
    var recorder = new Recorder();
    test_orderNumber_increase_for_all_message_combinations(recorder, assert, function () {
        recorder.testhook.onSubmit(submitOrClick_testdata.eventStub);
    });
};

// onClick tests
exports["test recorder onClick actual password and username email fields set"] = function (assert) {
    assert.announce("test recorder onClick actual password and username email fields set");
    var recorder = new Recorder();
    test_all_message_combinations_for(recorder, assert, function () {
        recorder.testhook.onClick(submitOrClick_testdata.onClickEventStub);
    });
};
exports["test recorder onClick orderNumber should be increased"] = function (assert) {
    assert.announce("test recorder onClick orderNumber should be increased");
    var recorder = new Recorder();
    test_orderNumber_increase_for_all_message_combinations(recorder, assert, function () {
        recorder.testhook.onClick(submitOrClick_testdata.onClickEventStub);
    });
};

exports["test recorder onClickOnSubmit no password fields"] = function (assert) {
    assert.announce("test recorder onClickOnSubmit no password fields");
    var recorder = new Recorder();
    var hashtable = new HashTable();
    recorder.testhook.injectTabs(submitOrClick_testdata.tabs);
    recorder.testhook.injectWindow(submitOrClick_testdata.window);
    recorder.testhook.injectUserWebPath(hashtable);

    recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubAP2);
    recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubBE1);
    recorder.testhook.onClick({
        target: {
            id: "submitId",
            type: "submit",
            hasChildNodes: function () {
                return false;
            },
            form: submitOrClick_testdata.formWithoutPasswordField
        }
    });
    assert.shouldBe(hashtable.length, 0);

    recorder.testhook.resetSubmitSeen();
    // ignores the password field count for now
    // TODO: check if this is the correct behavior
    recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubAP2);
    recorder.testhook.setMessageValues(submitOrClick_testdata.messageStubBE1);
    recorder.testhook.onSubmit({target: submitOrClick_testdata.formWithoutPasswordField});
    assert.shouldBe(hashtable.length, 1);
};

// test recorder onSubmit/onClick exclusiveness

require("sdk/test").run(exports);