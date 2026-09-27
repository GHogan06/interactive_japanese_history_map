export class ClickAndHoldButton {
    constructor(target, callback) {
        this.target = target;
        this.callback = callback;
        this.isHeld = false;
        this.hold_interval = null;

        // Add start and stop action event listeners for the button
        this.target.addEventListener("mousedown", this._startAction.bind(this));
        ["mouseup", "mouseleave"].forEach(type => {
            this.target.addEventListener(type, this._stopAction.bind(this))
        });
    }

    /**
     * Starts the button action
     */
    _startAction() {
        clearInterval(this.hold_interval);

        this.callback();

        // perform the callback every 250ms
        this.hold_interval = setInterval(() => this.callback(), 250)
    }

    /**
     * Stops the button action
     */
    _stopAction() {
        clearInterval(this.hold_interval);
    }

}