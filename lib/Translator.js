const de_ = require("../locale/de.json");
const it_ = require("../locale/it.json");
const es_ = require("../locale/es.json");
const fr_ = require("../locale/fr.json");
const en_us_ = require("../locale/en-US.json");
const sharedUtils = require("../data/sharedUtils");

module.exports.Translator = function Translator(userLanguage) {
    //let userLanguage = window.navigator.language || window.navigator.userLanguage;
    let lang;
    switch (userLanguage) {
        case LANGUAGE.de:
            lang = de_;
            break;
        case LANGUAGE.fr:
            lang = fr_;
            break;
        case LANGUAGE.it:
            lang = it_;
            break;
        case LANGUAGE.es:
            lang = es_;
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
    es: "es",
    en_US: "en-US",
    fr: "fr",
    it: "it",
    de: "de"
};
module.exports.LanguageCodes = LANGUAGE;
