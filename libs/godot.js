// godot.js
// Author: CCVO
// Purpose: Dynamic context-aware guidance with clickable suggestions for GodotGameAssembler

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

// Append messages to chat
function addMessage(sender, message) {
    const msgDiv = document.createElement("div");
    msgDiv.className = sender;
    msgDiv.innerText = message;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Update top-right info panel
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
// Node Type Suggestions Table
// ------------------------------
const NodeTypeSuggestions = {
    default: ["KinematicBody", "RigidBody", "Camera", "MeshInstance", "Button", "Label", "Thumbstick", "Light"],
    Player: ["Attach Movement Script", "Add Camera", "Add UI", "Set Spawn Position"],
    Camera: ["Set Transform", "Link to Player"],
    Button: ["Link to Scene", "Attach Script"],
    defaultPostNode: ["Add Another Node", "Attach Script", "Create New Scene", "Export Project"]
};

// ------------------------------
// Suggestions Logic
// ------------------------------
function updateSuggestions() {
    suggestionContainer.innerHTML = "";
    let suggestions = [];

    // Project initial setup
    if (!GodotState.gameName) {
        suggestions = ["Set Game Name"];
    } else if (!GodotState.concept) {
        suggestions = ["Set Concept"];
    } else if (!GodotState.currentScene) {
        suggestions = ["Create Scene"];
    } else {
        // Scene exists, dynamic node/script suggestions
        if (!GodotState.lastNodeAdded) {
            suggestions = NodeTypeSuggestions.default;
        } else {
            const lastNodeType = getLastNodeType(GodotState.lastNodeAdded);
            if (NodeTypeSuggestions[lastNodeType]) {
                suggestions = NodeTypeSuggestions[lastNodeType];
            } else {
                suggestions = NodeTypeSuggestions.defaultPostNode;
            }
        }
    }

    // Add buttons
    suggestions.forEach(text => addSuggestionButton(text));
}

// Helper to get last node type
function getLastNodeType(nodeName) {
    const nodes = GodotState.nodesInScene[GodotState.currentScene] || [];
    const node = nodes.find(n => n.name === nodeName);
    return node ? node.type : null;
}

// Add a clickable suggestion button
function addSuggestionButton(text) {
    const btn = document.createElement("button");
    btn.className = "suggestion-btn";
    btn.innerText = text;
    btn.onclick = () => handleSuggestionClick(text);
    suggestionContainer.appendChild(btn);
}

// Handle suggestion button clicks
function handleSuggestionClick(action) {
    // Mapping button text to commands or prompts
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
            if (!GodotState.lastNodeAdded) {
                addMessage("system", "No node selected for script. Add a node first.");
                break;
            }
            chatInput.value = `attach script ${GodotState.lastNodeAdded.toLowerCase()}_script.js to ${GodotState.lastNodeAdded} in ${GodotState.currentScene}`;
            chatInput.focus();
            addMessage("system", `Auto-filled script command. Press Enter to execute.`);
            break;
        case "Add Camera":
            chatInput.value = `add node MainCamera Camera to ${GodotState.currentScene}`;
            chatInput.focus();
            addMessage("system", `Auto-filled camera addition. Press Enter to execute.`);
            break;
        case "Add UI":
            chatInput.value = `add node StartButton Button to ${GodotState.currentScene}`;
            chatInput.focus();
            addMessage("system", `Auto-filled UI node addition. Press Enter to execute.`);
            break;
        case "Set Spawn Position":
            chatInput.focus();
            addMessage("system", `Use: set position <x> <y> <z> for ${GodotState.lastNodeAdded}`);
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
    // Handle other commands
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

// Determine next proactive prompt
function getNextPrompt() {
    if (!GodotState.gameName) return "What is the name of your game?";
    if (!GodotState.concept) return `Please describe the concept of "${GodotState.gameName}".`;
    if (!GodotState.currentScene) return "Let's create your first scene. What should it be called?";
    return `Next, add nodes, attach scripts, or create a new scene in "${GodotState.currentScene}".`;
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
