const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../../game-ui/game-ui-config");
const {
    Button,
    CheckBox,
    Color,
    Slider,
    Text,
    TextJustification,
    VerticalBox,
    refPackageId,
    world,
} = require("../../wrapper/api");

class GameSetupUI {
    constructor(callbacks) {
        this._callbacks = callbacks;
    }

    create() {
        const panel = new VerticalBox().setChildDistance(CONFIG.spacing);

        const title = new Text()
            .setFontSize(CONFIG.fontSize * 3.8)
            .setText(locale("ui.setup.title"))
            .setJustification(TextJustification.Center)
            .setFont("ambroise_firmin_bold.otf", refPackageId);
        panel.addChild(title);

        const wip = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText("BETA TEST") // temp, no need for locale
            .setTextColor(new Color([0.8, 0.2, 0, 1]))
            .setBold(true)
            .setJustification(TextJustification.Center);
        panel.addChild(wip);

        panel.addChild(
            this._createSlider(
                "ui.setup.player_count",
                2,
                8,
                world.TI4.config.playerCount,
                this._callbacks.onPlayerCountChanged
            )
        );

        panel.addChild(
            this._createSlider(
                "ui.setup.game_points",
                10,
                14,
                world.TI4.config.gamePoints,
                this._callbacks.onGamePointsChanged
            )
        );

        panel.addChild(
            this._createCheckbox(
                "ui.setup.use_pok",
                world.TI4.config.pok,
                this._callbacks.onUsePokChanged
            )
        );
        panel.addChild(
            this._createCheckbox(
                "ui.setup.use_omega",
                world.TI4.config.omega,
                this._callbacks.onUseOmegaChanged
            )
        );
        panel.addChild(
            this._createCheckbox(
                "ui.setup.use_codex1",
                world.TI4.config.codex1,
                this._callbacks.onUseCodex1Changed
            )
        );
        panel.addChild(
            this._createCheckbox(
                "ui.setup.use_codex2",
                world.TI4.config.codex2,
                this._callbacks.onUseCodex2Changed
            )
        );
        panel.addChild(
            this._createButton(
                "ui.setup.do_setup",
                this._callbacks.onSetupClicked
            )
        );

        return panel;
    }

    _createText(localeText) {
        assert(typeof localeText === "string");

        const labelText = locale(localeText);
        const text = new Text().setFontSize(CONFIG.fontSize).setText(labelText);
        return text;
    }

    _createButton(localeLabel, onClicked) {
        assert(typeof localeLabel === "string");
        assert(typeof onClicked === "function");

        const labelText = locale(localeLabel);
        const button = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(labelText);
        button.onClicked.add(onClicked);
        return button;
    }

    _createCheckbox(localeLabel, isChecked, onCheckStateChanged) {
        assert(typeof localeLabel === "string");
        assert(typeof isChecked === "boolean");
        assert(typeof onCheckStateChanged === "function");

        const labelText = locale(localeLabel);
        const checkBox = new CheckBox()
            .setFontSize(CONFIG.fontSize)
            .setText(labelText)
            .setIsChecked(isChecked);
        checkBox.onCheckStateChanged.add(onCheckStateChanged);
        return checkBox;
    }

    _createSlider(localeLabel, minValue, maxValue, value, onValueChanged) {
        assert(typeof localeLabel === "string");
        assert(typeof minValue === "number");
        assert(typeof maxValue === "number");
        assert(typeof value === "number");
        assert(typeof onValueChanged === "function");

        const labelText = locale(localeLabel);
        const label = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(labelText);

        const slider = new Slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(minValue)
            .setMaxValue(maxValue)
            .setStepSize(1)
            .setValue(value);

        slider.onValueChanged.add(onValueChanged);
        return new VerticalBox().addChild(label).addChild(slider);
    }
}

module.exports = { GameSetupUI };
