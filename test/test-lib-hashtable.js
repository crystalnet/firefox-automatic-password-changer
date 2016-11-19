var hashtable = require("../lib/Hashtable");

var QUnit = require(QUnit);
QUnit.test("ok test", function (assert) {
    assert.ok(true, "true succeeds");
    assert.ok("non-empty", "non-empty string succeeds");

    assert.ok(false, "false fails");
    assert.ok(0, "0 fails");
    assert.ok(NaN, "NaN fails");
    assert.ok("", "empty string fails");
    assert.ok(null, "null fails");
    assert.ok(undefined, "undefined fails");
});

/**
 exports["test input"] = function(assert){
    hashtable.setItem(1,"one");
    assert.ok(hashtable.length==2);
    done();
}**/
/**
 exports["test main"] = function(assert) {
    assert.pass("Unit test running!");
};

 exports["test main async"] = function(assert, done) {
    assert.pass("async Unit test running!");
    done();
};

 exports["test dummy"] = function(assert, done) {
    main.dummy("foo", function(text) {
        assert.ok((text === "foo"), "Is the text actually 'foo'");
        done();
    });
};
 **/
