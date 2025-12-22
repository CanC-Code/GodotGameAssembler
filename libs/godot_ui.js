// libs/godot_ui.js
// Author: CCVO
// Purpose: DOM and UI handling with intent-based suggestions

const chatLog = document.getElementById("nlp-log");
const chatInput = document.getElementById("nlp-command");
const infoPanel = document.getElementById("file-info");

let suggestionContainer = document.getElementById("suggestions");
if (!suggestionContainer) {
    suggestionContainer = document.createElement("div");
    suggestionContainer.id = "suggestions";
    chatLog.parentNode.insertBefore(suggestionContainer, chatLog.nextSibling);
}

// ------------------------------
// Message display
// ------------------------------
function addMessage(sender, message) {
    const msgDiv = document.createElement("div");
    msgDiv.className = sender;
    msgDiv.innerText = message;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// ------------------------------
// Info panel
// ------------------------------
function updateInfoPanel() {
    infoPanel.innerHTML = "";

    if (GodotState.currentScene) infoPanel.innerHTML += `<strong>Scene:</strong> ${GodotState.currentScene}<br>`;
    infoPanel.innerHTML += `<strong>Game:</strong> ${GodotState.gameName || "(unnamed)"}<br>`;
    infoPanel.innerHTML += `<strong>Concept:</strong> ${GodotState.concept || "(unset)"}<br>`;

    if (GodotState.nodesInScene?.[GodotState.currentScene]?.length) {
        infoPanel.innerHTML += `<strong>Nodes:</strong> ${GodotState.nodesInScene[GodotState.currentScene]
            .map(n => `${n.name} (${n.type})`)
            .join(", ")}<br>`;
    }
}

// ------------------------------
// Suggestions
// ------------------------------
const NodeTypeSuggestions = {
    singleton: ["Player", "Camera"],
    multi: ["Button", "Label"],
    defaultPostNode: ["Add Another Node", "Create New Scene", "Export Project"]
};

function updateSuggestions() {
    suggestionContainer.innerHTML = "";
    let suggestions = [];

    if (!GodotState.gameName) suggestions = ["Set Game Name"];
    else if (!GodotState.concept) suggestions = ["Set Concept"];
    else if (!GodotState.currentScene) suggestions = ["Create Scene"];
    else {
        const existingNodes = GodotState.nodesInScene?.[GodotState.currentScene] || [];
        const existingTypes = existingNodes.map(n => n.type);

        NodeTypeSuggestions.singleton.forEach(type => {
            if (!existingTypes.includes(type)) suggestions.push(`Add ${type}`);
        });

        NodeTypeSuggestions.multi.forEach(type => suggestions.push(`Add ${type}`));
        suggestions.push(...NodeTypeSuggestions.defaultPostNode);
    }

    suggestions.forEach(addSuggestionButton);
}

function addSuggestionButton(text) {
    const btn = document.createElement("button");
    btn.className = "suggestion-btn";
    btn.innerText = text;

    btn.onclick = () => {
        if (typeof window.handleSuggestionClick === "function") {
            window.handleSuggestionClick(text);
        } else {
            console.error("handleSuggestionClick not defined");
        }
    };

    suggestionContainer.appendChild(btn);
}

// ------------------------------
// Expose
// ------------------------------
window.addMessage = addMessage;
window.updateInfoPanel = updateInfoPanel;
window.updateSuggestions = updateSuggestions;
