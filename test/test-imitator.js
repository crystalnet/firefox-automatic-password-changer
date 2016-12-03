//import {delete_cookie} from '../lib/Imitator';//'../lib/Imitator';
var {viewFor} = require("sdk/view/core");
var imitator = require("../lib/Imitator");
var Recorder = require("../lib/Recorder");
var Hashtable = require('lib/Hashtable');
var assertex = require('./assertExtension');

exports["test delete cookie"] = function (assert, done) {
    var test_imitator = new imitator(this, "test", "https://www.google.de");
    assert.pass("begin test delete cookie");
    var windowTest = {content: {document: {cookie: "cookie= TestCookie; expires=Thu, 18 Dec 2020 12:00:00 UTC"}}};
    test_imitator.testhook.setWindow(windowTest);
    test_imitator.testhook.delete_cookie("cookie");
    var before = windowTest.content.document.cookie.toString();
    var after = "cookie=; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    assert.shouldBe(before, after);
    done();
};
/**
exports["test open new window"] = function (assert, done) {
    assert.pass("begin test open new window");
    var test_imitator = new imitator(this,"test", "http://pfadfinderhaus.de");
    var windows = require("sdk/windows").browserWindows;
    var window = viewFor(require("sdk/windows").browserWindows[0]);
    test_imitator.testhook.setWindow(window);
    test_imitator.testhook.openNewWindow();
    assert.ok(test_imitator.testhook.returnHiddenWin.content.document.location.toString().startsWith("pfadfinderhaus.de"), "Compare before / after");
    done();
};

exports["test change site function"] = function (assert, done) {
    assert.pass("begin test change site function");
    var test_imitator = new imitator(this, "http://google.de", "test");
    window.content.document.location = "http://google.de";
    test_imitator.testhook.setHiddenWin(window);
    var link = "http://www.pfadfinderhaus.de";
    test_imitator.testhook.changeWebsite(link);
    assert.ok(test_imitator.testhook.returnHiddenWin.content.document.location.toString().startsWith(link), "true");
    done();
};
 **/
exports["test sleep 1"] = function (assert, done) {
    assert.pass("begin test sleep");
    var test_imitator = new imitator(this, "http://google.de", "test");
    var start = new Date().getTime();
    var milliseconds = 2000;
    test_imitator.testhook.sleep(milliseconds);
    var end = new Date().getTime();
    assert.shouldBe(start + milliseconds, end);
    done();
};

exports["test determine event after submit"] = function (assert, done) {
    assert.pass("begin test determine event after submit");
    var hashtable = new Hashtable();
    hashtable.setItem(0, "zero");
    hashtable.setItem(1, [1, this, this, this, "Input"]);
    hashtable.setItem(2, "two");
    hashtable.setItem(3, [3, this, this, this, "Input"]);
    hashtable.setItem(4, [4, this, this, this, "Click"]);
    hashtable.setItem(5, "five");
    var test_imitator = new imitator(hashtable, "test", "https://www.google.de");
    test_imitator.testhook.actualStepNum(3);
    var nextStep = test_imitator.testhook.determineEventAfterSubmit();
    assert.shouldBe(nextStep, 5);
    done();
};
//SubmitPWChange
exports["test is password change"] = function (assert, done) {
    assert.pass("begin test is password change");
    var hashtable = new Hashtable();
    hashtable.setItem(0, "zero");
    hashtable.setItem(1, [1, this, this, this, "Input"]);
    hashtable.setItem(2, "two");
    hashtable.setItem(3, [3, this, this, this, "SubmitPWChange"]);
    hashtable.setItem(4, [4, this, this, this, "Click"]);
    hashtable.setItem(5, "five");
    var test_imitator = new imitator(hashtable, "test", "https://www.google.de");
    var b = test_imitator.testhook.isPWChange(hashtable);
    assert.shouldBe(b, true);
    done();
};

 exports["test get main page from link 1"] = function(assert, done){
     assert.pass("begin test get main page from link 1");
    var test_imitator = new imitator(this, "test", "https://www.google.de");
     var link = test_imitator.testhook.getMainPageFromLink("http://facebook.com/dingsda?ee=aa");
     assert.shouldBe(link, "http://facebook.com");
    done();
 };

exports["test get main page from link 2"] = function (assert, done) {
    assert.pass("begin test get main page from link 2");
    var test_imitator = new imitator(this, "test", "https://www.google.de");
    var link = test_imitator.testhook.getMainPageFromLink("");
    assert.shouldBe(link, "");
    done();
};

exports["test get last index of input 1"] = function (assert, done) {
    assert.pass("begin test get last index of input 1");
    var test_imitator = new imitator(this, "test", "https://www.google.de");
    var hashtable = new Hashtable();
    hashtable.setItem(0, "zero");
    hashtable.setItem(1, [1, this, this, this, "Input"]);
    hashtable.setItem(2, "two");
    hashtable.setItem(3, [3, this, this, this, "Input"]);
    hashtable.setItem(4, "four");
    hashtable.setItem(5, "five");
    var i = test_imitator.testhook.getLastIndexOfInput(hashtable, 5);
    assert.shouldBe(i, 3);
    done();
};

exports["test get next index of input 2"] = function (assert, done) {
    assert.pass("begin test get next index of input 2");
    var test_imitator = new imitator(this, "test", "https://www.google.de");
    var hashtable = new Hashtable();
    hashtable.setItem(0, "zero");
    hashtable.setItem(1, [1, this, this, this, "Input"]);
    hashtable.setItem(2, "two");
    hashtable.setItem(3, [3, this, this, this, "Input"]);
    hashtable.setItem(4, "four");
    hashtable.setItem(5, "five");
    test_imitator.testhook.obj(hashtable);
    test_imitator.testhook.actualStepNum(1);
    var i = test_imitator.testhook.getNextIndexOfInput();
    assert.shouldBe(i, 3);
    done();
};

require("sdk/test").run(exports);