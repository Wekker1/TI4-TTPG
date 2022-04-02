const assert = require("../../wrapper/assert-wrapper");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../object-namespace");
const { Spawn } = require("../../setup/spawn/spawn");
const MapStringHex = require("./map-string-hex");
const MapStringParser = require("./map-string-parser");
const { ObjectType, Rotator, world } = require("../../wrapper/api");

/**
 * Place system tiles according to map string.
 *
 * Try to find tiles on table or in a container, spawn if missing.
 */
class MapStringLoad {
    static load(mapString, skipMallice = false) {
        assert(typeof mapString === "string");

        const parsedMapString = MapStringParser.parse(mapString);

        // Find existing tiles (may be inside containers).
        const tileToSystemObj = {};
        for (const obj of world.getAllObjects()) {
            if (ObjectNamespace.isSystemTile(obj)) {
                const tile = ObjectNamespace.parseSystemTile(obj).tile;
                tileToSystemObj[tile] = obj;
            }
        }

        const placeTile = (entry, hex) => {
            const system = world.TI4.getSystemByTileNumber(entry.tile);
            assert(system);

            // Get position/rotation.
            const pos = Hex.toPosition(hex);
            pos.z = world.getTableHeight() + 10;
            const rot = new Rotator(0, 0, 0);
            if (entry.side == "b") {
                rot.roll = 180;
            }
            if (entry.rotation) {
                rot.yaw = entry.rotation * 60;
            }
            //console.log(`placeTile ${entry.tile} at ${pos} / ${rot}`);

            // Find or spawn the tile.
            let obj = tileToSystemObj[entry.tile];
            if (obj) {
                // Use object, remove it should the tile appear again.
                delete tileToSystemObj[entry.tile];
            } else {
                // Missing tile, spawn a new one.
                const nsid = `tile.system:${system.raw.source}/${entry.tile}`;
                obj = Spawn.spawn(nsid, pos, rot);
            }

            // Mallice starts upside down.
            if (entry.tile === 82) {
                rot.roll = 180;
            }

            // Place tile.
            const animSpeed = 1;
            obj.setObjectType(ObjectType.Regular);
            const container = obj.getContainer();
            if (container) {
                container.take(obj, pos, animSpeed > 0);
                obj.setRotation(rot, animSpeed);
            } else {
                obj.setPosition(pos, animSpeed);
                obj.setRotation(rot, animSpeed);
            }
            obj.setObjectType(ObjectType.Ground);
        };

        // Place!
        for (let i = 0; i < parsedMapString.length; i++) {
            const entry = parsedMapString[i];
            if (entry.tile <= 0) {
                continue;
            }
            const hex = MapStringHex.idxToHexString(i);
            placeTile(entry, hex);
        }

        // Add Mallice
        if (world.TI4.config.pok && !skipMallice) {
            placeTile({ tile: 82 }, "<-4,5,-1>");
        }
    }

    static moveGenericHomeSystemTiles(mapString) {
        assert(typeof mapString === "string");

        const playerCount = world.TI4.config.playerCount;
        const parsedMapString = MapStringParser.parse(mapString);

        // Get available positions from map string.
        const zeroHexes = [];
        for (let i = 0; i < parsedMapString.length; i++) {
            const entry = parsedMapString[i];
            if (entry.tile === 0) {
                const hex = MapStringHex.idxToHexString(i);
                zeroHexes.push(hex);
            }
        }
        if (zeroHexes.length !== playerCount) {
            return; // abort if wrong number
        }

        // Get generic home system tiles.
        const playerSlotToGeneric = {};
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "tile.system:base/0") {
                continue;
            }
            const playerSlot = obj.getOwningPlayerSlot();
            if (world.TI4.getPlayerDeskByPlayerSlot(playerSlot)) {
                playerSlotToGeneric[playerSlot] = obj;
            }
        }
        if (Object.keys(playerSlotToGeneric).length !== playerCount) {
            return; // abort if wrong number
        }

        // Move tiles to available positions.
        // Optimal placement is called "the assignment problem" and is tricky.
        // Make a simplifying assumption that tiles in clockwise order get the
        // player zone colors in clockwise order, choosing the best start.
        const deskIndexToAngle = {};
        const playerDeskArray = world.TI4.getAllPlayerDesks();
        playerDeskArray.forEach((playerDesk, index) => {
            const pos = playerDesk.center;
            const angle = Math.atan2(pos.y, pos.x);
            deskIndexToAngle[index] = angle;
        });

        const hexIndexToAngle = {};
        zeroHexes.forEach((hex, index) => {
            const pos = Hex.toPosition(hex);
            const angle = Math.atan2(pos.y, pos.x);
            hexIndexToAngle[index] = angle;
        });

        let best = false;
        let bestD = Number.MAX_VALUE;
        for (let candidate = 0; candidate < playerCount; candidate++) {
            let d = 0;
            for (let offset = 0; offset < playerCount; offset++) {
                const index = (offset + candidate) % playerCount;
                const deskAngle = deskIndexToAngle[offset];
                const hexAngle = hexIndexToAngle[index];
                d += Math.abs(deskAngle - hexAngle);
            }
            if (d < bestD) {
                best = candidate;
                bestD = d;
            }
        }

        playerDeskArray.forEach((playerDesk, index) => {
            index = (index + best) % playerCount;
            const playerSlot = playerDesk.playerSlot;
            const genericHomeSystem = playerSlotToGeneric[playerSlot];
            const hex = zeroHexes[index];
            const pos = Hex.toPosition(hex);
            pos.z = world.getTableHeight() + 1;
            if (genericHomeSystem) {
                genericHomeSystem.setPosition(pos);
            }
        });
    }
}

module.exports = { MapStringLoad };
