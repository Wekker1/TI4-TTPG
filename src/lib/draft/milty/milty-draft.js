const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { Broadcast } = require("../../broadcast");
const { ColorUtil } = require("../../color/color-util");
const { DraftSelectionManager } = require("../draft-selection-manager");
const { MapStringLoad } = require("../../map-string/map-string-load");
const { MiltyDraftUI } = require("./milty-draft-ui");
const { MiltySliceLayout } = require("./milty-slice-layout");
const { MiltyUtil } = require("./milty-util");
const { ObjectNamespace } = require("../../object-namespace");
const { PlayerDeskSetup } = require("../../player-desk/player-desk-setup");
const { SeatTokenUI } = require("./seat-token-ui");
const { DEFAULT_SLICE_SCALE } = require("./milty-slice-ui");
const { Player, UIElement, world } = require("../../../wrapper/api");

const SELECTION_BORDER_SIZE = 4;

const SPEAKER_TOKEN_POS = { x: 46, y: 0, z: 5 };

class MiltyDraft {
    constructor() {
        this._sliceDataArray = [];
        this._factionDataArray = [];
        this._seatDataArray = [];
        this._uis = [];
        this._scale = DEFAULT_SLICE_SCALE;

        this._draftSelectionManager = new DraftSelectionManager()
            .setBorderSize(SELECTION_BORDER_SIZE * this._scale)
            .setAdvanceTurnOnSelection(true);
    }

    resetSlices() {
        this._sliceDataArray = [];
    }

    addSlice(slice, color, label) {
        assert(Array.isArray(slice));
        assert(!color || ColorUtil.isColor(color));
        assert(typeof label === "string");

        const error = MiltyUtil.getSliceError(slice);
        if (error) {
            Broadcast.chatAll(error);
            return;
        }

        const sliceData = {
            slice,
            color,
            label,
        };
        const sliceCategoryName = locale("ui.draft.category.slice");
        sliceData.onClickedGenerator =
            this._draftSelectionManager.createOnClickedGenerator(
                sliceCategoryName,
                label,
                sliceData
            );
        this._sliceDataArray.push(sliceData);
        return this;
    }

    addFaction(nsidName) {
        assert(typeof nsidName === "string");

        const faction = world.TI4.getFactionByNsidName(nsidName);
        if (!faction) {
            throw new Error(`unknown faction "${nsidName}"`);
        }

        const factionData = {
            nsidName,
        };
        const factionCategoryName = locale("ui.draft.category.faction");
        factionData.onClickedGenerator =
            this._draftSelectionManager.createOnClickedGenerator(
                factionCategoryName,
                faction.nameFull,
                factionData
            );
        this._factionDataArray.push(factionData);
        return this;
    }

    setSpeakerIndex(speakerIndex) {
        assert(typeof speakerIndex === "number");

        this._seatDataArray = SeatTokenUI.getSeatDataArray(speakerIndex);

        const seatCategoryName = locale("ui.draft.category.seat");
        this._seatDataArray.forEach((seatData) => {
            seatData.onClickedGenerator =
                this._draftSelectionManager.createOnClickedGenerator(
                    seatCategoryName,
                    (seatData.orderIndex + 1).toString(),
                    seatData
                );
        });
        return this;
    }

    _createUI(playerDesk) {
        const pos = playerDesk.center.add([0, 0, 10]);
        const rot = playerDesk.rot;

        const onFinishedButton =
            this._draftSelectionManager.createOnFinishedButton();
        onFinishedButton.onClicked.add((button, player) => {
            this.clearPlayerUIs();
            this.applyChoices(player);
        });

        const { widget, w, h } = new MiltyDraftUI(this._scale)
            .addSlices(this._sliceDataArray)
            .addFactions(this._factionDataArray)
            .addSeats(this._seatDataArray)
            .getWidgetAndSize(onFinishedButton);
        console.log(`draft ${w}x${h}`);

        const ui = new UIElement();
        ui.width = w;
        ui.height = h;
        ui.useWidgetSize = false;
        ui.position = pos;
        ui.rotation = rot;
        ui.widget = widget;
        ui.scale = 1 / this._scale;

        return ui;
    }

    createPlayerUIs() {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            // Hide desk UI (still show "take seat")
            playerDesk.setReady(true);

            const ui = this._createUI(playerDesk);
            this._uis.push(ui);
            world.addUI(ui);
        }
        return this;
    }

    clearPlayerUIs() {
        this._uis.forEach((ui) => {
            world.removeUIElement(ui);
        });
        return this;
    }

    cancel() {
        this.clearPlayerUIs();
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerDesk.setReady(false);
        }
    }

    _applyPlayerChoices(chooserSlot, chooserPlayer) {
        assert(typeof chooserSlot === "number");
        assert(!chooserPlayer || chooserPlayer instanceof Player);

        const sliceCategoryName = locale("ui.draft.category.slice");
        const sliceData = this._draftSelectionManager.getSelectionData(
            chooserSlot,
            sliceCategoryName
        );
        assert(sliceData);

        const factionCategoryName = locale("ui.draft.category.faction");
        const factionData = this._draftSelectionManager.getSelectionData(
            chooserSlot,
            factionCategoryName
        );
        assert(factionData);

        const seatCategoryName = locale("ui.draft.category.seat");
        const seatData = this._draftSelectionManager.getSelectionData(
            chooserSlot,
            seatCategoryName
        );
        assert(seatData);

        // Move player to slot.
        const playerDesks = world.TI4.getAllPlayerDesks();
        const playerDesk = playerDesks[seatData.deskIndex];
        assert(playerDesk);
        const playerSlot = playerDesk.playerSlot; // new slot
        if (chooserPlayer) {
            playerDesk.seatPlayer(chooserPlayer);
        }

        // Unpack slice.
        const sliceStr = sliceData.slice.join(" ");
        MiltySliceLayout.doLayout(sliceStr, playerSlot);

        // Unpack faction.
        new PlayerDeskSetup(playerDesk).setupFaction(factionData.nsidName);
    }

    applyChoices(player) {
        assert(player instanceof Player);

        // Position Mecatol and Mallice.
        MapStringLoad.load("{18}", false);

        // Remember player slot to chooser-player.
        const playerSlotToChooserPlayer = {};
        for (const player of world.getAllPlayers()) {
            playerSlotToChooserPlayer[player.getSlot()] = player;
        }

        // Move all players to non-seat slots.
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerDesk.unseatPlayer();
        }

        // Apply choices.
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const playerSlot = playerDesk.playerSlot;
            const player = playerSlotToChooserPlayer[playerSlot];
            this._applyPlayerChoices(playerSlot, player);
        }

        // Set turn order.
        let order = [];
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const playerSlot = playerDesk.playerSlot;
            const seatCategoryName = locale("ui.draft.category.seat");
            const seatData = this._draftSelectionManager.getSelectionData(
                playerSlot,
                seatCategoryName
            );
            assert(seatData);
            order[seatData.orderIndex] = playerDesk;
        }
        order = order.filter((entry) => {
            return entry ? true : false;
        });
        if (order.length > 0) {
            world.TI4.turns.setTurnOrder(order, player);
        }

        // Move speaker token.
        const speakerDesk = order.length > 0 ? order[0] : false;
        const speakerTokenNsid = "token:base/speaker";
        let speakerToken = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === speakerTokenNsid) {
                speakerToken = obj;
                break;
            }
        }
        if (speakerDesk && speakerToken) {
            const pos = speakerDesk.localPositionToWorld(SPEAKER_TOKEN_POS);
            const rot = speakerDesk.rot;
            speakerToken.setPosition(pos);
            speakerToken.setRotation(rot);
        }

        return this;
    }
}

module.exports = { MiltyDraft };
