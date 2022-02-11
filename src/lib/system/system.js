const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { ObjectNamespace } = require("../object-namespace");
const { Card, GameObject, world } = require("../../wrapper/api");
const SYSTEM_ATTRS = require("./system.data");

let _tileToSystem = false;
let _planetLocaleNameToPlanet = false;

function _maybeInit(tile) {
    if (!_tileToSystem) {
        _tileToSystem = {};
        for (const rawAttrs of SYSTEM_ATTRS) {
            const system = new System(rawAttrs);
            assert(!_tileToSystem[system.tile]);
            _tileToSystem[system.tile] = system;
        }

        _planetLocaleNameToPlanet = {};
        for (const system of Object.values(_tileToSystem)) {
            for (const planet of system.planets) {
                _planetLocaleNameToPlanet[planet.raw.localeName] = planet;
            }
        }
    }
}

/**
 * A single planet in a system.  May change over time due to attachments, etc.
 */
class Planet {
    /**
     * Retrieve the planet object.  Do not use the contructor directly,
     * because attachements, etc, modify the shared instance.
     *
     * @param {Card} planetCard
     * @returns {Planet}
     */
    static getByPlanetCard(planetCard) {
        assert(planetCard instanceof Card);
        _maybeInit();

        const parsedNsid = ObjectNamespace.parseCard(planetCard);
        assert(parsedNsid.deck === "planet");
        const localeName = "planet." + parsedNsid.name;
        return _planetLocaleNameToPlanet[localeName];
    }

    constructor(attrs) {
        this._attrs = attrs;
    }

    get localeName() {
        return this.raw.localeName;
    }

    get raw() {
        return this._attrs;
    }

    get destroyed() {
        return this.raw.destroyed;
    }

    get radius() {
        return this.raw.radius;
    }

    get position() {
        return this.raw.position;
    }

    set destroyed(value) {
        this.raw.destroyed = value;
    }

    getNameStr() {
        return locale(this.localeName);
    }
}

/**
 * System tile.  May change over time due to attachments, etc.
 */
class System {
    /**
     * Retrieve the system object.  Do not use the contructor directly,
     * because attachements, etc, modify the shared instance.
     *
     * @param {number} tile
     * @returns {System}
     */
    static getByTileNumber(tile) {
        assert(typeof tile === "number");
        _maybeInit();
        return _tileToSystem[tile];
    }

    /**
     * Get the system from the associated system tile game object.
     *
     * @param {GameObject} obj
     * @returns {System|undefined}
     */
    static getBySystemTileObject(obj) {
        assert(obj instanceof GameObject);
        if (ObjectNamespace.isSystemTile(obj)) {
            const parsed = ObjectNamespace.parseSystemTile(obj);
            return this.getByTileNumber(parsed.tile);
        }
    }

    /**
     * Get the first system tile game object at position.
     *
     * @param {Vector} pos
     * @returns {GameObject}
     */
    static getSystemTileObjectByPosition(pos) {
        assert(typeof pos.x === "number");

        const src = pos.add([0, 0, 50]);
        const dst = pos.subtract([0, 0, 50]);
        const hits = world.lineTrace(src, dst);
        for (const hit of hits) {
            if (ObjectNamespace.isSystemTile(hit.object)) {
                return hit.object;
            }
        }
    }

    /**
     * Get all system tiles on the table.
     *
     * @returns {Array.{GameObject}}
     */
    static getAllSystemTileObjects() {
        const result = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside container
            }
            if (ObjectNamespace.isSystemTile(obj)) {
                result.push(obj);
            }
        }
        return result;
    }

    constructor(systemAttrs) {
        this._attrs = systemAttrs;

        this._planets = [];
        if (systemAttrs.planets) {
            this._planets.push(
                ...systemAttrs.planets.map(
                    (planeAttrs) => new Planet(planeAttrs)
                )
            );
        }

        this._wormholes = [];
        if (systemAttrs.wormholes) {
            this._wormholes.push(...systemAttrs.wormholes);
        }

        this._anomalies = [];
        if (systemAttrs.anomalies) {
            this._anomalies.push(...systemAttrs.anomalies);
        }
    }

    get tile() {
        return this._attrs.tile;
    }

    get home() {
        return this._attrs.home;
    }

    get planets() {
        // Planets may be added (Mirage) and removed (Stellar Converter).
        return this._planets;
    }

    get wormholes() {
        // TODO XXX check if system if face up / down
        // Depending on how we manage wormhole tokens might be adding/removing!
        return this._wormholes;
    }

    get anomalies() {
        return this._anomalies;
    }

    get raw() {
        return this._attrs;
    }

    getSummaryStr() {
        const summary = [];
        summary.push(
            ...this.planets.map((planet) => {
                return locale(planet.raw.localeName);
            })
        );
        summary.push(
            ...this.wormholes.map((wormhole) => {
                return locale("wormhole." + wormhole);
            })
        );
        return summary.join(", ");
    }
}

module.exports = { System, Planet };
