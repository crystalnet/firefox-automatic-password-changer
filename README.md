#Firefox-automatic-password-changer

firefox-automatic-password-changer is an add-on for Firefox. The add-on can learn from users how to change passwords on web pages. Subsequently, the add-on can automatically change these passwords on command.

#Installation

For further development jpm is required. Jpm can be installed via the package manager npm.
Creating XPI once jpm is installed:
1) Save the project locally.
2) Navigate in terminal into the project directory.
3) Run the command `jpm xpi`.

Run add-on in the test environment:
1) Save the project locally.
2) Navigate in terminal into the project directory.
3) Run the command `jpm run`.

To debug the add-on, run it in the test environment as explained above and then go to "about:debugging" in the open 
firefox window, check "Enable debugging of add-ons"
and click the "Debug" button near the listed entry for this add-on ("Password Changer").

To use the Firefox Developer Edition (or any other version of firefox) to run the add-on instead of your default installation,
add `-b "PATH_TO_FIREFOX_EXE"` to any jpm command.

#Unit Tests
We used the unit test framework mocha with BDD as the user-interface (layout) for unit tests and
We also used the nodejs modules [should.js](https://github.com/shouldjs/should.js/) for a more fluent test syntax and 
[proxyquire](https://github.com/thlorenz/proxyquire) to mock required dependencies.

To run the mocha unit tests in Webstorm, all you need to do is add a debug configuration for mocha
and set the "Test Directory" to "ADDONDIRECTORY\test\unit-tests" and check "Include subdirectories".
Now the tests can be run by hitting the run button for the created configuration.

#Integration Tests
To execute integration tests with jpm execute:

`jpm test`

or to filter for a specific test:

`jpm test -f FILENAME:TESTNAME`

To use a syntax more similar to should.js in jpm tests add `require('assertExtension')` (with the correct path to the 
assertExtension.js file in "ADDONDIRECTORY/test/integration-tests/) to the javascript. This extends the firefox addon-sdk assert class.

For more information on integration tests with jpm see <https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Unit_testing>

#Tested with    
    
The add-on was tested with:
 * Firefox Developer Edition 53.0a2 (2017-02-05) (32-Bit)
 * Firefox Developer Edition 54.0a2 (2017-03-22) (32-Bit)

#License

Firefox-automatic-password-changer is licenced under the GPLv2.
