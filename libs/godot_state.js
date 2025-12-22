// libs/godot_state.js
// Author: CCVO
// Purpose: Central mutable state for Godot Game Assembler (human-first)

window.GodotState = {
    // Project identity
    gameName: null,
    concept: null,

    // Scene tracking
    currentScene: null,
    nodesInScene: {},

    // Controller system (NEW)
    controllers: {},           // id -> controller object
    activeController: null,    // currently edited / assigned controller

    // Conversational flow control (NEW)
    creationContext: null,     // { type, subtype, data, step }

    // UI helpers
    lastNodeAdded: null
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
