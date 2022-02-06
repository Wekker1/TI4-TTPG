const assert = require("../../wrapper/assert");
const { Color, Player, globalEvents, world } = require("../../wrapper/api");
const GameObject = require("../../mock/mock-game-object");

const _rollInProgressDieGuidToSimpleDie = {};

class SimpleDieBuilder {
    constructor() {
        this._callback = false;
        this._color = false;
        this._deleteAfterSeconds = 10;
        this._hitValue = Number.MAX_SAFE_INTEGER;
        this._name = false;
        this._reroll = false;
        this._spawnPosition = false;
    }

    setCallback(callback) {
        assert(typeof callback === "function");
        this._callback = callback;
        return this;
    }

    setColor(color) {
        assert(color instanceof Color);
        this._color = color;
        return this;
    }

    setDeleteAfterSeconds(value) {
        assert(typeof value === "number");
        this._deleteAfterSeconds = value;
        return this;
    }

    setHitValue(value) {
        assert(typeof value === "number");
        this._hitValue = value;
        return this;
    }

    setName(name) {
        assert(typeof name === "string");
        this._name = name;
        return this;
    }

    setReroll(value) {
        assert(typeof value === "boolean");
        this._reroll = value;
        return this;
    }

    setSpawnPosition(pos) {
        assert(typeof pos.x === "number");
        this._spawnPosition = pos;
        return this;
    }

    build() {
        return new SimpleDie(this);
    }
}

class SimpleDie {
    constructor(builder) {
        assert(builder instanceof SimpleDieBuilder);
        this._callback = builder._callback;
        this._color = builder._color;
        this._deleteAfterSeconds = builder._deleteAfterSeconds;
        this._hitValue = builder._hitValue;
        this._name = builder._name;
        this._reroll = builder._reroll;
        this._spawnPosition = builder._spawnPosition;

        this._player = false;
        this._die = false;
        this._value = false;
        this._preRerollValue = false;
    }

    spawnAndRoll(player) {
        assert(player instanceof Player);
        assert(!this._die);
        this._player = player;

        const pos = this._spawnPosition || [0, 0, world.getTableHeight()];

        // TTPG D10.
        const templateId = "9065AC5141F87F8ADE1F5AB6390BBEE4";
        this._die = world.createObjectFromTemplate(templateId, pos);

        if (this._color) {
            this._die.setPrimaryColor(this._color);
        }
        if (this._deleteAfterSeconds) {
            const delayedDelete = () => {
                if (this._die.isValid()) {
                    this._die.destroy();
                    delete this._die;
                }
            };
            setTimeout(delayedDelete, this._deleteAfterSeconds * 1000);
        }
        if (this._name) {
            this._die.setName(this._name);
        }

        _rollInProgressDieGuidToSimpleDie[this._die.getId()] = this;
        this._die.roll(this._player); // MUST set player to get OnDiceRolled events

        return this;
    }

    setValue(value) {
        // Reroll if enabled and this is a miss.
        if (
            this._reroll &&
            this._preRerollValue === false &&
            value < this._hitValue
        ) {
            this._preRerollValue = value;
            this._die.roll(this._player); // MUST set player to get OnDiceRolled events
            return; // wait for reroll to finish
        }

        this._value = value;
        if (this._callback) {
            this._callback(this);
        }
        return this;
    }

    hasValue() {
        return this._value !== false; // value set when roll finishes
    }

    getValue() {
        assert(this.hasValue());
        return this._value;
    }

    getValueString() {
        assert(this.hasValue());
        const parts = [];
        if (this._preRerollValue !== false) {
            parts.push(`${this._preRerollValue}->`);
        }
        parts.push(`${this._value}`);
        if (this._value >= this._hitValue) {
            parts.push("*");
        }
        return parts.join("");
    }
}

// Roll finished.
globalEvents.onDiceRolled.add((player, dieObjs) => {
    assert(player instanceof Player);
    assert(Array.isArray(dieObjs));

    for (const dieObj in dieObjs) {
        const guid = dieObj.getId();
        const simpleDie = _rollInProgressDieGuidToSimpleDie[guid];
        if (simpleDie) {
            delete _rollInProgressDieGuidToSimpleDie[guid];
            simpleDie.setValue(dieObj.getCurrentFaceIndex());
        }
    }
});

// Die was deleted before roll finished??
globalEvents.onObjectDestroyed.add((obj) => {
    assert(obj instanceof GameObject);
    const guid = obj.getId();
    const simpleDie = _rollInProgressDieGuidToSimpleDie[guid];
    if (simpleDie) {
        delete _rollInProgressDieGuidToSimpleDie[guid];
        simpleDie.setValue(-1);
    }
});

module.exports = { SimpleDieBuilder, SimpleDie };
