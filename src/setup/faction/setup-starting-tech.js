const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, world } = require("../../wrapper/api");

class SetupStartingTech extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
        super(playerDesk, faction);
    }

    setup() {
        const startingTechNsidNames = this._faction.raw.startingTech;
        if (startingTechNsidNames.length === 0) {
            return;
        }
        const cards = CardUtil.gatherCards((nsid, cardOrDeckObj) => {
            if (!nsid.startsWith("card.technology")) {
                return false;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            if (!startingTechNsidNames.includes(parsed.name)) {
                return false;
            }
            const pos = cardOrDeckObj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            return closestDesk === this.playerDesk;
        });
        if (cards.length === 0) {
            console.warn(
                `SetupStartingTech: missing tech cards "${this._faction.nameAbbr}`
            );
            return;
        }
        const deck = CardUtil.makeDeck(cards);
        const playerSlot = this.playerDesk.playerSlot;
        CardUtil.moveCardsToCardHolder(deck, playerSlot);
    }

    clean() {
        // Find tech deck.
        let techDeck = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!(obj instanceof Card)) {
                continue;
            }
            if (obj.getStackSize() === 1) {
                continue;
            }
            const nsids = ObjectNamespace.getDeckNsids(obj);
            const nsid = nsids[0];
            if (!nsid.startsWith("card.technology")) {
                continue;
            }
            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk !== this._playerDesk) {
                continue;
            }
            techDeck = obj;
            break;
        }
        if (!techDeck) {
            return;
        }
        const startingTechNsidNames = this._faction.raw.startingTech;
        const cards = CardUtil.gatherCards((nsid, cardOrDeckObj) => {
            if (!nsid.startsWith("card.technology")) {
                return false;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            if (!startingTechNsidNames.includes(parsed.name)) {
                return false;
            }
            const pos = cardOrDeckObj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            return closestDesk === this._playerDesk;
        });
        const deck = CardUtil.makeDeck(cards);
        techDeck.addCards(deck);
    }
}

module.exports = { SetupStartingTech };
