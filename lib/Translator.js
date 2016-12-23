deu_ = require("../locale/deu.json");
usa_ = require("../locale/usa.json");
/**gbr_ = require("../locale/gbr.json");
 esp_ = require("../locale/esp.json");
 fra_ = require("../locale/fra.json");
 ita_ = require("../locale/ita.json");
 chn_ = require("../locale/chn.json");
 **/
module.exports = function Translator(language) {
    switch (language) {
        case LANGUAGE.deu:
            return deu_;
            break;
        case LANGUAGE.usa:
            return usa_;
            break;
        default:
            return usa_;
            break;
    }
    return deu_;


};
var LANGUAGE = {
    //gbr: 0,
    //esp: 1,
    usa: 2,
    //fra: 3,
    //ita: 4,
    //chn: 5,
    deu: 6
};