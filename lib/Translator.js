const de_ = require("../locale/de.json");
const en_us_ = require("../locale/en-US.json");
const sharedUtils = require("../data/sharedUtils");

module.exports.Translator = function Translator(userLanguage) {
    //let userLanguage = window.navigator.language || window.navigator.userLanguage;
    let lang;
    switch (userLanguage) {
        case LANGUAGE.de:
            lang = de_;
            break;
        case LANGUAGE.en_US:
            lang = en_us_;
            break;
        default:
            lang = en_us_;
            break;
    }

    lang.format = sharedUtils.formatString;

    return lang;

};
const LANGUAGE = {
    //en: 0,
    //es: 1,
    en_US: "en-US",
    //fr: 3,
    //it: 4,
    de: "de"
};