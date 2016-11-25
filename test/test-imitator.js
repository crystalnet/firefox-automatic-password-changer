//import {delete_cookie} from '../lib/Imitator';//'../lib/Imitator';
var {viewFor} = require("sdk/view/core");
var windows = require("sdk/windows").browserWindows;
var window = viewFor(require("sdk/windows").browserWindows[0]);
var imitator = require("../lib/Imitator");
var test_imitator = new imitator(this, "test", "test");


//Test delete Cookie function
exports["test delete cookie 1"] = function (assert, done) {

    assert.pass("delete cookie 1 test start");
    window.content.document.cookie = "testcookie= TestCookie; expires=Thu, 18 Dec 2020 12:00:00 UTC";

    //imitator.delete_cookie("test_cookie");
    //imitator.delete_cookie("test_cookie");
    test_imitator.delete_cookie("testcookie");
    //test_imitator.delete_cookie("testCookie");
    assert.pass("Cookie: " + window.content.document.cookie);
    assert.ok(window.content.document.cookie == "testcookie= TestCookie; expires=Thu, 01 Jan 1970 00:00:01 GMT;");
    assert.pass("delete cookie 1 test ended");
    done();
};


require("sdk/test").run(exports);
