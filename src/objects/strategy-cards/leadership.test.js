const {
    globalEvents,
    MockGameObject,
    MockGameWorld,
    MockPlayer,
} = require("../../mock/mock-api");
const { PlayerDesk } = require("../../lib/player-desk");
const TriggerableMulticastDelegate = require("../../lib/triggerable-multicast-delegate");

// mock global.js event registration
globalEvents.TI4 = {
    onStrategyCardPlayed: new TriggerableMulticastDelegate(),
    onStrategyCardSelectionDone: new TriggerableMulticastDelegate(),
};

const red = { r: 1, g: 0, b: 0 };
const green = { r: 0, g: 1, b: 0 };
const player1 = new MockPlayer({ name: "one", playerColor: red });
const player2 = new MockPlayer({ name: "two", playerColor: green });
global.world = new MockGameWorld({ allPlayers: [player1, player2] });

require("./leadership");

PlayerDesk.setPlayerCount(2);
PlayerDesk.getPlayerDesks()[0].seatPlayer(player1);
PlayerDesk.getPlayerDesks()[1].seatPlayer(player2);

describe("when a leadership card", () => {
    afterEach(() => {
        global.world.getUIs().map((ui) => global.world.removeUIElement(ui));
    });

    it("is played", () => {
        let card = new MockGameObject();

        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        expect(global.world.getUIs().length).toBe(2);
    });
});

describe("when a player has done the leadership selection", () => {
    it("it sends messages", () => {
        let card = new MockGameObject();
        const player1Spy = jest.spyOn(player1, "sendChatMessage");
        const player2Spy = jest.spyOn(player2, "sendChatMessage");

        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);
        globalEvents.TI4.onStrategyCardSelectionDone.trigger(card, player1);

        expect(player1Spy).toBeCalledWith(
            "one gained 0 command tokens.",
            player1.getPlayerColor()
        );
        expect(player2Spy).toBeCalledWith(
            "one gained 0 command tokens.",
            player1.getPlayerColor()
        );
    });
});
