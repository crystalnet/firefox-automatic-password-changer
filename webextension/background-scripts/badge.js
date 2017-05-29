class Badge {
    /**
     * Initializes counterValue variable
     */
    constructor() {
        this.counterValue = 0;
        this.recording = false;
    }

    /**
     *  Increments badge counter of button
     */
    increment() {
        this.counterValue++;
        this.display();
    }

    /**
     * Decrements badge counter of button
     */
    decrement() {
        if (this.counterValue > 0) {
            this.counterValue--;
            this.display();
        }
    }

    /**
     * Sets the counter of the button to a specific value
     * @param value
     */
    set(value) {
        this.counterValue = value;
        this.display();
    }

    /**
     * Displays the correct badge text and color, depending on the internal state of the badge object
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
     * Displays the recording icon
     */
    activateRecording() {
        this.recording = true;
        this.display();
    }

    /**
     * Stops displaying the recording icon and restores the badge as it was before
     * activateRecording was called
     */
    deactivateRecording() {
        this.recording = false;
        this.display();
    }
}