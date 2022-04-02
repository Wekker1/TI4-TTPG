const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const {
    Border,
    Button,
    Color,
    GameObject,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
    VerticalBox,
    globalEvents,
    world,
} = require("../../wrapper/api");

class TurnOrderPanel extends VerticalBox {
    constructor(gameObject) {
        assert(!gameObject || gameObject instanceof GameObject);
        super();

        this._fontSize = undefined;

        const update = () => {
            this.update();
        };

        // Register listeners.
        globalEvents.TI4.onTurnOrderChanged.add(update);
        globalEvents.TI4.onTurnChanged.add(update);
        globalEvents.TI4.onPlayerColorChanged.add(update);
        globalEvents.TI4.onPlayerCountChanged.add(update);
        globalEvents.onPlayerJoined.add(update);
        globalEvents.onPlayerSwitchedSlots.add(update);

        // Unregister listeners when destroyed.
        if (gameObject) {
            gameObject.onDestroyed.add(() => {
                globalEvents.TI4.onTurnOrderChanged.remove(update);
                globalEvents.TI4.onTurnChanged.remove(update);
                globalEvents.TI4.onPlayerColorChanged.remove(update);
                globalEvents.TI4.onPlayerCountChanged.remove(update);
                globalEvents.onPlayerJoined.remove(update);
                globalEvents.onPlayerSwitchedSlots.remove(update);
            });
        }

        this.update();
    }

    setFontSize(value) {
        this._fontSize = value;
        this.update();
        return this;
    }

    setSpacing(value) {
        assert(typeof value === "number");
        this.setChildDistance(value);
        return this;
    }

    update() {
        const playerDeskOrder = world.TI4.turns.getTurnOrder();
        assert(Array.isArray(playerDeskOrder));

        this.removeAllChildren();

        const currentDesk = world.TI4.turns.getCurrentTurn();
        for (const playerDesk of playerDeskOrder) {
            const isTurn = playerDesk === currentDesk;
            const player = world.getPlayerBySlot(playerDesk.playerSlot);
            let name = player && player.getName();
            if (!name || name.length === 0) {
                name = `<${playerDesk.colorName}>`;
            }
            let label;
            let verticalAlignment;
            if (isTurn) {
                label = new Text().setJustification(TextJustification.Center);
                verticalAlignment = VerticalAlignment.Center;
            } else {
                label = new Button();
                label.onClicked.add((button, clickingPlayer) => {
                    world.TI4.turns.setCurrentTurn(playerDesk, clickingPlayer);
                });
                verticalAlignment = VerticalAlignment.Fill;
            }
            label.setText(name);
            if (this._fontSize) {
                label.setFontSize(this._fontSize);
            }
            const labelBox = new LayoutBox()
                .setVerticalAlignment(verticalAlignment)
                .setChild(label);
            const inner = new Border().setChild(labelBox);

            const p = 1;
            const innerBox = new LayoutBox()
                .setPadding(p, p, p, p)
                .setChild(inner);

            const outer = new Border().setChild(innerBox);

            const v = 0.05;
            const plrColor = playerDesk.plasticColor;
            const altColor = new Color(v, v, v);
            const fgColor = isTurn ? altColor : plrColor;
            const bgColor = isTurn ? plrColor : altColor;

            outer.setColor(plrColor);
            inner.setColor(bgColor);
            label.setTextColor(fgColor);

            this.addChild(outer, 1);
        }

        const endTurnButton = new Button().setText(
            locale("ui.button.end_turn")
        );
        if (this._fontSize) {
            endTurnButton.setFontSize(this._fontSize);
        }
        endTurnButton.onClicked.add((button, player) => {
            world.TI4.turns.endTurn(player);
        });
        this.addChild(endTurnButton, 1.5);
    }
}

module.exports = { TurnOrderPanel };
