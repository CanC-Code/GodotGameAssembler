// libs/godot_nodes.js
// Author: CCVO
// Purpose: Node management, scripts, Android controls

function attachScriptToLastNode(action) {
    if (!GodotState.lastNodeAdded) {
        addMessage("system", "No node selected for script. Add a node first.");
        return;
    }
    let scriptName = "";
    switch (action) {
        case "Attach Movement Script": scriptName = "player_movement.js"; break;
        case "Assign Jump Script": scriptName = "player_jump.js"; break;
        case "Assign Interact Script": scriptName = "player_interact.js"; break;
        default: scriptName = `${GodotState.lastNodeAdded.toLowerCase()}_script.js`; break;
    }
    chatInput.value = `attach script ${scriptName} to ${GodotState.lastNodeAdded} in ${GodotState.currentScene}`;
    chatInput.focus();
    addMessage("system", `Auto-filled script command. Press Enter to execute.`);
}

function suggestAndroidControls() {
    if (!GodotState.currentScene) return;

    const thumbstickName = "MoveThumbstick";
    const jumpButtonName = "JumpButton";
    const interactButtonName = "InteractButton";

    chatInput.value = `add thumbstick ${thumbstickName} to ${GodotState.currentScene}`;
    chatInput.focus();
    addMessage("system", `Auto-filled: Add movement thumbstick. Press Enter.`);

    setTimeout(() => {
        chatInput.value = `add button ${jumpButtonName} to ${GodotState.currentScene}`;
        chatInput.focus();
        addMessage("system", `Auto-filled: Add jump button. Press Enter.`);
    }, 500);

    setTimeout(() => {
        chatInput.value = `add button ${interactButtonName} to ${GodotState.currentScene}`;
        chatInput.focus();
        addMessage("system", `Auto-filled: Add interact button. Press Enter.`);
    }, 1000);
}

// Expose globally
window.attachScriptToLastNode = attachScriptToLastNode;
window.suggestAndroidControls = suggestAndroidControls;
