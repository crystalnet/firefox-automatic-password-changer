const de_ = require("../locale/de.json");
const en_us_ = require("../locale/en-US.json");


function formatString(message, parameters) {
    if (typeof message !== 'string')return message;
    if (arguments.length <= 1) return message;

    let args = arguments;
    // source: http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
    return message.replace(/{(\d+)}/g, function (match, number) {
        // increase number + 1 to ignore the first argument (= message)
        let index = Number(number) + 1;
        return typeof args[index] != 'undefined'
            ? args[index]
            : match;
    });
}

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

    lang.format = formatString;

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