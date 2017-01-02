require("./assertExtension");
const {Translator, LANGUAGE} = require('../lib/Translator');

// add new languages here
const languageArray = [LANGUAGE.deu, LANGUAGE.usa];

exports["test localization files should have the same fields set"] = function (assert) {
    assert.announce("test localization files should have the same fields set");

    // fill languages
    let langs = [];
    for(let i=0;i<languageArray.length;i++){
        langs[i] = new Translator(languageArray[i]);
    }

    let maxlang = {};
    let max = 0;
    let phrases = [];
    for (let i = 0; i < langs.length; i++) {
        let keys = Object.keys(langs[i]);
        let length = keys.length;
        if (length > max) {
            max = length;
            maxlang = langs[i];
            phrases = keys;
        }
    }

    // iterate all phrases from the longest language
    for (let i = 0; i < phrases.length; i++) {
        let phrase = phrases[i];

        if (typeof phrase === 'string') {
            for (let lang = 0; lang < langs.length; lang++) {
                if (langs[lang] === maxlang) continue;
                // if assert fails, check languageArray for actual name of failed language
                assert.shouldNotBe(typeof (langs[lang][phrase]), 'undefined', 'phrase: "' + phrase + '" lang: "' + languageArray[lang]);
            }
        }
    }
};

require("sdk/test").run(exports);