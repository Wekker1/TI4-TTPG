const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Spawn } = require("../spawn/spawn");
const { ObjectType, Vector, world } = require("../../wrapper/api");

const FACTION_SHEET_POS = { x: 18, y: 0 };

class SetupFactionSheet extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
        super(playerDesk, faction);
    }

    setup() {
        let pos = new Vector(FACTION_SHEET_POS.x, FACTION_SHEET_POS.y, 2);
        pos = this.playerDesk.localPositionToWorld(pos);
        const rot = this.playerDesk.rot;

        const sheetNsid = `sheet.faction:${this.faction.nsidSource}/${this.faction.nsidName}`;
        const sheet = Spawn.spawn(sheetNsid, pos, rot);
        sheet.setObjectType(ObjectType.Ground);
        assert(ObjectNamespace.getNsid(sheet) === sheetNsid);
    }

    clean() {
        const sheetNsid = `sheet.faction:${this.faction.nsidSource}/${this.faction.nsidName}`;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== sheetNsid) {
                continue;
            }
            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk !== this.playerDesk) {
                continue;
            }
            obj.destroy();
        }
    }
}

module.exports = { SetupFactionSheet, FACTION_SHEET_POS };
