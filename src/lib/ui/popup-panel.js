const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const TriggerableMulticastDelegate = require("../triggerable-multicast-delegate");
const {
    Border,
    Button,
    GameObject,
    ImageButton,
    Player,
    Rotator,
    UIElement,
    VerticalBox,
    refPackageId,
} = require("../../wrapper/api");

const POPUP_HEIGHT = 3;
const POPUP_CHILD_DISTANCE = 5; // consistent look
const POPUP_FONT_SIZE = 10;
const DELAYED_HIDE_MSECS = 2500;

/**
 * Popup "panel" (Border) with custom actions.
 */
class PopupPanel extends Border {
    /**
     * Constructor.
     *
     * Popup panel UI over an object.  Does not add the button, call either
     * `attachPopupButton` to add button directly, otherwise call
     * `createPopupButton` to get a button to add to exsiting UI.
     *
     * @param {GameObject} gameObject
     * @param {Vector} localPos
     */
    constructor(gameObject, localPos) {
        assert(gameObject instanceof GameObject);
        assert(typeof localPos.x === "number");
        super();

        this._obj = gameObject;
        this._localPos = localPos;
        this._ui = new UIElement();
        this._ui.widget = this;

        this._matchPlayerYaw = false;
        this._namesAndActions = [];
        this._isShowing = false;

        this._popupScale = 1;

        // <(gameObject: GameObject, player: Player, popupPanel: PopupPanel) => void>
        this.onShow = new TriggerableMulticastDelegate();

        this.reset();
    }

    setPopupScale(value) {
        assert(typeof value === "number");
        assert(0.1 <= value && value <= 10);
        this._popupScale = value;
        return this;
    }

    setMatchPlayerYaw(value) {
        assert(typeof value === "boolean");
        this._matchPlayerYaw = value;
        return this;
    }

    /**
     * Add a popup button to an object.
     *
     * @param {number} scale - already scaled for crisp image, this scale affects size
     * @returns {PopupPanel} self, for chaining
     */
    attachPopupButton(scale = 1) {
        const ui = new UIElement();
        ui.widget = this.createPopupButton();
        ui.position = this._localPos;
        ui.scale = 0.23 * scale;
        ui.width = 64;
        ui.height = 64;
        ui.useWidgetSize = false;
        this._obj.addUI(ui);
        return this;
    }

    /**
     * Create a button that can attach to other UI.
     *
     * @returns {ImageButton}
     */
    createPopupButton() {
        const button = new ImageButton().setImage(
            "global/ui/menu_button_hex.png",
            refPackageId
        );
        button.onClicked.add((button, player) => {
            assert(player instanceof Player);
            this._show(player);
        });
        return button;
    }

    /**
     * Clear the popup.
     *
     * @returns {PopupPanel} self, for chaining
     */
    reset() {
        this._namesAndActions = [];
        return this;
    }

    /**
     * Add an action with associated on-clicked callback.
     *
     * @param {string} actionName
     * @param {function} onActionCallback - f(gameObject, player, actionName)
     * @returns {PopupPanel} self, for chaining
     */
    addAction(actionName, onActionCallback, delayedHide = false) {
        assert(typeof actionName === "string");
        assert(typeof onActionCallback === "function");
        assert(typeof delayedHide === "boolean");

        this._namesAndActions.push({
            name: actionName,
            action: onActionCallback,
            delayedHide: delayedHide,
        });
        return this;
    }

    _show(player) {
        assert(player instanceof Player);

        if (this._isShowing) {
            this._hide();
        }

        // Call listeners *before* showing so they can mutate the menu that appears.
        this.onShow.trigger(this._obj, player, this);

        // Add owner-specified actions, followed by cancel.
        const panel = new VerticalBox().setChildDistance(
            POPUP_CHILD_DISTANCE * this._popupScale
        );
        for (const { name, action, delayedHide } of this._namesAndActions) {
            const button = new Button()
                .setFontSize(POPUP_FONT_SIZE * this._popupScale)
                .setText(name);
            button.onClicked.add((button, player) => {
                if (delayedHide) {
                    setTimeout(() => {
                        this._hide();
                    }, DELAYED_HIDE_MSECS);
                } else {
                    this._hide();
                }
                action(this._obj, player, name);
            });
            panel.addChild(button);
        }
        const cancelButton = new Button()
            .setFontSize(POPUP_FONT_SIZE * this._popupScale)
            .setText(locale("ui.button.cancel"));
        cancelButton.onClicked.add((button, player) => {
            this._hide();
        });
        panel.addChild(cancelButton);
        this.setChild(panel);

        // Z scaling may be wonky.  Place above in world space and move back.
        this._ui.position = this._obj.worldPositionToLocal(
            this._obj
                .localPositionToWorld(this._localPos)
                .add([0, 0, POPUP_HEIGHT])
        );
        this._ui.rotation = new Rotator(0, 0, 0);
        if (this._matchPlayerYaw) {
            const localRot = this._obj.worldRotationToLocal(
                player.getRotation()
            );
            this._ui.rotation.yaw = localRot.yaw;
        }
        this._obj.addUI(this._ui);
        this._isShowing = true;
    }

    _hide() {
        this._obj.removeUIElement(this._ui);
        this.setChild(undefined);
        this._isShowing = false;
    }
}

module.exports = { PopupPanel, POPUP_CHILD_DISTANCE };
