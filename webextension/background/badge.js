class Badge {
    /**
     * initializes counterValue variable
     */
    constructor() {
        this.counterValue = 0;
        this.recording = false;
    }

    /**
     *  increments badge counter of button
     */
    increment() {
        this.counterValue++;
        this.display();
    }

    /**
     * decrements badge counter of button
     */
    decrement() {
        if (this.counterValue > 0) {
            this.counterValue--;
            this.display();
        }
    }

    /**
     * sets the counter of the button to a specific value
     * @param value
     */
    set(value) {
        this.counterValue = value;
        this.display();
    }

    /**
     * displays the correct badge text and color, depending on the internal state of the badge object
     */
    display() {
        if (this.recording) {
            browser.browserAction.setBadgeText({text: "rec"});
            browser.browserAction.setBadgeBackgroundColor({color: "red"});
        } else if (this.counterValue === 0) {
            browser.browserAction.setBadgeText({text: "ok"});
            browser.browserAction.setBadgeBackgroundColor({color: "#00AAAA"});
        } else {
            browser.browserAction.setBadgeText({text: this.counterValue.toString()});
            browser.browserAction.setBadgeBackgroundColor({color: "orange"});
        }
    }

    /**
     * displays the recording icon
     */
    activateRecording() {
        this.recording = true;
        this.display();
    }

    /**
     * stops displaying the recording icon and restores the badge as it was before
     * activateRecording was called
     */
    deactivateRecording() {
        this.recording = false;
        this.display();
    }
}

// We create a single badge object here, which can then be accessed in any other background script directly,
// because all background scripts are executed in the same scope. All other privileged add-on code can also
// access this scope via runtime.getBackgroundPage()
const badge = new Badge();