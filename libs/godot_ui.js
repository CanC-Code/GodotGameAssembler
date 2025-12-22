// libs/godot_ui.js
// Author: CCVO
// Purpose: DOM and UI handling with controller modal

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
// Messages
// ------------------------------
function addMessage(sender, message) {
    const msgDiv = document.createElement("div");
    msgDiv.className = sender;
    msgDiv.innerText = message;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// ------------------------------
// Info Panel
// ------------------------------
function updateInfoPanel() {
    infoPanel.innerHTML = "";

    if (GodotState.currentScene) {
        infoPanel.innerHTML += `<strong>Scene:</strong> ${GodotState.currentScene}<br>`;
    }

    infoPanel.innerHTML += `<strong>Game:</strong> ${GodotState.gameName || "(unnamed)"}<br>`;
    infoPanel.innerHTML += `<strong>Concept:</strong> ${GodotState.concept || "(unset)"}<br>`;

    // Show connected controllers
    const controllers = Object.keys(GodotState.controllers || {});
    if (controllers.length) {
        infoPanel.innerHTML += `<strong>Controllers:</strong> ${controllers.join(", ")}`;
    }
}

// ------------------------------
// Suggestion Logic (INTENT-BASED)
// ------------------------------
const NodeTypeSuggestions = {
    default: ["Add Player", "Add Camera", "Add Button"],
    defaultPostNode: ["Add Another Node", "Create New Scene", "Export Project"]
};

function updateSuggestions() {
    suggestionContainer.innerHTML = "";
    let suggestions = [];

    if (!GodotState.gameName) suggestions = ["Set Game Name"];
    else if (!GodotState.concept) suggestions = ["Set Concept"];
    else if (!GodotState.currentScene) suggestions = ["Create Scene"];
    else suggestions = NodeTypeSuggestions.defaultPostNode;

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
// Controller Modal
// ------------------------------
let controllerModal = document.getElementById("controller-modal");
if (!controllerModal) {
    controllerModal = document.createElement("div");
    controllerModal.id = "controller-modal";
    controllerModal.style.display = "none";
    controllerModal.style.position = "fixed";
    controllerModal.style.top = "30%";
    controllerModal.style.left = "30%";
    controllerModal.style.padding = "20px";
    controllerModal.style.backgroundColor = "#222";
    controllerModal.style.border = "2px solid #fff";
    controllerModal.style.zIndex = 1000;
    document.body.appendChild(controllerModal);
}

window.showControllerModal = function(playerName, callback) {
    controllerModal.innerHTML = `<h3>Assign Controller for "${playerName}"</h3>`;
    const existingControllers = Object.keys(GodotState.controllers || {});
    existingControllers.forEach(name => {
        const btn = document.createElement("button");
        btn.innerText = name;
        btn.style.margin = "5px";
        btn.onclick = () => { controllerModal.style.display = "none"; callback(name); };
        controllerModal.appendChild(btn);
    });

    const input = document.createElement("input");
    input.placeholder = "New controller name";
    input.style.display = "block";
    input.style.marginTop = "10px";
    controllerModal.appendChild(input);

    const okBtn = document.createElement("button");
    okBtn.innerText = "Assign";
    okBtn.style.marginTop = "10px";
    okBtn.onclick = () => {
        const name = input.value || "DefaultController";
        controllerModal.style.display = "none";
        callback(name);
    };
    controllerModal.appendChild(okBtn);

    controllerModal.style.display = "block";
};

// ------------------------------
// Expose globals
// ------------------------------
window.addMessage = addMessage;
window.updateInfoPanel = updateInfoPanel;
window.updateSuggestions = updateSuggestions;
