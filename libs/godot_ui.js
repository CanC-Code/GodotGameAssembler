// libs/godot_ui.js
// Author: CCVO
// Purpose: DOM and UI handling, intent-aware buttons integrated with NLPProcessor

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
    infoPanel.innerHTML += `<strong>Concept:</strong> ${GodotState.concept || "(unset)"}<br>`;

    if (GodotState.currentScene) {
        const nodes = GodotState.nodesInScene?.[GodotState.currentScene] || [];
        if (nodes.length > 0) {
            const ul = document.createElement("ul");
            nodes.forEach(node => {
                const li = document.createElement("li");
                li.innerText = `${node.name} (${node.type})`;
                ul.appendChild(li);
            });
            infoPanel.appendChild(ul);
        } else {
            infoPanel.innerHTML += "<em>No nodes in this scene yet.</em>";
        }
    }
}

// ------------------------------
// Suggestion Buttons (Intent-Aware)
// ------------------------------
const NodeTypeSuggestions = {
    singleton: ["Player", "Camera"],
    multi: ["Button", "Label"]
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
        const existingNodes = GodotState.nodesInScene?.[GodotState.currentScene] || [];
        const existingTypes = existingNodes.map(n => n.type);

        NodeTypeSuggestions.singleton.forEach(type => {
            if (!existingTypes.includes(type)) suggestions.push(`Add ${type}`);
        });

        NodeTypeSuggestions.multi.forEach(type => {
            suggestions.push(`Add ${type}`);
        });

        suggestions.push("Add Another Node", "Create New Scene", "Export Project");
    }

    suggestions.forEach(addSuggestionButton);
}

// ------------------------------
// Button wiring to NLPProcessor
// ------------------------------
function addSuggestionButton(text) {
    const btn = document.createElement("button");
    btn.className = "suggestion-btn";
    btn.innerText = text;

    btn.onclick = async () => {
        if (window.NLPProcessor && typeof window.NLPProcessor.handleIntent === "function") {
            // Map buttons to NLP intents
            if (text.startsWith("Add ")) {
                const nodeType = text.slice(4);
                // Auto-add node command for current scene
                if (GodotState.currentScene) {
                    await ProjectManager.execute(`add node ${nodeType} ${nodeType} to ${GodotState.currentScene}`);
                    GodotState.nodesInScene ??= {};
                    GodotState.nodesInScene[GodotState.currentScene] ??= [];
                    GodotState.nodesInScene[GodotState.currentScene].push({
                        name: nodeType,
                        type: nodeType,
                        script: null
                    });
                    addMessage("system", `Node "${nodeType}" added to scene "${GodotState.currentScene}".`);
                    updateInfoPanel();
                    updateSuggestions();
                    return;
                }
            }

            // Fallback to intent handler
            window.handleSuggestionClick(text);
        } else {
            console.error("handleSuggestionClick / NLPProcessor not defined");
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
