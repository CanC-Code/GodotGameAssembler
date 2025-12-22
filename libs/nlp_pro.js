// libs/nlp_pro.js
// Author: CCVO
// Purpose: Context-aware NLP workflow controller

class NLPProcessor {
    constructor(state, chatInput, addMessageCallback) {
        this.state = state;
        this.chatInput = chatInput;
        this.addMessage = addMessageCallback;

        if (!this.state.workflowStage) {
            this.state.workflowStage = "INIT";
        }
    }

    process(input) {
        input = input.trim();
        if (!input) return;

        this.addMessage("user", input);

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
                this.createScene(input);
                break;

            case "NODE":
                this.handleNodeInput(input);
                break;

            default:
                console.warn("Unknown workflow stage:", this.state.workflowStage);
                this.state.workflowStage = "INIT";
                this.addMessage(
                    "system",
                    "Workflow reset. Please provide your game name."
                );
        }
    }

    createScene(input) {
        const match = input.match(/(?:create\s+scene\s+)?(\w+)/i);
        if (!match) {
            this.addMessage("system", "Please provide a valid scene name.");
            return;
        }

        const sceneName = match[1];
        this.state.currentScene = sceneName;

        if (!this.state.nodesInScene) {
            this.state.nodesInScene = {};
        }

        this.state.nodesInScene[sceneName] = [];

        executeProjectCommand(`create scene ${sceneName}`);

        this.state.workflowStage = "NODE";
        this.addMessage("system", `Scene "${sceneName}" created and selected.`);
    }

    handleNodeInput(input) {
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
        }

        if (nodeName && nodeType) {
            if (!this.state.nodesInScene[this.state.currentScene]) {
                this.state.nodesInScene[this.state.currentScene] = [];
            }

            this.state.nodesInScene[this.state.currentScene].push({
                name: nodeName,
                type: nodeType,
                script: null
            });

            executeProjectCommand(
                `add node ${nodeName} ${nodeType} to ${this.state.currentScene}`
            );

            this.addMessage(
                "system",
                `Node "${nodeName}" (${nodeType}) added to "${this.state.currentScene}".`
            );
        } else {
            executeProjectCommand(input);
            this.addMessage("system", `Executed: "${input}"`);
        }
    }
}

// ------------------------------
// Integration
// ------------------------------
window.NLPProcessor = NLPProcessor;

const nlpProcessor = new NLPProcessor(GodotState, chatInput, addMessage);

// ✅ THIS IS THE MISSING PIECE
window.handleSuggestionClick = function (text) {
    chatInput.value = "";
    nlpProcessor.process(text);
    updateInfoPanel();
    updateSuggestions();
};

// SINGLE authoritative Enter handler
chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        const value = chatInput.value;
        chatInput.value = "";
        nlpProcessor.process(value);
        updateInfoPanel();
        updateSuggestions();
    }
});

console.log("nlp_pro.js loaded: NLP workflow active.");
