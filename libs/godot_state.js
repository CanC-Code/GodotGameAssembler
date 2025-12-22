// libs/godot_state.js
// Author: CCVO
// Purpose: Store global Godot state and helper functions

const GodotState = {
    gameName: null,
    concept: null,
    currentScene: null,
    lastNodeAdded: null,
    nodesInScene: {} // { sceneName: [ { name, type, script, touchPosition } ] }
};

// Get last node type in current scene
function getLastNodeType(nodeName) {
    const nodes = GodotState.nodesInScene[GodotState.currentScene] || [];
    const node = nodes.find(n => n.name === nodeName);
    return node ? node.type : null;
}

// Expose globally
window.GodotState = GodotState;
window.getLastNodeType = getLastNodeType;
