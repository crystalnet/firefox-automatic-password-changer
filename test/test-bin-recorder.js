var Recorder = require("../lib/Recorder");

exports["test recorder isactive should initially be false"] = function (assert) {
    var recorder = new Recorder();
    assert.ok(recorder.RecorderIsActive() === false, "initial is not active");
};

/*exports["test recorder getMainPageFromLink"] = function (assert) {
    var recorder = new Recorder();
    var result = recorder.getMainPageFromLink("https://www.facebook.com/settings/password");
    assert.equal(result,"https://www.facebook.com","example worked");
};*/

require("sdk/test").run(exports);