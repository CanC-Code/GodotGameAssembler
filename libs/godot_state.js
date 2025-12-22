// libs/godot_state.js
// Author: CCVO
// Purpose: Centralized global state for Godot Game Assembler

const WorkflowStage = {
    INIT: "INIT",
    CONCEPT: "CONCEPT",
    SCENE: "SCENE",
    NODE: "NODE",
    MENU_LAYOUT: "MENU_LAYOUT",
    BUTTON_SETUP: "BUTTON_SETUP",
    SCENE_TRANSITION: "SCENE_TRANSITION",
    DONE: "DONE"
};

const GodotState = {
    workflowStage: WorkflowStage.INIT,

    gameName: null,
    concept: null,
    currentScene: null,

    scenes: [],
    nodesInScene: {},

    lastNodeAdded: null,

    androidControls: [],
    uiElements: []
};

// Expose globally
window.GodotState = GodotState;
window.WorkflowStage = WorkflowStage;

console.log("godot_state.js loaded");
