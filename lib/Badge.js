module.exports = function Badge(button) {
    let counterValue;

    (function init(){
        reset();
    })();

    /** resets badge counter of button */
    function reset() {
        counterValue = 0;
        button.badge = 'ok';
        button.badgeColor = "#00AAAA";
    }

    this.reset = reset;

    /**
     *  increments badge counter of button
     *  can be used in future for assign alerts or messages to the user
     */
    this.increment = function increment() {
        counterValue++;
        button.badge = counterValue;
        button.badgeColor = "orange";
    };

    /** decrements badge counter of button */
    this.decrement = function decrement() {
        if (counterValue === 0) return;

        counterValue--;
        if (counterValue === 0) {
            reset();
        } else {
            button.badge = counterValue;
        }
        return counterValue;
    };

    this.set = set;
    function set(value) {
        counterValue = value;
        if (counterValue === 0) {
            reset();
        }
        else {
            button.badge = counterValue;
            button.badgeColor = "orange";
        }
    }

    /**
     * displays the recording icon
     */
    this.activateRecording = function activateRecording() {
        button.badge = "rec";
        button.badgeColor = "red";
    };

    /**
     * stops displaying the recording icon and restores the badge as it was before
     * activateRecording was called
     */
    this.deactivateRecording = function deactivateRecording() {
        set(counterValue);
    };
};