// If using any custom events or world methods, require global.js to register them!

// Export under the mock names so tests can be explicit they are not using TTPG objects.
Object.assign(module.exports, {
    MockBorder: require("./mock-border"),
    MockButton: require("./mock-button"),
    MockCanvas: require("./mock-canvas"),
    MockCard: require("./mock-card"),
    MockCardDetails: require("./mock-card-details"),
    MockCardHolder: require("./mock-card-holder"),
    MockCheckBox: require("./mock-check-box"),
    MockColor: require("./mock-color"),
    MockContainer: require("./mock-container"),
    MockDice: require("./mock-dice"),
    MockGameObject: require("./mock-game-object"),
    MockGameWorld: require("./mock-game-world"),
    MockGlobalScriptingEvents: require("./mock-global-scripting-events"),
    MockHiddenCardsType: require("./mock-hidden-cards-type"),
    MockHorizontalAlignment: require("./mock-horizontal-alignment"),
    MockHorizontalBox: require("./mock-horizontal-box"),
    MockImageButton: require("./mock-image-button"),
    MockLayoutBox: require("./mock-layout-box"),
    MockObjectType: require("./mock-object-type"),
    MockPlayer: require("./mock-player"),
    MockRotator: require("./mock-rotator"),
    MockSlider: require("./mock-slider"),
    MockText: require("./mock-text"),
    MockTextJustification: require("./mock-text-justification"),
    MockTextWidgetBase: require("./mock-text-widget-base"),
    MockUIElement: require("./mock-ui-element"),
    MockVector: require("./mock-vector"),
    MockVerticalAlignment: require("./mock-vertical-alignment"),
    MockVerticalBox: require("./mock-vertical-box"),
    MockZone: require("./mock-zone"),
    MockZonePermission: require("./mock-zone-permission"),
});

// Export under the TTPG api names for unaware consumers.
Object.assign(module.exports, {
    Border: module.exports.MockBorder,
    Button: module.exports.MockButton,
    Canvas: module.exports.MockCanvas,
    Card: module.exports.MockCard,
    CardDetails: module.exports.MockCardDetails,
    CardHolder: module.exports.MockCardHolder,
    CheckBox: module.exports.MockCheckBox,
    Color: module.exports.MockColor,
    Container: module.exports.MockContainer,
    Dice: module.exports.MockDice,
    GameObject: module.exports.MockGameObject,
    GameWorld: module.exports.MockGameWorld,
    GlobalScriptingEvents: module.exports.MockGlobalScriptingEvents,
    HiddenCardsType: module.exports.MockHiddenCardsType,
    HorizontalAlignment: module.exports.MockHorizontalAlignment,
    HorizontalBox: module.exports.MockHorizontalBox,
    ImageButton: module.exports.MockImageButton,
    LayoutBox: module.exports.MockLayoutBox,
    ObjectType: module.exports.MockObjectType,
    Player: module.exports.MockPlayer,
    Rotator: module.exports.MockRotator,
    Slider: module.exports.MockSlider,
    Text: module.exports.MockText,
    TextJustification: module.exports.MockTextJustification,
    TextWidgetBase: module.exports.MockTextWidgetBase,
    UIElement: module.exports.MockUIElement,
    Vector: module.exports.MockVector,
    VerticalAlignment: module.exports.MockVerticalAlignment,
    VerticalBox: module.exports.MockVerticalBox,
    Zone: module.exports.MockZone,
    ZonePermission: module.exports.MockZonePermission,
});

// SHARE global objects.
const globalEvents = new module.exports.GlobalScriptingEvents();
const world = new module.exports.GameWorld();

// 'refObject' is tricky, it should be per-object and potentially meaningful.
// Create a dummy catch-all, specific tests can override if needed.
const refObject = new module.exports.GameObject();

// Create TTPG runtime objects.
Object.assign(module.exports, {
    refObject,
    globalEvents,
    world,
});
