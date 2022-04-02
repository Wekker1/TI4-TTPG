const { Vector } = require("../wrapper/api");
const assert = require("../wrapper/assert-wrapper");
const {
    GlobalSavedData,
    GLOBAL_SAVED_DATA_KEY,
} = require("./saved-data/global-saved-data");

// Transforms for flat-top hex grid.
const LAYOUT_FLAT = {
    // F(orward) translates hex to position.
    f0: 3.0 / 2.0,
    f1: 0.0,
    f2: Math.sqrt(3.0) / 2.0,
    f3: Math.sqrt(3.0),
    // B(ackward) translates position to hex.
    b0: 2.0 / 3.0,
    b1: 0.0,
    b2: -1.0 / 3.0,
    b3: Math.sqrt(3.0) / 3.0,
    // Angle to first corner.
    startAngle: 0.0,
};

// Transforms for pointy-top hex grid.
const LAYOUT_POINTY = {
    // F(orward) translates hex to position.
    f0: LAYOUT_FLAT.f3,
    f1: LAYOUT_FLAT.f2,
    f2: LAYOUT_FLAT.f1,
    f3: LAYOUT_FLAT.f0,

    // B(ackward) translates position to hex.
    b0: LAYOUT_FLAT.b3,
    b1: LAYOUT_FLAT.b2,
    b2: LAYOUT_FLAT.b1,
    b3: LAYOUT_FLAT.b0,
    // Angle to first corner.
    startAngle: 0.5,
};

const M = LAYOUT_POINTY;

// SCALE sizes the hex grid, but is also used when spawning system tiles to match.
// 1.667 corresponds to hex size from the *other* simulator wrt unit scale 1.
// 1.5 with unit scale 0.8.
const SCALE_DEFAULT = 1.5;
const SCALE_LARGER = 2.0;
const HALF_SIZE_UNSCALED = 5.77735;

/**
 * Heavily distilled hex math based on RedBlobGames excellent hex docs.
 * "Hex" values are strings for easy use as keys and comparison.
 * @author Darrell
 */
class Hex {
    static getLargerScale() {
        const config = GlobalSavedData.get(GLOBAL_SAVED_DATA_KEY.HEX, {});
        return config.lg ? true : false;
    }

    /**
     * Use larger hexes?  This is persistent across save/load.
     *
     * @param {boolean} useLarger
     */
    static setLargerScale(useLarger) {
        assert(typeof useLarger === "boolean");

        const config = GlobalSavedData.get(GLOBAL_SAVED_DATA_KEY.HEX, {});
        config.lg = useLarger;
        GlobalSavedData.set(GLOBAL_SAVED_DATA_KEY.HEX, config);

        Hex.SCALE = useLarger ? SCALE_LARGER : SCALE_DEFAULT;
        Hex.HALF_SIZE = HALF_SIZE_UNSCALED * Hex.SCALE;
    }

    // Consumers beware, this may change during pre-setup time.  It remains fixed
    // once committed to a game configuration.
    static SCALE = Hex.getLargerScale() ? SCALE_LARGER : SCALE_DEFAULT;
    static HALF_SIZE = 5.77735 * Hex.SCALE; // Half of hex width, 11.547cm

    // TTPG hex grid parameters:
    // Z: 11.33, H: 17.332, W: 12.999, [13x9] grid

    static _z = 0;

    /**
     * Hex is a static-only class, do not instantiate it.
     */
    constructor() {
        throw new Error("Hex is static only");
    }

    static _hexFromString(hex) {
        assert(typeof hex === "string");

        const m = hex.match(/^<(-?\d+),(-?\d+),(-?\d+)>$/);
        const q = parseFloat(m[1]);
        const r = parseFloat(m[2]);
        const s = parseFloat(m[3]);
        if (Math.round(q + r + s) !== 0) {
            throw new Error(`q + r + s must be 0 ("${hex}")`);
        }
        return [q, r, s];
    }

    static _hexToString(q, r, s) {
        assert(typeof q === "number");
        assert(typeof r === "number");
        assert(typeof s === "number");

        return `<${q},${r},${s}>`;
    }

    /**
     * Get hex at position.
     *
     * @param {Vector} pos - Cartesian position on XY surface
     * @param {number} pos.x
     * @param {number} pos.y
     * @param {number} pos.z
     * @returns {string} hex as "<q,r,s>" string
     */
    static fromPosition(pos) {
        assert(typeof pos === "object");
        assert(typeof pos.x === "number");
        assert(typeof pos.y === "number");
        assert(typeof pos.z === "number");

        // Fractional hex position.
        const x = pos.x / Hex.HALF_SIZE;
        const y = pos.y / Hex.HALF_SIZE;
        const q = M.b0 * x + M.b1 * y;
        const r = M.b2 * x + M.b3 * y;
        const s = -q - r;

        // Round to grid aligned hex.
        let qi = Math.round(q);
        let ri = Math.round(r);
        let si = Math.round(s);
        const q_diff = Math.abs(qi - q);
        const r_diff = Math.abs(ri - r);
        const s_diff = Math.abs(si - s);
        if (q_diff > r_diff && q_diff > s_diff) {
            qi = -ri - si;
        } else {
            if (r_diff > s_diff) {
                ri = -qi - si;
            } else {
                si = -qi - ri;
            }
        }

        return Hex._hexToString(qi, ri, si);
    }

    /**
     * Get position from hex.
     *
     * @param {string} hex - Hex as "<q,r,s>" string
     * @returns {Vector} position
     */
    static toPosition(hex) {
        assert(typeof hex === "string");

        const [q, r] = Hex._hexFromString(hex);

        const x = (M.f0 * q + M.f1 * r) * Hex.HALF_SIZE;
        const y = (M.f2 * q + M.f3 * r) * Hex.HALF_SIZE;
        const z = Hex._z;
        return new Vector(x, y, z);
    }

    /**
     * Get positions of hex corners.
     * First at "top right", winding counterclockwise.
     *
     * @param {string} hex - Hex as "<q,r,s>" string
     * @return {Array} list of position Vectors
     */
    static corners(hex) {
        assert(typeof hex === "string");

        const center = Hex.toPosition(hex);
        const result = [];
        const z = Hex._z;
        for (let i = 0; i < 6; i++) {
            const phi = (2 * Math.PI * (M.startAngle - i)) / 6;
            const x = center.x + Hex.HALF_SIZE * Math.cos(phi);
            const y = center.y + Hex.HALF_SIZE * Math.sin(phi);
            result.push(new Vector(x, y, z));
        }

        return result;
    }

    /**
     * Get adjacent hexes.
     * First is "above", winding counterclockwise.
     *
     * @param {string} hex - Hex as "<q,r,s>" string
     * @return {Array} list of hex strings
     */
    static neighbors(hex) {
        assert(typeof hex === "string");

        const [q, r, s] = Hex._hexFromString(hex);
        return [
            Hex._hexToString(q + 1, r + 0, s - 1),
            Hex._hexToString(q + 1, r - 1, s + 0),
            Hex._hexToString(q + 0, r - 1, s + 1),
            Hex._hexToString(q - 1, r + 0, s + 1),
            Hex._hexToString(q - 1, r + 1, s + 0),
            Hex._hexToString(q + 0, r + 1, s - 1),
        ];
    }
}

module.exports.Hex = Hex;
