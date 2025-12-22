// godot.js
// Author: CCVO
// Purpose: Dynamic context-aware guidance with Android touch UI integration

// ------------------------------
// Global State
// ------------------------------
const GodotState = {
    gameName: null,
    concept: null,
    currentScene: null,
    lastNodeAdded: null,
    nodesInScene: {} // { sceneName: [ { name, type, script } ] }
};

// ------------------------------
// DOM References
// ------------------------------
const chatLog = document.getElementById("chat-log");
const chatInput = document.getElementById("chat-input");
const infoPanel = document.getElementById("info-panel");

// Suggestion container
let suggestionContainer = document.getElementById("suggestions");
if (!suggestionContainer) {
    suggestionContainer = document.createElement("div");
    suggestionContainer.id = "suggestions";
    chatLog.parentNode.appendChild(suggestionContainer);
}

// ------------------------------
// Helper Functions
// ------------------------------
function addMessage(sender, message) {
    const msgDiv = document.createElement("div");
    msgDiv.className = sender;
    msgDiv.innerText = message;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function updateInfoPanel() {
    infoPanel.innerHTML = "";
    if (GodotState.currentScene) {
        const sceneHeader = document.createElement("h3");
        sceneHeader.innerText = `Scene: ${GodotState.currentScene}`;
        infoPanel.appendChild(sceneHeader);

        const nodes = GodotState.nodesInScene[GodotState.currentScene] || [];
        if (nodes.length > 0) {
            const nodeList = document.createElement("ul");
            nodes.forEach(node => {
                const nodeItem = document.createElement("li");
                nodeItem.innerText = `${node.name} (${node.type})${node.script ? ` → Script: ${node.script}` : ""}`;
                nodeList.appendChild(nodeItem);
            });
            infoPanel.appendChild(nodeList);
        } else {
            infoPanel.appendChild(document.createTextNode("No nodes in this scene yet."));
        }
    } else {
        infoPanel.appendChild(document.createTextNode("No scene selected."));
    }

    const projectInfo = document.createElement("p");
    projectInfo.innerText = `Game: ${GodotState.gameName || "(unnamed)"}\nConcept: ${GodotState.concept || "(unset)"}`;
    infoPanel.appendChild(projectInfo);
}

// ------------------------------
// Node Type & Post-Node Suggestions
// ------------------------------
const NodeTypeSuggestions = {
    default: ["KinematicBody", "RigidBody", "Camera", "MeshInstance", "Button", "Label", "Thumbstick", "Light"],
    Player: ["Attach Movement Script", "Add Camera", "Add UI", "Set Spawn Position", "Add Android Controls"],
    Camera: ["Set Transform", "Link to Player"],
    Button: ["Link to Scene", "Attach Script"],
    defaultPostNode: ["Add Another Node", "Attach Script", "Create New Scene", "Export Project"]
};

function getLastNodeType(nodeName) {
    const nodes = GodotState.nodesInScene[GodotState.currentScene] || [];
    const node = nodes.find(n => n.name === nodeName);
    return node ? node.type : null;
}

// ------------------------------
// Suggestions UI
// ------------------------------
function updateSuggestions() {
    suggestionContainer.innerHTML = "";
    let suggestions = [];

    if (!GodotState.gameName) suggestions = ["Set Game Name"];
    else if (!GodotState.concept) suggestions = ["Set Concept"];
    else if (!GodotState.currentScene) suggestions = ["Create Scene"];
    else {
        if (!GodotState.lastNodeAdded) suggestions = NodeTypeSuggestions.default;
        else {
            const lastNodeType = getLastNodeType(GodotState.lastNodeAdded);
            if (NodeTypeSuggestions[lastNodeType]) suggestions = NodeTypeSuggestions[lastNodeType];
            else suggestions = NodeTypeSuggestions.defaultPostNode;
        }
    }

    suggestions.forEach(text => addSuggestionButton(text));
}

function addSuggestionButton(text) {
    const btn = document.createElement("button");
    btn.className = "suggestion-btn";
    btn.innerText = text;
    btn.onclick = () => handleSuggestionClick(text);
    suggestionContainer.appendChild(btn);
}

// ------------------------------
// Suggestion Handlers
// ------------------------------
function handleSuggestionClick(action) {
    switch (action) {
        case "Set Game Name":
            chatInput.focus();
            addMessage("system", "Please type the name of your game in the input box.");
            break;
        case "Set Concept":
            chatInput.focus();
            addMessage("system", "Please describe your game concept in the input box.");
            break;
        case "Create Scene":
            chatInput.focus();
            addMessage("system", "Type the name of your new scene.");
            break;
        case "Add Another Node":
            chatInput.focus();
            addMessage("system", "Type: add node <NodeName> <Type> to <SceneName>");
            break;
        case "Attach Script":
        case "Attach Movement Script":
        case "Assign Jump Script":
        case "Assign Interact Script":
            attachScriptToLastNode(action);
            break;
        case "Add Camera":
            chatInput.value = `add node MainCamera Camera to ${GodotState.currentScene}`;
            chatInput.focus();
            addMessage("system", "Auto-filled camera addition. Press Enter to execute.");
            break;
        case "Add UI":
            chatInput.value = `add node StartButton Button to ${GodotState.currentScene}`;
            chatInput.focus();
            addMessage("system", "Auto-filled UI node addition. Press Enter to execute.");
            break;
        case "Set Spawn Position":
            chatInput.focus();
            addMessage("system", `Use: set position 0 1 0 for ${GodotState.lastNodeAdded}`);
            break;
        case "Add Android Controls":
            suggestAndroidControls();
            break;
        case "Link to Scene":
            chatInput.focus();
            addMessage("system", `Use: link button <ButtonName> to scene <SceneName>`);
            break;
        case "Create New Scene":
            chatInput.focus();
            addMessage("system", "Type the name of the new scene you want to create.");
            break;
        case "Export Project":
            ProjectManager.execute(`export project ${GodotState.gameName || "MyGame"}`);
            addMessage("system", `Project exported as "${GodotState.gameName || "MyGame"}".`);
            break;
        default:
            chatInput.focus();
            addMessage("system", `Type command for: ${action}`);
            break;
    }
}

// Helper: attach scripts to last node
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

// ------------------------------
// Android Touch Controls
// ------------------------------
function suggestAndroidControls() {
    if (!GodotState.currentScene) return;

    const thumbstickName = "MoveThumbstick";
    const jumpButtonName = "JumpButton";
    const interactButtonName = "InteractButton";

    // Add thumbstick
    chatInput.value = `add thumbstick ${thumbstickName} to ${GodotState.currentScene}`;
    chatInput.focus();
    addMessage("system", `Auto-filled: Add movement thumbstick at default position. Press Enter.`);

    // Add jump button
    setTimeout(() => {
        chatInput.value = `add button ${jumpButtonName} to ${GodotState.currentScene}`;
        chatInput.focus();
        addMessage("system", `Auto-filled: Add jump button at default position. Press Enter.`);
    }, 500);

    // Add interact button
    setTimeout(() => {
        chatInput.value = `add button ${interactButtonName} to ${GodotState.currentScene}`;
        chatInput.focus();
        addMessage("system", `Auto-filled: Add interact button at default position. Press Enter.`);
    }, 1000);
}

// ------------------------------
// Input Processing
// ------------------------------
function processInput(input) {
    input = input.trim();
    if (!input) return;
    addMessage("user", input);

    // Handle game naming
    if (!GodotState.gameName) {
        GodotState.gameName = input;
        addMessage("system", `Game named "${GodotState.gameName}".`);
    }
    // Handle concept
    else if (!GodotState.concept) {
        GodotState.concept = input;
        addMessage("system", `Concept set: "${GodotState.concept}".`);
    }
    // Handle scene creation
    else if (!GodotState.currentScene) {
        const sceneName = input;
        GodotState.currentScene = sceneName;
        ProjectManager.execute(`create scene ${sceneName}`);
        addMessage("system", `Scene "${sceneName}" created and selected.`);
        GodotState.nodesInScene[sceneName] = [];
    }
    // Other commands
    else {
        ProjectManager.execute(input);

        // Track nodes added
        const matchAddNode = input.match(/add node (\w+) (\w+) to (\w+)/i);
        if (matchAddNode) {
            const [_, name, type, scene] = matchAddNode;
            GodotState.lastNodeAdded = name;
            if (!GodotState.nodesInScene[scene]) GodotState.nodesInScene[scene] = [];
            GodotState.nodesInScene[scene].push({ name, type, script: null });
        }

        // Track thumbsticks or buttons
        const matchAddUI = input.match(/add (thumbstick|button) (\w+) to (\w+)/i);
        if (matchAddUI) {
            const [_, type, name, scene] = matchAddUI;
            if (!GodotState.nodesInScene[scene]) GodotState.nodesInScene[scene] = [];
            GodotState.nodesInScene[scene].push({ name, type, script: type === "thumbstick" ? "movement_touch.js" : "action_touch.js" });
        }

        // Track scripts attached
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

// Determine next prompt
function getNextPrompt() {
    if (!GodotState.gameName) return "What is the name of your game?";
    if (!GodotState.concept) return `Please describe the concept of "${GodotState.gameName}".`;
    if (!GodotState.currentScene) return "Let's create your first scene. What should it be called?";
    return `Next, add nodes, attach scripts, add Android touch controls, or create a new scene in "${GodotState.currentScene}".`;
}

// ------------------------------
// Event Listener
// ------------------------------
chatInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        const input = chatInput.value;
        chatInput.value = "";
        processInput(input);
    }
});

// ------------------------------
// Initial Load
// ------------------------------
window.addEventListener("DOMContentLoaded", () => {
    addMessage("system", "Welcome to GodotGameAssembler!");
    addMessage("system", getNextPrompt());
    updateSuggestions();
});
