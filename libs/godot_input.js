// libs/godot_input.js
// Author: CCVO
// Purpose: Input parsing and progressive workflow

function processInput(input) {
    input = input.trim();
    if (!input) return;
    addMessage("user", input);

    if (!GodotState.gameName) {
        GodotState.gameName = input;
        addMessage("system", `Game named "${GodotState.gameName}".`);
    } else if (!GodotState.concept) {
        GodotState.concept = input;
        addMessage("system", `Concept set: "${GodotState.concept}".`);
    } else if (!GodotState.currentScene) {
        const sceneName = input;
        GodotState.currentScene = sceneName;
        ProjectManager.execute(`create scene ${sceneName}`);
        addMessage("system", `Scene "${sceneName}" created and selected.`);
        GodotState.nodesInScene[sceneName] = [];
    } else {
        ProjectManager.execute(input);

        const matchAddNode = input.match(/add node (\w+) (\w+) to (\w+)/i);
        if (matchAddNode) {
            const [_, name, type, scene] = matchAddNode;
            GodotState.lastNodeAdded = name;
            if (!GodotState.nodesInScene[scene]) GodotState.nodesInScene[scene] = [];
            GodotState.nodesInScene[scene].push({ name, type, script: null });
        }

        const matchAddUI = input.match(/add (thumbstick|button) (\w+) to (\w+)/i);
        if (matchAddUI) {
            const [_, type, name, scene] = matchAddUI;
            if (!GodotState.nodesInScene[scene]) GodotState.nodesInScene[scene] = [];
            GodotState.nodesInScene[scene].push({ name, type, script: type === "thumbstick" ? "movement_touch.js" : "action_touch.js" });
        }

        const matchAttachScript = input.match(/attach script (.+) to (\w+) in (\w+)/i);
        if (matchAttachScript) {
            const [_, scriptName, nodeName, scene] = matchAttachScript;
            const nodes = GodotState.nodesInScene[scene] || [];
            const node = nodes.find(n => n.name === nodeName);
            if (node) node.script = scriptName;
        }
    }

    updateInfoPanel();
    addMessage("system", getNextPrompt());
    updateSuggestions();
}

function getNextPrompt() {
    if (!GodotState.gameName) return "What is the name of your game?";
    if (!GodotState.concept) return `Please describe the concept of "${GodotState.gameName}".`;
    if (!GodotState.currentScene) return "Let's create your first scene. What should it be called?";
    return `Next, add nodes, attach scripts, add Android touch controls, or create a new scene in "${GodotState.currentScene}".`;
}

// Event listener
chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        const input = chatInput.value;
        chatInput.value = "";
        processInput(input);
    }
});

window.processInput = processInput;
