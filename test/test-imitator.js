//import {delete_cookie} from '../lib/Imitator';//'../lib/Imitator';
var {viewFor} = require("sdk/view/core");
var windows = require("sdk/windows").browserWindows;
var window = viewFor(require("sdk/windows").browserWindows[0]);
var imitator = require("../lib/Imitator");
var Recorder = require("../lib/Recorder");
var Hashtable = require('lib/Hashtable');
var assertex = require('./assertExtension');

//Test delete Cookie function
exports["test delete cookie"] = function (assert, done) {
    var test_imitator = new imitator(this, "test", "https://www.google.de");
    assert.pass("begin test delete cookie");
    window.content.document.cookie = "cookie= TestCookie; expires=Thu, 18 Dec 2020 12:00:00 UTC";
    test_imitator.testhook.setWindow(window);
    test_imitator.testhook.delete_cookie("cookie");
    var before = test_imitator.testhook.returnWindow.content.document.cookie.toString();
    var after = "cookie=; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    assert.shouldBe(before, after);
    done();
};

//Test open new window
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



//TODO think about how and if testing this function
//changeAlgorithm


 // Tests change Site function
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


 // performSubmitLogin(submitdata)
 // function performSubmitPWChange(data)
 // function performSubmitOnly(formID, formWebsite, formAction)
 // function performLogout(formID, formName, formAction, mustWebsiteURL, hrefLink)
 //    function changeWindowSize(newHeight, newWidth)
 // function performInput(inputValue, elementID)
 // function performClick(xCoord, yCoord,mustScrollTop)

// function sleep(milliseconds)
// Test sleep 1
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
/**
 //function getLastIndexOfInput(obj,actualStepNum)

 // function getNextIndexOfInput()
 // function determineEventAfterSubmit()
 //function fetchNDeleteOldLoginData(url,username)
 // function isPWChange(hash)

 **/
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

//function show_all_passwords()
 //function stopImitating()


//getLastIndexOfInput(obj,actualStepNum)
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

//getLastIndexOfInput(obj,actualStepNum)
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