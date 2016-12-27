const deu_ = require("../locale/deu.json");
const usa_ = require("../locale/usa.json");
/**gbr_ = require("../locale/gbr.json");
 esp_ = require("../locale/esp.json");
 fra_ = require("../locale/fra.json");
 ita_ = require("../locale/ita.json");
 chn_ = require("../locale/chn.json");
 **/

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

module.exports.Translator = function Translator(language) {

    let lang;
    switch (language) {
        case LANGUAGE.deu:
            lang = deu_;
            break;
        case LANGUAGE.usa:
            lang = usa_;
            break;
        default:
            lang = usa_;
            break;
    }

    lang.format = formatString;

    return lang;

};
const LANGUAGE = {
    //gbr: 0,
    //esp: 1,
    usa: 2,
    //fra: 3,
    //ita: 4,
    //chn: 5,
    deu: 6
};
module.exports.LANGUAGE = LANGUAGE;