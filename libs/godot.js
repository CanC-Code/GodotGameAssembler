// godot.js
// Author: CCVO
// Purpose: Progressive workflow guidance with dynamic Android touch UI

// ------------------------------
// Workflow Stages
// ------------------------------
const WorkflowStage = {
    GAME_NAME: "gameName",
    CONCEPT: "concept",
    SCENE_CREATION: "sceneCreation",
    NODE_SETUP: "nodeSetup",
    MENU_LAYOUT: "menuLayout",
    BUTTON_SETUP: "buttonSetup",
    SCENE_TRANSITION: "sceneTransition",
    DONE: "done"
};

// ------------------------------
// Global State
// ------------------------------
const GodotState = {
    gameName: null,
    concept: null,
    currentScene: null,
    lastNodeAdded: null,
    nodesInScene: {}, // { sceneName: [ { name, type, script, touchPosition } ] }
    stage: WorkflowStage.GAME_NAME,
    menus: {},       // { sceneName: [ { name, type, nodes } ] }
    buttons: {},     // { sceneName: [ { name, action, targetScene } ] }
    transitions: {}  // { sceneName: [ { trigger, targetScene } ] }
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

// Touch Editor (hidden until needed)
let editor = document.getElementById("touch-editor");
if (!editor) {
    editor = document.createElement("div");
    editor.id = "touch-editor";
    editor.style.display = "none";
    editor.innerHTML = `
        <div style="position:relative;width:100%;height:400px;background:#222;border:2px solid #444;" id="editor-canvas"></div>
        <button id="save-editor">Save</button>
        <button id="close-editor">Close</button>
    `;
    document.body.appendChild(editor);
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
        }

        const menus = GodotState.menus[GodotState.currentScene] || [];
        if (menus.length > 0) {
            const menuList = document.createElement("ul");
            menus.forEach(menu => menuList.appendChild(document.createElement("li")).innerText = `${menu.name} (${menu.type})` );
            infoPanel.appendChild(document.createTextNode("Menus:"));
            infoPanel.appendChild(menuList);
        }

        const buttons = GodotState.buttons[GodotState.currentScene] || [];
        if (buttons.length > 0) {
            const btnList = document.createElement("ul");
            buttons.forEach(btn => {
                const li = document.createElement("li");
                li.innerText = `${btn.name} → Action: ${btn.action}${btn.targetScene ? ` → Scene: ${btn.targetScene}` : ""}`;
                btnList.appendChild(li);
            });
            infoPanel.appendChild(document.createTextNode("Buttons:"));
            infoPanel.appendChild(btnList);
        }

        const transitions = GodotState.transitions[GodotState.currentScene] || [];
        if (transitions.length > 0) {
            const trList = document.createElement("ul");
            transitions.forEach(tr => {
                const li = document.createElement("li");
                li.innerText = `Trigger: ${tr.trigger} → Scene: ${tr.targetScene}`;
                trList.appendChild(li);
            });
            infoPanel.appendChild(document.createTextNode("Scene Transitions:"));
            infoPanel.appendChild(trList);
        }
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

    switch (GodotState.stage) {
        case WorkflowStage.GAME_NAME: suggestions = ["Set Game Name"]; break;
        case WorkflowStage.CONCEPT: suggestions = ["Set Concept"]; break;
        case WorkflowStage.SCENE_CREATION: suggestions = ["Create Scene"]; break;
        case WorkflowStage.NODE_SETUP:
            if (!GodotState.lastNodeAdded) suggestions = NodeTypeSuggestions.default;
            else {
                const type = getLastNodeType(GodotState.lastNodeAdded);
                suggestions = NodeTypeSuggestions[type] || NodeTypeSuggestions.defaultPostNode;
            }
            break;
        case WorkflowStage.MENU_LAYOUT: suggestions = ["Add Menu Panel", "Add Layout"]; break;
        case WorkflowStage.BUTTON_SETUP: suggestions = ["Add Button", "Link Button"]; break;
        case WorkflowStage.SCENE_TRANSITION: suggestions = ["Set Scene Transition"]; break;
        case WorkflowStage.DONE: suggestions = ["Export Project"]; break;
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
        case "Set Game Name": chatInput.focus(); addMessage("system","Type the name of your game."); break;
        case "Set Concept": chatInput.focus(); addMessage("system","Describe your game concept."); break;
        case "Create Scene": chatInput.focus(); addMessage("system","Type the name of your new scene."); break;
        case "Add Another Node": chatInput.focus(); addMessage("system","add node <NodeName> <Type> to <SceneName>"); break;
        case "Attach Script":
        case "Attach Movement Script":
        case "Assign Jump Script":
        case "Assign Interact Script": attachScriptToLastNode(action); break;
        case "Add Menu Panel": chatInput.focus(); addMessage("system","Type: add menu <MenuName> to <SceneName>"); break;
        case "Add Layout": chatInput.focus(); addMessage("system","Type: layout <LayoutName> in <SceneName>"); break;
        case "Add Button": chatInput.focus(); addMessage("system","Type: add button <ButtonName> with action <Action> to <SceneName>"); break;
        case "Link Button": chatInput.focus(); addMessage("system","Type: link button <ButtonName> to scene <SceneName>"); break;
        case "Set Scene Transition": chatInput.focus(); addMessage("system","Type: transition <Trigger> to <SceneName> in <SceneName>"); break;
        case "Export Project": ProjectManager.execute(`export project ${GodotState.gameName||"MyGame"}`); addMessage("system",`Project exported.`); break;
        default: chatInput.focus(); addMessage("system", `Type command for: ${action}`); break;
    }
}

function attachScriptToLastNode(action) {
    if (!GodotState.lastNodeAdded) { addMessage("system","No node selected."); return; }
    let scriptName = "";
    switch(action){
        case "Attach Movement Script": scriptName="player_movement.js"; break;
        case "Assign Jump Script": scriptName="player_jump.js"; break;
        case "Assign Interact Script": scriptName="player_interact.js"; break;
        default: scriptName = `${GodotState.lastNodeAdded.toLowerCase()}_script.js`; break;
    }
    chatInput.value=`attach script ${scriptName} to ${GodotState.lastNodeAdded} in ${GodotState.currentScene}`;
    chatInput.focus();
    addMessage("system","Auto-filled script command. Press Enter.");
}

// ------------------------------
// Android Touch Controls
// ------------------------------
function suggestAndroidControls() {
    if (!GodotState.currentScene) return;
    const thumb = "MoveThumbstick", jump="JumpButton", interact="InteractButton";
    chatInput.value=`add thumbstick ${thumb} to ${GodotState.currentScene}`; chatInput.focus(); addMessage("system","Add movement thumbstick");
    setTimeout(()=>{ chatInput.value=`add button ${jump} to ${GodotState.currentScene}`; addMessage("system","Add jump button"); },500);
    setTimeout(()=>{ chatInput.value=`add button ${interact} to ${GodotState.currentScene}`; addMessage("system","Add interact button"); },1000);
}

// ------------------------------
// Touch Layout Editor
// ------------------------------
// (remains same as previous snippet)

// ------------------------------
// Stage-Driven Input Processing
// ------------------------------
function processInput(input){
    input=input.trim();
    if(!input)return; addMessage("user",input);

    switch(GodotState.stage){
        case WorkflowStage.GAME_NAME: GodotState.gameName=input; addMessage("system",`Game named "${input}".`); GodotState.stage=WorkflowStage.CONCEPT; break;
        case WorkflowStage.CONCEPT: GodotState.concept=input; addMessage("system",`Concept set: "${input}".`); GodotState.stage=WorkflowStage.SCENE_CREATION; break;
        case WorkflowStage.SCENE_CREATION: GodotState.currentScene=input; ProjectManager.execute(`create scene ${input}`); GodotState.nodesInScene[input]=[]; addMessage("system",`Scene "${input}" created.`); GodotState.stage=WorkflowStage.NODE_SETUP; break;
        case WorkflowStage.NODE_SETUP:
            ProjectManager.execute(input);
            const matchNode=input.match(/add node (\w+) (\w+) to (\w+)/i);
            if(matchNode){ const [_,name,type,scene]=matchNode; GodotState.lastNodeAdded=name; if(!GodotState.nodesInScene[scene])GodotState.nodesInScene[scene]=[]; GodotState.nodesInScene[scene].push({name,type,script:null}); }
            break;
        case WorkflowStage.MENU_LAYOUT:
            const matchMenu=input.match(/add menu (\w+) to (\w+)/i);
            if(matchMenu){ const [_,name,scene]=matchMenu; if(!GodotState.menus[scene])GodotState.menus[scene]=[]; GodotState.menus[scene].push({name,type:"panel",nodes:[]}); addMessage("system",`Menu "${name}" added to ${scene}.`); }
            break;
        case WorkflowStage.BUTTON_SETUP:
            const matchBtn=input.match(/add button (\w+) with action (\w+) to (\w+)/i);
            if(matchBtn){ const [_,name,action,scene]=matchBtn; if(!GodotState.buttons[scene])GodotState.buttons[scene]=[]; GodotState.buttons[scene].push({name,action,targetScene:null}); addMessage("system",`Button "${name}" added with action "${action}"`); }
            break;
        case WorkflowStage.SCENE_TRANSITION:
            const matchTr=input.match(/transition (\w+) to (\w+) in (\w+)/i);
            if(matchTr){ const [_,trigger,target,scene]=matchTr; if(!GodotState.transitions[scene])GodotState.transitions[scene]=[]; GodotState.transitions[scene].push({trigger,targetScene:target}); addMessage("system",`Transition on "${trigger}" to scene "${target}" in "${scene}"`); }
            break;
        case WorkflowStage.DONE: ProjectManager.execute(input); break;
    }

    updateInfoPanel(); addMessage("system",getNextPrompt()); updateSuggestions();
}

function getNextPrompt(){
    switch(GodotState.stage){
        case WorkflowStage.GAME_NAME: return "What is the name of your game?";
        case WorkflowStage.CONCEPT: return `Please describe the concept of "${GodotState.gameName}".`;
        case WorkflowStage.SCENE_CREATION: return "Let's create your first scene. Name it.";
        case WorkflowStage.NODE_SETUP: return `Add nodes, scripts, or Android touch controls in "${GodotState.currentScene}".`;
        case WorkflowStage.MENU_LAYOUT: return "Define menu panels and layout.";
        case WorkflowStage.BUTTON_SETUP: return "Add buttons and link actions.";
        case WorkflowStage.SCENE_TRANSITION: return "Set scene transitions.";
        case WorkflowStage.DONE: return "Workflow complete. Export project.";
    }
}

// ------------------------------
// Event Listener
// ------------------------------
chatInput.addEventListener("keydown", e=>{ if(e.key==="Enter"){ const input=chatInput.value; chatInput.value=""; processInput(input); } });

// ------------------------------
// Initial Load
// ------------------------------
window.addEventListener("DOMContentLoaded",()=>{
    addMessage("system","Welcome to GodotGameAssembler!");
    addMessage("system",getNextPrompt());
    updateSuggestions();
});
