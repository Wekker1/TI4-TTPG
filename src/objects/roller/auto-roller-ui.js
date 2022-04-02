const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { System, Planet } = require("../../lib/system/system");
const CONFIG = require("../../game-ui/game-ui-config");
const {
    Border,
    Button,
    GameObject,
    HorizontalBox,
    LayoutBox,
    Panel,
    Text,
    TextJustification,
    UIElement,
    VerticalAlignment,
    VerticalBox,
    refPackageId,
} = require("../../wrapper/api");

/**
 * Manage the UI on an AutoRoller object.
 */
class AutoRollerUI extends LayoutBox {
    /**
     * Constructor.
     *
     * @param {function} onButton - called with (rollType: string, planet: Planet or false, player: Player)
     */
    constructor(onButton) {
        assert(onButton);
        super();
        this._gameObject = false;
        this._uiElement = false;
        this._onButton = onButton;
        this._player = undefined;

        this.resetAwaitingSystemActivation();
        //this.resetAfterSystemActivation(world.TI4.getSystemByTileNumber(18));
    }

    setOwningObjectForUpdate(gameObject, uiElement) {
        assert(gameObject instanceof GameObject);
        assert(uiElement instanceof UIElement);
        this._gameObject = gameObject;
        this._uiElement = uiElement;
        return this;
    }

<<<<<<< HEAD
    _update(panels) {
        assert(typeof panels === typeof [])
        this.setChild(panels[panels.length - 1]);
=======
    setDoRefresh(doRefresh) {
        assert(typeof doRefresh === "function");
        this._doRefresh = doRefresh;
        return this;
    }
>>>>>>> 8794b99938d8da768bb626749110eb123e3ccdbf

    _update() {
        if (this._gameObject && this._uiElement) {
            this._gameObject.updateUI(this._uiElement);
        }
        if (this._doRefresh) {
            this._doRefresh();
        }
    }

    /**
     * Reset for "no system activated".
     */
    resetAwaitingSystemActivation() {
        const panel = new VerticalBox().setChildDistance(CONFIG.spacing);

        const message = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.message.no_system_activated"));
        panel.addChild(message);

<<<<<<< HEAD
        const addLayoutText = (parent, localeText, fontSize, maxWidth, maxHeight) => {
            assert(typeof parent === typeof [])
            const text = new Text().setText(locale(localeText)).setJustification(TextJustification.Center).setFontSize(fontSize);
            const lbox1 = new LayoutBox().setOverrideWidth(maxWidth).setOverrideHeight(maxHeight);
            const lbox2 = new LayoutBox().setVerticalAlignment(2).setHorizontalAlignment(2);
            const hpanel = new HorizontalBox().setChildDistance(5);
            lbox1.setChild(text);
            hpanel.addChild(lbox1);
            lbox2.setChild(hpanel)
            parent[parent.length - 1].addChild(lbox2);


        };

        const addVerticalSubPanel = (parent, spacing) => {
            assert(typeof parent === typeof [])
            const panel = new VerticalBox().setChildDistance(spacing);
            parent[parent.length - 1].addChild(panel);
            parent.push(panel);
        };

        addText(panels, "ui.message.no_system_activated");

        //Extra
        addVerticalSubPanel(panels, 0);
        addLayoutText(panels, locale("ui.label.etc"), 8, -1, -1);
        addLayoutButton(panels, "ui.roller.report_modifiers", "reportModifiers", false, 7, 100, -1);
        panels.pop();

        //Strategic Action Panel
        panels.push(new VerticalBox().setChildDistance(5));
        addText(panels, locale("ui.strategy.instructions"));

        //Component Action Panel
        panels.push(new VerticalBox().setChildDistance(5));
        addText(panels, locale("ui.component.instructions"));

        const actionTypes = new TabbedPanel(false).addTab(locale("ui.tab.tactical_action"), panels[0], true).addTab(locale("ui.tab.strategic_action"), panels[1], false).addTab(locale("ui.tab.component_action"), panels[2], false);
        panels.push(new VerticalBox().setChildDistance(5).addChild(actionTypes));

        addLayoutButton(panels, locale("ui.action.end_turn"), "endTurn", false, 12, 300, -1);
=======
        panel.addChild(new LayoutBox(), 1); // stretch to fill space
>>>>>>> 8794b99938d8da768bb626749110eb123e3ccdbf

        const reportModifiers = new Button()
            .setFontSize(12)
            .setText(locale("ui.roller.report_modifiers"));
        reportModifiers.onClicked.add((button, player) => {
            this._onButton("reportModifiers", false, player);
        });
        panel.addChild(reportModifiers);

        this.setChild(panel);
        this._update();
    }

    /**
     * Reset for the given system.
     *
     * Get localized planet names by: `system.planets[].getNameStr()`
     *
     * To test with a system get one via `world.TI4.getSystemByTileNumber(#)`.
     *
     * @param {System} system
     */
    resetAfterSystemActivation(system) {
        assert(system instanceof System);

        // Mandate column width so if button text overflows it truncates
        // instead of adding a scrollbar.  Do not assume EN locale!
        const VERTICAL_DISTANCE = 5;
        const HORIZONTAL_DISTANCE = 10;
        const COLUMN_WIDTH = 175;

        const spaceLayout = new VerticalBox().setChildDistance(
            VERTICAL_DISTANCE
        );
        const spaceBox = new LayoutBox()
            .setOverrideWidth(COLUMN_WIDTH)
            .setVerticalAlignment(VerticalAlignment.Bottom)
            .setChild(spaceLayout);

        const groundLayout = new HorizontalBox().setChildDistance(
            HORIZONTAL_DISTANCE
        );
        const groundOuterLayout = new VerticalBox()
            .setChildDistance(VERTICAL_DISTANCE)
            .addChild(groundLayout);
        const groundBox = new LayoutBox()
            .setOverrideWidth(COLUMN_WIDTH * 3 + HORIZONTAL_DISTANCE * 3)
            .setVerticalAlignment(VerticalAlignment.Bottom)
            .setPadding(0, 0, 0, 0) //44
            .setChild(groundOuterLayout);

        const BUTTON_FONT_SIZE = 12;
        const LABEL_FONT = "Handel_Gothic_Regular.otf";
        const LABEL_FONT_SIZE = 14;

        this.setChild(
            new HorizontalBox()
                .setChildDistance(HORIZONTAL_DISTANCE)
                .addChild(spaceBox)
                .addChild(new Border().setColor(CONFIG.spacerColor))
                .addChild(groundBox)
        );

        let panel = spaceLayout;

        const addStep = (localeText) => {
            assert(panel instanceof Panel);
            assert(typeof localeText === "string");
            const label = new Text()
                .setFontSize(LABEL_FONT_SIZE)
                .setFont(LABEL_FONT, refPackageId)
                .setJustification(TextJustification.Center)
                .setText(locale(localeText).toUpperCase());
            panel.addChild(label);
        };

        const addPlanetName = (planet) => {
            assert(panel instanceof Panel);
            assert(planet instanceof Planet);
            const label = new Text()
                .setFontSize(LABEL_FONT_SIZE)
                .setJustification(TextJustification.Center)
                .setItalic(true)
                .setText(planet.getNameStr());
            panel.addChild(label);
        };

        const addButton = (localeText, combatType, planet) => {
            assert(panel instanceof Panel);
            assert(typeof localeText === "string");
            assert(typeof combatType === "string");
            assert(!planet || planet instanceof Planet);
            const button = new Button()
                .setFontSize(BUTTON_FONT_SIZE)
                .setText(locale(localeText));
            button.onClicked.add((button, player) => {
                this._onButton(combatType, planet, player);
            });
            panel.addChild(button);
            return button;
        };

        const addGap = () => {
            assert(panel instanceof Panel);
            panel.addChild(
                new LayoutBox().setOverrideHeight(VERTICAL_DISTANCE)
            );
        };

<<<<<<< HEAD

        //Movement step
        addLayoutText(panels, locale("ui.label.movement"), 12, false, -1, -1, "Handel_Gothic_Regular.otf");
        addHorizontalSubPanel(panels, 2);
        addLayoutButton(panels, locale("ui.movement.finish_movement"), "finishMove", false, 10, 150, -1);
        addGap(panels, 5, 0, 0, 0)
        addLayoutButton(panels, "ui.roller.space_cannon_offense", "spaceCannon", false, 10, 150, -1);
        panels.pop();

        //Combat step
        addLayoutText(panels, locale("ui.label.space_combat"), 12, false, -1, -1, "Handel_Gothic_Regular.otf");
        addLayoutButton(panels, "ui.roller.anti_fighter_barrage", "antiFighterBarrage", false, 9, 200, -1);
        addLayoutButton(panels, "ui.roller.announce_retreat", "announceRetreat", false, 9, 200, -1);
        addLayoutButton(panels, "ui.roller.space_combat", "spaceCombat", false, 9, 200, -1);

        //Invasion step
        addLayoutText(panels, locale("ui.label.invasion"), 12, false, -1, -1, "Handel_Gothic_Regular.otf");
        addHorizontalSubPanel(panels, 2);
        system.planets.forEach((planet) => {
            addPlanetSteps(panels, planet);
            addGap(panels, 3, 0, 0, 0)
        });
        panels.pop();

        //Production step
        addLayoutText(panels, locale("ui.label.production"), 12, false, -1, -1, "Handel_Gothic_Regular.otf");
        addLayoutButton(panels, locale("ui.label.production"), "production", false, 9, 200, -1);

        //Extra
        addVerticalSubPanel(panels, 0);
        addLayoutText(panels, locale("ui.label.etc"), 8, false, -1, -1);
        addLayoutButton(panels, "ui.roller.report_modifiers", "reportModifiers", false, 7, 100, -1);
        panels.pop();

        //Strategic Action Panel
        panels.push(new VerticalBox().setChildDistance(5));
        addText(panels, locale("ui.strategy.instructions"));

        //Component Action Panel
        panels.push(new VerticalBox().setChildDistance(5));
        addText(panels, locale("ui.component.instructions"));

        const actionTypes = new TabbedPanel(false).addTab(locale("ui.tab.tactical_action"), panels[0], true).addTab(locale("ui.tab.strategic_action"), panels[1], false).addTab(locale("ui.tab.component_action"), panels[2], false);
        panels.push(new VerticalBox().setChildDistance(5).addChild(actionTypes));
        addLayoutButton(panels, locale("ui.action.end_turn"), "endTurn", false, 12, 300, -1);
=======
        // MOVEMENT STEP
        addStep("ui.label.movement");
        addButton("ui.movement.finish_movement", "finishMove");
        addButton("ui.roller.space_cannon_offense", "spaceCannon");
        addGap();

        // SPACE COMBAT STEP
        addStep("ui.label.space_combat");
        addButton("ui.roller.anti_fighter_barrage", "antiFighterBarrage");
        addButton("ui.roller.announce_retreat", "announceRetreat");
        addButton("ui.roller.space_combat", "spaceCombat");
        addGap();

        // INVASION (redirect)
        addStep("ui.label.invasion");
        addButton("—>", "").setEnabled(false);
        addGap();

        // PRODUCTION
        addStep("ui.label.production");
        addButton("ui.label.production", "production");

        // INVASION (real this time)
        for (const planet of system.planets) {
            panel = new VerticalBox().setChildDistance(VERTICAL_DISTANCE);
            groundLayout.addChild(
                new LayoutBox().setOverrideWidth(COLUMN_WIDTH).setChild(panel)
            );

            addPlanetName(planet);
            addButton("ui.roller.bombardment", "bombardment", planet);
            addButton(
                "ui.roller.space_cannon_defense",
                "spaceCannonDefense",
                planet
            );
            addButton("ui.roller.ground_combat", "groundCombat", planet);
        }

        panel = groundOuterLayout;
        addButton("ui.roller.report_modifiers", "reportModifiers");
>>>>>>> 8794b99938d8da768bb626749110eb123e3ccdbf

        this._update();
    }
}

module.exports = { AutoRollerUI };
