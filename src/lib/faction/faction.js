const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { FACTION_DATA } = require("./faction.data");
const { globalEvents, world } = require("../../wrapper/api");
const locale = require("../locale");

let _nsidNameToFaction = false;
let _playerSlotToFaction = false;

globalEvents.onPlayerSwitchedSlots.add((player, index) => {
    _playerSlotToFaction = false; // invalidate cache
});

globalEvents.TI4.onFactionChanged.add((deskPlayerSlot, player) => {
    _playerSlotToFaction = false; // invalidate cache
});

function _maybeInit() {
    if (!_nsidNameToFaction) {
        _nsidNameToFaction = {};
        FACTION_DATA.forEach((factionAttrs) => {
            const faction = new Faction(factionAttrs);
            _nsidNameToFaction[faction.raw.faction] = faction;
        });
    }

    if (!_playerSlotToFaction) {
        _playerSlotToFaction = {};

        // Find all faction sheets, each player desk gets the closest.  Watch
        // out for extra faction sheets on the table!
        // In a franken game, this would build the faction from franken tokens.
        const slotToSheet = {};
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // inside a container
            }
            if (!ObjectNamespace.isFactionSheet(obj)) {
                continue; // not a faction sheet
            }
            const pos = obj.getPosition();
            const playerDesk = world.TI4.getClosestPlayerDesk(pos);
            const playerSlot = playerDesk.playerSlot;
            const existing = slotToSheet[playerSlot];
            if (existing) {
                const deskCenter = playerDesk.center;
                const dExisting = existing.getPosition().distance(deskCenter);
                const dCandidate = obj.getPosition().distance(deskCenter);
                if (dExisting <= dCandidate) {
                    continue; // existing is closer
                }
            }
            slotToSheet[playerSlot] = obj;
        }
        // Translate sheet to faction, make sure to share same Faction objects!
        for (const [slot, sheet] of Object.entries(slotToSheet)) {
            const nsidName = ObjectNamespace.parseFactionSheet(sheet).faction;
            const faction = Faction.getByNsidName(nsidName);
            if (!faction) {
                const nsid = ObjectNamespace.getNsid(sheet);
                throw new Error(`unknown faction from sheet "${nsid}"`);
            }
            _playerSlotToFaction[slot] = faction;
        }
    }
}

class Faction {
    static getAllFactions() {
        _maybeInit();
        return [...Object.values(_nsidNameToFaction)];
    }

    static getByPlayerSlot(playerSlot) {
        assert(typeof playerSlot === "number");
        _maybeInit();
        return _playerSlotToFaction[playerSlot];
    }

    static getByNsidName(nsidName) {
        assert(typeof nsidName === "string");
        _maybeInit();
        return _nsidNameToFaction[nsidName];
    }

    constructor(factionAttrs) {
        this._factionAttrs = factionAttrs;
    }

    get raw() {
        return this._factionAttrs;
    }

    get home() {
        return this._factionAttrs.home;
    }

    get nsidName() {
        return this._factionAttrs.faction;
    }

    get icon() {
        return this._factionAttrs.icon;
    }

    get nsidSource() {
        return this._factionAttrs.source;
    }

    get nameAbbr() {
        return locale("faction.abbr." + this.nsidName);
    }

    get nameFull() {
        return locale("faction.full." + this.nsidName);
    }

    get homeNsid() {
        return `tile.system:${this.nsidSource}/${this.home}`;
    }
}

module.exports = { Faction };
