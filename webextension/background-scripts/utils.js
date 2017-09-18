/**
 * Some utility functions used by several other modules
 */
/* exported Utils */
class Utils {
    /**
     * returns the first part of a link
     * for example, 'https://www.facebook.com/settings/password' results in  'https://www.facebook.com'
     * @param link
     * @return {string}
     */
    static getMainPageFromLink(link) {
        if(link === '') return '';
        let pathArray = link.split('/');
        let protocol = pathArray[0];
        let host = pathArray[2];
        return protocol + '//' + host;
    }

    /**
     * removes a trailing slash from an URL if present
     * @param url
     * @return {*}
     */
    static removeTrailingSlash(url) {
        let result = url;
        if(url.substring(url.length - 1) === '/')
            result =  url.substring(0, url.length - 1);
        return result;
    }

    /**
     * Checks if two arrays are equal
     * @param a the first array
     * @param b the second array
     * @return {boolean}
     */
    static arraysEqual(a,b) {
        if (a === b)
            return true;
        if (a === null || b === null || a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; ++i) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }

    /**
     * Shows a notification to the user
     * @param message The message to display
     */
    static showNotification(message) {
        let creating = browser.notifications.create('note', {
            type: 'basic',
            title: 'Password Changer',
            message: message,
            iconUrl: browser.extension.getURL('images/icons/icon_gray-64.png')
        });
        creating.then(null, function(error) {
            console.log(`Creating notification was not successful. ${error}`);
        });
    }
}