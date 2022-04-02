const Rotator = require("./mock-rotator");

/**
 * Mock https://api.tabletop-playground.com/classes/_api_.vector.html
 */
class Vector {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    subtract(v) {
        if (Array.isArray(v)) {
            return new Vector(this.x - v[0], this.y - v[1], this.z - v[2]);
        } else {
            return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
        }
    }

    add(v) {
        if (Array.isArray(v)) {
            return new Vector(this.x + v[0], this.y + v[1], this.z + v[2]);
        } else {
            return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
        }
    }

    clone() {
        return new Vector(this.x, this.y, this.z);
    }

    magnitudeSquared() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    rotateAngleAxis() {
        return this;
    }

    findLookAtRotation() {
        return new Rotator(0, 0, 0);
    }
}

module.exports = Vector;
