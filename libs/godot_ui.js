// libs/godot_ui.js
// Author: CCVO
// Purpose: DOM and UI handling, NLP-integrated

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
// Chat / Info Helpers
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
        infoPanel.innerHTML += `<strong>Scene:</strong> ${GodotState.currentScene}<br>`;
    }

    infoPanel.innerHTML += `<strong>Game:</strong> ${GodotState.gameName || "(unnamed)"}<br>`;
    infoPanel.innerHTML += `<strong>Concept:</strong> ${GodotState.concept || "(unset)"}`;
}

// ------------------------------
// Suggestion Buttons (Intent-Aware)
// ------------------------------
const NodeTypeSuggestions = {
    default: ["Add Player", "Add Camera", "Add Button"],
    defaultPostNode: ["Add Another Node", "Create New Scene", "Export Project"]
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
        suggestions = NodeTypeSuggestions.defaultPostNode;
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
// Global Exports
// ------------------------------
window.addMessage = addMessage;
window.updateInfoPanel = updateInfoPanel;
window.updateSuggestions = updateSuggestions;

// ------------------------------
// Initialize
// ------------------------------
updateInfoPanel();
updateSuggestions();
