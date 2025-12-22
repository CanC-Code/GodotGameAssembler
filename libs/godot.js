// godot.js
// Author: CCVO
// Purpose: Progressive game creation guidance with Android touch UI and full workflow

// ------------------------------
// Global State
// ------------------------------
const GodotState = {
    gameName: null,
    concept: null,
    currentScene: null,
    lastNodeAdded: null,
    nodesInScene: {}, // { sceneName: [ { name, type, script, touchPosition } ] }
    workflowStage: "INIT" // stages: INIT, CONCEPT, SCENE, NODE, MENU_LAYOUT, BUTTON_SETUP, SCENE_TRANSITION, DONE
};

// ------------------------------
// Workflow stages
// ------------------------------
const WorkflowStage = {
    INIT: "INIT",
    CONCEPT: "CONCEPT",
    SCENE: "SCENE",
    NODE: "NODE",
    MENU_LAYOUT: "MENU_LAYOUT",
    BUTTON_SETUP: "BUTTON_SETUP",
    SCENE_TRANSITION: "SCENE_TRANSITION",
    DONE: "DONE"
};

// ------------------------------
// DOM References
// ------------------------------
const chatLog = document.getElementById("nlp-log");
const chatInput = document.getElementById("nlp-command");
const infoPanel = document.getElementById("file-info");

let suggestionContainer = document.getElementById("suggestions");
if (!suggestionContainer) {
    suggestionContainer = document.createElement("div");
    suggestionContainer.id = "suggestions";
    chatLog.parentNode.insertBefore(suggestionContainer, chatLog.nextSibling);
}

// Touch layout editor container
let touchEditor = document.getElementById("touch-editor");
if (!touchEditor) {
    touchEditor = document.createElement("div");
    touchEditor.id = "touch-editor";
    touchEditor.style.display = "none";
    touchEditor.style.position = "absolute";
    touchEditor.style.top = "10%";
    touchEditor.style.left = "10%";
    touchEditor.style.width = "80%";
    touchEditor.style.height = "80%";
    touchEditor.style.backgroundColor = "rgba(0,0,0,0.9)";
    touchEditor.style.zIndex = 1000;
    touchEditor.innerHTML = `
        <div style="padding:5px; color:white; font-weight:bold;">Touch Layout Editor
            <button id="close-editor" style="float:right;">Close</button>
            <button id="save-editor" style="float:right; margin-right:5px;">Save</button>
        </div>
        <div id="editor-canvas" style="position:relative; width:100%; height:90%; background:#222;"></div>
    `;
    document.body.appendChild(touchEditor);
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
// Node Suggestions
// ------------------------------
const NodeTypeSuggestions = {
    default: ["KinematicBody", "RigidBody", "Camera", "MeshInstance", "Button", "Label", "Thumbstick", "Light"],
    Player: ["Attach Movement Script", "Assign Jump Script", "Assign Interact Script", "Add Camera", "Add UI", "Set Spawn Position", "Add Android Controls", "Edit Android Touch Layout"],
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

    switch (GodotState.workflowStage) {
        case WorkflowStage.INIT: suggestions = ["Set Game Name"]; break;
        case WorkflowStage.CONCEPT: suggestions = ["Set Concept"]; break;
        case WorkflowStage.SCENE: suggestions = ["Create Scene"]; break;
        case WorkflowStage.NODE:
            if (!GodotState.lastNodeAdded) suggestions = NodeTypeSuggestions.default;
            else {
                const lastNodeType = getLastNodeType(GodotState.lastNodeAdded);
                suggestions = NodeTypeSuggestions[lastNodeType] || NodeTypeSuggestions.defaultPostNode;
            }
            break;
        case WorkflowStage.MENU_LAYOUT: suggestions = ["Add Menu Node", "Add Label", "Add Button"]; break;
        case WorkflowStage.BUTTON_SETUP: suggestions = ["Link Button to Scene", "Attach Script"]; break;
        case WorkflowStage.SCENE_TRANSITION: suggestions = ["Create New Scene", "Export Project"]; break;
        case WorkflowStage.DONE: suggestions = ["Export Project"]; break;
        default: suggestions = []; break;
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
    chatInput.focus();
    switch (action) {
        case "Set Game Name":
            addMessage("system", "Please type the name of your game in the input box.");
            break;
        case "Set Concept":
            addMessage("system", "Please describe your game concept in the input box.");
            break;
        case "Create Scene":
            addMessage("system", "Type the name of your new scene.");
            break;
        case "Add Another Node":
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
            addMessage("system", "Auto-filled camera addition. Press Enter to execute.");
            break;
        case "Add UI":
            chatInput.value = `add node StartButton Button to ${GodotState.currentScene}`;
            addMessage("system", "Auto-filled UI node addition. Press Enter to execute.");
            break;
        case "Set Spawn Position":
            addMessage("system", `Use: set position 0 1 0 for ${GodotState.lastNodeAdded}`);
            break;
        case "Add Android Controls":
            suggestAndroidControls();
            break;
        case "Edit Android Touch Layout":
            openTouchEditor();
            break;
        case "Link to Scene":
            addMessage("system", `Use: link button <ButtonName> to scene <SceneName>`);
            break;
        case "Create New Scene":
            addMessage("system", "Type the name of the new scene you want to create.");
            break;
        case "Export Project":
            ProjectManager.execute(`export project ${GodotState.gameName || "MyGame"}`);
            addMessage("system", `Project exported as "${GodotState.gameName || "MyGame"}".`);
            break;
        default:
            addMessage("system", `Type command for: ${action}`);
            break;
    }
}

// ------------------------------
// Script Attachment
// ------------------------------
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

    chatInput.value = `add thumbstick ${thumbstickName} to ${GodotState.currentScene}`;
    addMessage("system", `Auto-filled: Add movement thumbstick. Press Enter.`);

    setTimeout(() => {
        chatInput.value = `add button ${jumpButtonName} to ${GodotState.currentScene}`;
        addMessage("system", `Auto-filled: Add jump button. Press Enter.`);
    }, 500);

    setTimeout(() => {
        chatInput.value = `add button ${interactButtonName} to ${GodotState.currentScene}`;
        addMessage("system", `Auto-filled: Add interact button. Press Enter.`);
    }, 1000);
}

// ------------------------------
// Touch Layout Editor
// ------------------------------
function openTouchEditor() {
    if (!GodotState.currentScene) {
        addMessage("system", "No scene selected to edit touch layout.");
        return;
    }

    touchEditor.style.display = "block";

    const canvas = document.getElementById("editor-canvas");
    canvas.innerHTML = "";

    const nodes = GodotState.nodesInScene[GodotState.currentScene] || [];
    const touchNodes = nodes.filter(n => n.type === "thumbstick" || n.type === "button");

    touchNodes.forEach(node => {
        const el = document.createElement("div");
        el.className = "touch-node";
        el.dataset.name = node.name;
        el.style.position = "absolute";
        el.style.width = "60px";
        el.style.height = "60px";
        el.style.background = node.type === "thumbstick" ? "rgba(0,150,255,0.5)" : "rgba(0,255,100,0.5)";
        el.style.borderRadius = node.type === "thumbstick" ? "50%" : "10%";
        el.style.cursor = "grab";

        const xPct = node.touchPosition?.x || 0.1;
        const yPct = node.touchPosition?.y || 0.8;
        el.style.left = `${xPct * canvas.clientWidth}px`;
        el.style.top = `${yPct * canvas.clientHeight}px`;

        canvas.appendChild(el);
        makeDraggable(el, canvas, node);
    });
}

// Draggable logic
function makeDraggable(el, container, node) {
    let offsetX, offsetY, dragging = false;

    function pointerDown(e) {
        e.preventDefault();
        dragging = true;
        const rect = el.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    }

    function pointerMove(e) {
        if (!dragging) return;
        let x = e.clientX - container.getBoundingClientRect().left - offsetX;
        let y = e.clientY - container.getBoundingClientRect().top - offsetY;

        x = Math.max(0, Math.min(container.clientWidth - el.clientWidth, x));
        y = Math.max(0, Math.min(container.clientHeight - el.clientHeight, y));

        el.style.left = x + "px";
        el.style.top = y + "px";

        node.touchPosition = {
            x: x / container.clientWidth,
            y: y / container.clientHeight
        };
    }

    function pointerUp() { dragging = false; }

    el.addEventListener("mousedown", pointerDown);
    document.addEventListener("mousemove", pointerMove);
    document.addEventListener("mouseup", pointerUp);

    el.addEventListener("touchstart", e => pointerDown(e.touches[0]));
    document.addEventListener("touchmove", e => pointerMove(e.touches[0]));
    document.addEventListener("touchend", pointerUp);
}

// Editor Buttons
document.getElementById("close-editor").addEventListener("click", () => {
    touchEditor.style.display = "none";
});
document.getElementById("save-editor").addEventListener("click", () => {
    touchEditor.style.display = "none";
    addMessage("system", "Touch layout saved for this scene.");
});

// ------------------------------
// Input Processing
// ------------------------------
function processInput(input) {
    input = input.trim();
    if (!input) return;
    addMessage("user", input);

    switch (GodotState.workflowStage) {
        case WorkflowStage.INIT:
            GodotState.gameName = input;
            addMessage("system", `Game named "${GodotState.gameName}".`);
            GodotState.workflowStage = WorkflowStage.CONCEPT;
            break;
        case WorkflowStage.CONCEPT:
            GodotState.concept = input;
            addMessage("system", `Concept set: "${GodotState.concept}".`);
            GodotState.workflowStage = WorkflowStage.SCENE;
            break;
        case WorkflowStage.SCENE:
            GodotState.currentScene = input;
            ProjectManager.execute(`create scene ${input}`);
            addMessage("system", `Scene "${input}" created and selected.`);
            GodotState.nodesInScene[input] = [];
            GodotState.workflowStage = WorkflowStage.NODE;
            break;
        default:
            ProjectManager.execute(input);

            // Add node parsing
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
                GodotState.nodesInScene[scene].push({
                    name, type,
                    script: type === "thumbstick" ? "movement_touch.js" : "action_touch.js"
                });
            }

            const matchAttachScript = input.match(/attach script (.+) to (\w+) in (\w+)/i);
            if (matchAttachScript) {
                const [_, scriptName, nodeName, scene] = matchAttachScript;
                const nodes = GodotState.nodesInScene[scene] || [];
                const node = nodes.find(n => n.name === nodeName);
                if (node) node.script = scriptName;
            }

            break;
    }

    updateInfoPanel();
    addMessage("system", getNextPrompt());
    updateSuggestions();
}

// ------------------------------
// Get next prompt
// ------------------------------
function getNextPrompt() {
    switch (GodotState.workflowStage) {
        case WorkflowStage.INIT: return "What is the name of your game?";
        case WorkflowStage.CONCEPT: return `Please describe the concept of "${GodotState.gameName}".`;
        case WorkflowStage.SCENE: return "Let's create your first scene. What should it be called?";
        case WorkflowStage.NODE: return `Next, add nodes, attach scripts, or add Android controls in "${GodotState.currentScene}".`;
        case WorkflowStage.MENU_LAYOUT: return `Add menus and layout to "${GodotState.currentScene}".`;
        case WorkflowStage.BUTTON_SETUP: return `Add buttons and link actions for menus in "${GodotState.currentScene}".`;
        case WorkflowStage.SCENE_TRANSITION: return "Define scene transitions with button links.";
        case WorkflowStage.DONE: return "Project complete. Ready to export.";
        default: return "Awaiting input...";
    }
}

// ------------------------------
// Event Listener
// ------------------------------
chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        processInput(chatInput.value);
        chatInput.value = "";
    }
});

// ------------------------------
// Initialization
// ------------------------------
window.addEventListener("DOMContentLoaded", () => {
    addMessage("system", "Welcome to GodotGameAssembler!");
    addMessage("system", getNextPrompt());
    updateSuggestions();
});

console.log("Godot.js loaded. Full progressive workflow initialized.");
