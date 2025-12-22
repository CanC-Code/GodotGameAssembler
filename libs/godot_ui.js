// libs/godot_ui.js
// Author: CCVO
// Purpose: DOM and UI handling

const chatLog = document.getElementById("nlp-log");
const chatInput = document.getElementById("nlp-command");
const infoPanel = document.getElementById("file-info");

let suggestionContainer = document.getElementById("suggestions");
if (!suggestionContainer) {
    suggestionContainer = document.createElement("div");
    suggestionContainer.id = "suggestions";
    chatLog.parentNode.insertBefore(suggestionContainer, chatLog.nextSibling);
}

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
                nodeItem.innerText =
                    `${node.name} (${node.type})` +
                    (node.script ? ` → Script: ${node.script}` : "");
                nodeList.appendChild(nodeItem);
            });
            infoPanel.appendChild(nodeList);
        } else {
            infoPanel.appendChild(
                document.createTextNode("No nodes in this scene yet.")
            );
        }
    } else {
        infoPanel.appendChild(
            document.createTextNode("No scene selected.")
        );
    }

    const projectInfo = document.createElement("p");
    projectInfo.innerText =
        `Game: ${GodotState.gameName || "(unnamed)"}\n` +
        `Concept: ${GodotState.concept || "(unset)"}`;
    infoPanel.appendChild(projectInfo);
}

// --------------------------------------------------
// Suggestions
// --------------------------------------------------

const NodeTypeSuggestions = {
    default: [
        "KinematicBody",
        "RigidBody",
        "Camera",
        "MeshInstance",
        "Button",
        "Label",
        "Thumbstick",
        "Light"
    ],
    Player: [
        "Attach Movement Script",
        "Assign Jump Script",
        "Assign Interact Script",
        "Add Camera",
        "Add UI",
        "Set Spawn Position",
        "Add Android Controls",
        "Edit Android Touch Layout"
    ],
    Camera: ["Set Transform", "Link to Player"],
    Button: ["Link to Scene", "Attach Script"],
    defaultPostNode: [
        "Add Another Node",
        "Attach Script",
        "Create New Scene",
        "Export Project"
    ]
};

function updateSuggestions() {
    suggestionContainer.innerHTML = "";
    let suggestions = [];

    if (!GodotState.gameName) {
        suggestions = ["Set Game Name"];
    } else if (!GodotState.concept) {
        suggestions = ["Set Concept"];
    } else if (!GodotState.currentScene) {
        suggestions = ["Create Scene"];
    } else {
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

    suggestions.forEach(addSuggestionButton);
}

function addSuggestionButton(text) {
    const btn = document.createElement("button");
    btn.className = "suggestion-btn";
    btn.innerText = text;
    btn.onclick = () => window.handleSuggestionClick(text);
    suggestionContainer.appendChild(btn);
}

// --------------------------------------------------
// ✅ MISSING FUNCTION (FIXED)
// --------------------------------------------------

function handleSuggestionClick(text) {
    if (!chatInput) return;

    chatInput.value = text;

    // Route through the same pipeline as manual input
    chatInput.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter" })
    );
}

// --------------------------------------------------
// Expose globals
// --------------------------------------------------

window.chatLog = chatLog;
window.chatInput = chatInput;
window.infoPanel = infoPanel;

window.addMessage = addMessage;
window.updateInfoPanel = updateInfoPanel;
window.updateSuggestions = updateSuggestions;
window.handleSuggestionClick = handleSuggestionClick;

console.log("godot_ui.js loaded successfully.");
