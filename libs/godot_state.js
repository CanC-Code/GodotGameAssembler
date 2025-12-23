// libs/godot_state.js
window.GodotState = {
    gameName: null,
    concept: null,
    currentScene: null,
    nodesInScene: {},
    lastNodeAdded: null,

    // Controller system
    controllers: {},           // id -> controller object
    activeController: null     // currently edited/assigned
};

// ------------------------------
// Controller helpers
// ------------------------------
GodotState.createController = function (id, type = "touch") {
    if (this.controllers[id]) return this.controllers[id];

    const controller = {
        id,
        type,
        bindings: {},
        layout: {}
    };

    this.controllers[id] = controller;
    this.activeController = id;
    return controller;
};

GodotState.getActiveController = function () {
    if (!this.activeController) return null;
    return this.controllers[this.activeController];
};

GodotState.assignControllerToNode = function (scene, nodeName, controllerId) {
    const nodes = this.nodesInScene[scene] || [];
    const node = nodes.find(n => n.name === nodeName);
    if (!node) return;

    node.controller = controllerId;
};
