// godot.js
// Author: CCVO
// Purpose: Proactive chat guidance with clickable suggestions for GodotGameAssembler

// Global state for tracking project progress
const GodotState = {
    gameName: null,
    concept: null,
    currentScene: null,
    lastNodeAdded: null
};

// DOM references
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

// Helper: append messages to chat log
function addMessage(sender, message) {
    const msgDiv = document.createElement("div");
    msgDiv.className = sender;
    msgDiv.innerText = message;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Helper: update top-right info panel
function updateInfoPanel() {
    infoPanel.innerHTML = "";
    if (GodotState.currentScene) {
        const sceneHeader = document.createElement("h3");
        sceneHeader.innerText = `Scene: ${GodotState.currentScene}`;
        infoPanel.appendChild(sceneHeader);

        const nodes = ProjectGraph.getNodes(GodotState.currentScene);
        if (nodes && nodes.length > 0) {
            const nodeList = document.createElement("ul");
            nodes.forEach(node => {
                const nodeItem = document.createElement("li");
                nodeItem.innerText = `${node.name} (${node.type})`;
                if (node.script) nodeItem.innerText += ` → Script: ${node.script}`;
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

// Determine next proactive prompt
function getNextPrompt() {
    if (!GodotState.gameName) return "What is the name of your game?";
    if (!GodotState.concept) return `Please describe the concept of "${GodotState.gameName}".`;
    if (!GodotState.currentScene) return "Let's create your first scene. What should it be called?";
    return `What would you like to do next in scene "${GodotState.currentScene}"? You can add nodes, attach scripts, or create new scenes.`;
}

// Update clickable suggestions
function updateSuggestions() {
    suggestionContainer.innerHTML = "";

    if (!GodotState.gameName) {
        addSuggestionButton("Set Game Name");
    } else if (!GodotState.concept) {
        addSuggestionButton("Set Concept");
    } else if (!GodotState.currentScene) {
        addSuggestionButton("Create Scene");
    } else {
        addSuggestionButton("Add Node");
        addSuggestionButton("Attach Script");
        addSuggestionButton("Create New Scene");
        addSuggestionButton("Export Project");
    }
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
        case "Add Node":
            chatInput.focus();
            addMessage("system", "Example: add node Player KinematicBody to SceneName");
            break;
        case "Attach Script":
            chatInput.focus();
            addMessage("system", "Example: attach script player.js to Player in SceneName");
            break;
        case "Create New Scene":
            chatInput.focus();
            addMessage("system", "Type the name of the new scene you want to create.");
            break;
        case "Export Project":
            ProjectManager.execute(`export project ${GodotState.gameName || "MyGame"}`);
            addMessage("system", `Project exported as "${GodotState.gameName || "MyGame"}".`);
            break;
    }
}

// Process user input
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
    }
    // Handle commands for existing scene
    else {
        ProjectManager.execute(input);

        // Track last node added if applicable
        const matchAddNode = input.match(/add node (\w+) (\w+) to (\w+)/i);
        if (matchAddNode) {
            GodotState.lastNodeAdded = matchAddNode[1];
        }

        const matchAttachScript = input.match(/attach script (.+) to (\w+) in (\w+)/i);
        if (matchAttachScript) {
            GodotState.lastNodeAdded = matchAttachScript[2];
        }
    }

    // Update info panel and suggestions
    updateInfoPanel();
    const nextPrompt = getNextPrompt();
    addMessage("system", nextPrompt);
    updateSuggestions();
}

// Event listener for input box
chatInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        const input = chatInput.value;
        chatInput.value = "";
        processInput(input);
    }
});

// Initial prompt on load
window.addEventListener("DOMContentLoaded", () => {
    addMessage("system", "Welcome to GodotGameAssembler!");
    const initialPrompt = getNextPrompt();
    addMessage("system", initialPrompt);
    updateSuggestions();
});
