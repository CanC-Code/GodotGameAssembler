// libs/godot_input.js
// Author: CCVO
// Purpose: Input parsing helpers (NO event listeners)

// ------------------------------
// Safe ProjectManager bridge
// ------------------------------
function executeProjectCommand(command) {
    if (!window.ProjectManager) {
        console.error("ProjectManager not loaded");
        return;
    }

    if (typeof ProjectManager.execute === "function") {
        ProjectManager.execute(command);
    } else if (typeof ProjectManager.run === "function") {
        ProjectManager.run(command);
    } else if (typeof ProjectManager.dispatch === "function") {
        ProjectManager.dispatch(command);
    } else {
        console.error("No executable command method found on ProjectManager", ProjectManager);
    }
}

// ------------------------------
// Progressive input processor
// ------------------------------
function processInput(input) {
    input = input.trim();
    if (!input) return;

    addMessage("user", input);

    if (!GodotState.gameName) {
        GodotState.gameName = input;
        addMessage("system", `Game named "${GodotState.gameName}".`);
    } 
    else if (!GodotState.concept) {
        GodotState.concept = input;
        addMessage("system", `Concept set: "${GodotState.concept}".`);
    } 
    else if (!GodotState.currentScene) {
        const sceneName = input;
        GodotState.currentScene = sceneName;

        executeProjectCommand(`create scene ${sceneName}`);

        GodotState.nodesInScene[sceneName] = [];
        addMessage("system", `Scene "${sceneName}" created and selected.`);
    } 
    else {
        executeProjectCommand(input);

        const matchAddNode = input.match(/add node (\w+) (\w+) to (\w+)/i);
        if (matchAddNode) {
            const [, name, type, scene] = matchAddNode;
            GodotState.lastNodeAdded = name;
            if (!GodotState.nodesInScene[scene]) {
                GodotState.nodesInScene[scene] = [];
            }
            GodotState.nodesInScene[scene].push({ name, type, script: null });
        }

        const matchAddUI = input.match(/add (thumbstick|button) (\w+) to (\w+)/i);
        if (matchAddUI) {
            const [, type, name, scene] = matchAddUI;
            if (!GodotState.nodesInScene[scene]) {
                GodotState.nodesInScene[scene] = [];
            }
            GodotState.nodesInScene[scene].push({
                name,
                type,
                script: type === "thumbstick" ? "movement_touch.js" : "action_touch.js"
            });
        }

        const matchAttachScript = input.match(/attach script (.+) to (\w+) in (\w+)/i);
        if (matchAttachScript) {
            const [, scriptName, nodeName, scene] = matchAttachScript;
            const nodes = GodotState.nodesInScene[scene] || [];
            const node = nodes.find(n => n.name === nodeName);
            if (node) node.script = scriptName;
        }
    }

    updateInfoPanel();
    addMessage("system", getNextPrompt());
    updateSuggestions();
}

// ------------------------------
function getNextPrompt() {
    if (!GodotState.gameName) return "What is the name of your game?";
    if (!GodotState.concept) return `Please describe the concept of "${GodotState.gameName}".`;
    if (!GodotState.currentScene) return "Let's create your first scene. What should it be called?";
    return `Add nodes, scripts, Android controls, or create another scene in "${GodotState.currentScene}".`;
}

// ------------------------------
// Exports
// ------------------------------
window.processInput = processInput;
window.executeProjectCommand = executeProjectCommand;
