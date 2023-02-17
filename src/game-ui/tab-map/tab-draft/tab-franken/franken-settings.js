const { Franken } = require("../../../../lib/draft/franken/franken");
const { FrankenDraftSettingsUI } = require("./franken-settings-ui");

class FrankenDraftSettings {
    constructor() {
        const franken = new Franken();

        const callbacks = {
            startDraft: (options) => {
                franken.startDraft();
            },
            onCancel: () => {
                franken.cancel();
            },
        };
        this._ui = new FrankenDraftSettingsUI(franken, callbacks).getWidget();
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { FrankenDraftSettings };
