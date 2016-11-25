//import {delete_cookie} from '../lib/Imitator';//'../lib/Imitator';
var {viewFor} = require("sdk/view/core");
var windows = require("sdk/windows").browserWindows;
var window = viewFor(require("sdk/windows").browserWindows[0]);
var imitator = require("../lib/Imitator");
var Recorder = require("../lib/Recorder");


/**


 //Test open new window 1
 exports["test open new window 1"] = function(assert, done){
    assert.pass("start test open new window 1");
    var test_imitator = new imitator(this,"test", "http://pfadfinderhaus.de");
    assert.pass(test_imitator.hiddenWin);
    test_imitator.openNewWindow("http://pfadfinderhaus.de");
    assert.pass("XX:"+test_imitator.hiddenWin.content.document.location);
    //assert.ok(test_imitator.hiddenWindow=="https://www.google.de", "Compare before / after");
    assert.pass("end test open new window 1");
}

 //Test open new window 2
 exports["test open new window 2"] = function(assert, done){
    assert.pass("start test open new window 1");
    var test_imitator = new imitator(this,"test", "http://xxxougk.de");
    assert.pass(test_imitator.hiddenWin);
    test_imitator.openNewWindow("http://xxxougk.de");
    assert.pass("XX:"+test_imitator.hiddenWin.content.document.location);
    //assert.ok(test_imitator.hiddenWindow=="https://www.google.de", "Compare before / after");
    assert.pass("end test open new window 1");
}


 //Test change website 1
 exports["test change website 1"] = function(assert, done){
    assert.pass("start test change website 1");
    var test_imitator = new imitator(this,"test", "http://google.de")
    //test_imitator.openNewWindow();
    //test_imitator.openNewWindow();
    test_imitator.openNewWindow();
    //test_imitator.changeWebsite("http://www.tu-darmstadt.de");
    assert.pass("XX:"+test_imitator.returnHiddenWin.content.document.location.toString());
    assert.pass("XX:"+test_imitator.hiddenWin.content.document.location.toString());
    assert.ok(test_imitator.returnHiddenWin().content.document.location.toString()=="http://www.tu-darmstadt.de", "---");
    assert.pass("end change website 2");
}
 **/

//TODO think about how and if testing this function
//changeAlgorithm


/**
 // Tests change Site function
 exports["test change site function 1"]  = function (assert, done){
    var test_imitator = new imitator(this, "test", test);
    assert.pass("test change site function 1 start")
    test_imitator.changeWebsite("www.pfadfinderhaus.de");
}


 // performSubmitLogin(submitdata)
 // function performSubmitPWChange(data)
 // function performSubmitOnly(formID, formWebsite, formAction)
 // function performLogout(formID, formName, formAction, mustWebsiteURL, hrefLink)
 //    function changeWindowSize(newHeight, newWidth)
 // function performInput(inputValue, elementID)
 // function performClick(xCoord, yCoord,mustScrollTop)
 // function sleep(milliseconds)

 //function getLastIndexOfInput(obj,actualStepNum)
 // function getNextIndexOfInput()
 // function determineEventAfterSubmit()
 //function fetchNDeleteOldLoginData(url,username)
 // function isPWChange(hash)
 //function getMainPageFromLink(link)
 exports["test get main page from link 1"] = function(assert, done){
    var test_imitator = new imitator(this, "test", "https://www.google.de");
    assert.pass("test get main page from link 1 start");
    var link = test_imitator.getMainPageFromLink("http://facebook.com/dingsda?ee=aa");
    assert.pass(link);
    assert.ok(link=="http://facebook.com", "link");
    assert.pass("test get main page from link 1 end")
    done();
}
 //function show_all_passwords()
 exports["test get password list 1"] = function(assert, done){
    var test_imitator = new imitator(this, "test", "https://www.google.de");
    assert.pass("get password list 1 test start");
    recorder = new Recorder();
    var url = "http://www.test.de";
    recorder.storePasswordToFFPWManager(url, "test", "test", "password",  "password", "http://www.test.de/submit");
    test_imitator.GetpasswordList();
    var pwList = test_imitator.returnPasswordList();
    assert.pass("Passwortliste: "+ pwList.getItem(0)[2].toString());
    assert.ok(pwList.getItem(0)[2] == url);
    done();

}
 //function stopImitating()
 //
 **/
//Test delete Cookie function
exports["test delete cookie 1"] = function (assert, done) {
    var test_imitator = new imitator(this, "test", "https://www.google.de");
    assert.pass("delete cookie 1 test start");
    window.content.document.cookie = "cookie= TestCookie; expires=Thu, 18 Dec 2020 12:00:00 UTC";
    test_imitator.delete_cookie("cookie");
    var before = window.content.document.cookie.toString();
    var after = "cookie=; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    assert.pass(before);
    assert.pass(after);
    assert.ok(before == after, "Compare before / after");
    assert.pass("delete cookie 1 test ended");
    done();
};

require("sdk/test").run(exports);
