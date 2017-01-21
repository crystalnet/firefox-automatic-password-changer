/*
 * this allows loading as a module and also as a standalone js file
 */
if(typeof module !== 'undefined')
    module.exports.formatString = formatString;

/**
 * replaces all occurrences of '{N}' with the 'N'th parameter.
 * e.g. formatString('Hello {0}!','World');
 * @param message the string with placeholders
 * @param parameters an array of objects that should replace the placeholders
 * @return {String}
 */
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

