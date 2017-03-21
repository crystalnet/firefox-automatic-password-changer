const sourcepath = "../../../";

const proxyquire = require('proxyquire').noCallThru();
const HashTable = require(sourcepath + "lib/Hashtable");
const should = require('should');
const {Translator} = require(sourcepath + 'lib/Translator');

const languageStrings = Translator('en-US');

const sdkDependenciesStub = {
    'sdk/context-menu': {
        Item: function () {
        },
        Menu: function () {
            return {
                destroy: function () {
                }
            }
        }
    },
    'sdk/self': {
        data: {
            url: function () {
            }
        }
    },
    'sdk/view/core': {
        viewFor: function () {
            return { // window stub
                addEventListener: function () {
                },
                removeEventListener: function () {
                },
                content: {
                    document: {
                        addEventListener: function () {
                        },
                        removeEventListener: function () {
                        },
                        body:{
                            addEventListener: function () {
                            },
                            removeEventListener: function () {
                            },
                        }
                    }
                }
            }
        }
    },
    'sdk/tabs': {
        activeTab: {
            attach: function () {
            }
        }
    },
    'sdk/windows': {browserWindows: []},
    'lib/Hashtable': HashTable,
    'lib/Utils': proxyquire('../../../lib/Utils', {
        'lib/Hashtable': HashTable,
        'sdk/passwords': {
            search: function () {
            },
            remove: function () {
            },
            store: function () {
            }
        }
    })
};

const Recorder = proxyquire(sourcepath + "lib/Recorder", sdkDependenciesStub);

describe('Recorder', function () {
    describe('RecorderIsActive', function () {
        it('should only be true if the recorder is running', function () {

            //this test may be replaced by a full jpm integration test in the future.

            let recorder = new Recorder(languageStrings);
            recorder.recorderIsActive().should.be.false();
            recorder.startRecording();
            recorder.recorderIsActive().should.be.true();
            recorder.stopRecording();
            recorder.recorderIsActive().should.be.false();
        })
    });
});