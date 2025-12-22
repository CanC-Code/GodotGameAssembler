// nlp_pro.js
// Author: CCVO
// Purpose: Context-aware NLP interface for GodotGameAssembler

// ------------------------------
// NLP Command Processor
// ------------------------------
class NLPProcessor {
    constructor(state, chatInput, addMessageCallback) {
        this.state = state;
        this.chatInput = chatInput;
        this.addMessage = addMessageCallback;
    }

    process(input) {
        input = input.trim();
        if (!input) return;

        this.addMessage("user", input);

        // Stage-aware interpretation
        switch (this.state.workflowStage) {
            case "INIT":
                this.state.gameName = input;
                this.state.workflowStage = "CONCEPT";
                this.addMessage("system", `Game named "${this.state.gameName}".`);
                break;

            case "CONCEPT":
                this.state.concept = input;
                this.state.workflowStage = "SCENE";
                this.addMessage("system", `Concept set: "${this.state.concept}".`);
                break;

            case "SCENE":
                // Allow free-form: "create scene Level1" or just "Level1"
                const sceneMatch = input.match(/(?:create\s+scene\s+)?(\w+)/i);
                if (sceneMatch) {
                    const sceneName = sceneMatch[1];
                    this.state.currentScene = sceneName;
                    ProjectManager.execute(`create scene ${sceneName}`);
                    this.state.nodesInScene[sceneName] = [];
                    this.state.workflowStage = "NODE";
                    this.addMessage("system", `Scene "${sceneName}" created and selected.`);
                } else {
                    this.addMessage("system", "Could not identify scene name. Try again.");
                }
                break;

            case "NODE":
                this.handleNodeInput(input);
                break;

            case "MENU_LAYOUT":
                this.handleMenuInput(input);
                break;

            case "BUTTON_SETUP":
                this.handleButtonInput(input);
                break;

            case "SCENE_TRANSITION":
                this.handleSceneTransitionInput(input);
                break;

            case "DONE":
                this.addMessage("system", "Project is complete. You can export it now.");
                break;

            default:
                this.addMessage("system", "Unrecognized stage. Type 'help' for commands.");
        }
    }

    // ------------------------------
    // Node creation / scripts
    // ------------------------------
    handleNodeInput(input) {
        // Free-form: "add player", "add camera", etc.
        const lower = input.toLowerCase();

        let nodeName = null;
        let nodeType = null;

        if (lower.includes("player")) {
            nodeName = "Player";
            nodeType = "KinematicBody";
        } else if (lower.includes("camera")) {
            nodeName = "MainCamera";
            nodeType = "Camera";
        } else if (lower.includes("button")) {
            nodeName = "Button1";
            nodeType = "Button";
        } else if (lower.includes("label")) {
            nodeName = "Label1";
            nodeType = "Label";
        } else if (lower.includes("light")) {
            nodeName = "Light1";
            nodeType = "Light";
        }

        if (nodeName && nodeType) {
            this.state.lastNodeAdded = nodeName;
            if (!this.state.nodesInScene[this.state.currentScene]) this.state.nodesInScene[this.state.currentScene] = [];
            this.state.nodesInScene[this.state.currentScene].push({ name: nodeName, type: nodeType, script: null });
            ProjectManager.execute(`add node ${nodeName} ${nodeType} to ${this.state.currentScene}`);
            this.addMessage("system", `Node "${nodeName}" of type "${nodeType}" added to scene "${this.state.currentScene}".`);
        } else if (lower.includes("add thumbstick") || lower.includes("add jump button") || lower.includes("add interact button")) {
            // Android controls
            ProjectManager.execute(input);
            this.addMessage("system", `Control added: ${input}`);
        } else {
            this.addMessage("system", `Unrecognized node command: "${input}". Try "add player" or "add camera".`);
        }
    }

    // ------------------------------
    // Menu / layout handler
    // ------------------------------
    handleMenuInput(input) {
        // e.g., "add main menu", "add start button"
        ProjectManager.execute(input);
        this.addMessage("system", `Menu/layout action executed: "${input}".`);
    }

    // ------------------------------
    // Button handler
    // ------------------------------
    handleButtonInput(input) {
        // e.g., "link button StartButton to scene Level2"
        ProjectManager.execute(input);
        this.addMessage("system", `Button action executed: "${input}".`);
    }

    // ------------------------------
    // Scene transition handler
    // ------------------------------
    handleSceneTransitionInput(input) {
        ProjectManager.execute(input);
        this.addMessage("system", `Scene transition action executed: "${input}".`);
    }
}

// ------------------------------
// Integration
// ------------------------------
window.NLPProcessor = NLPProcessor;

// Usage in godot.js context:
const nlpProcessor = new NLPProcessor(GodotState, chatInput, addMessage);

// Hook to chat input
chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        nlpProcessor.process(chatInput.value);
        chatInput.value = "";
        updateInfoPanel();
        updateSuggestions();
    }
});

console.log("nlp_pro.js loaded: context-aware NLP processor active.");
