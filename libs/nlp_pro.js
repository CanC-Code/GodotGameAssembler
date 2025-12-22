// libs/nlp_pro.js
// Author: CCVO
// Purpose: Intent-aware NLP controller with dynamic object questions

class NLPProcessor {
    constructor(state, chatInput, addMessage) {
        this.state = state;
        this.chatInput = chatInput;
        this.addMessage = addMessage;

        this.state.workflowStage ??= "INIT";
        this.state.awaitingAnswerFor ??= null;
        this.state.tempNode ??= null;
        this.state.controllers ??= {}; // Store controller configurations
    }

    // ------------------------------
    // Handle button intents
    // ------------------------------
    handleIntent(intent) {
        const prompts = {
            "Set Game Name": ["GAME_NAME", "What is the name of your game?"],
            "Set Concept": ["CONCEPT", "Describe the game concept."],
            "Create Scene": ["SCENE_NAME", "What should the scene be called?"],
            "Add Player": ["PLAYER_NAME", "Player name?"],
            "Add Camera": ["CAMERA_NAME", "Camera name?"],
            "Add Button": ["BUTTON_NAME", "Button name?"],
            "Add Label": ["LABEL_NAME", "Label text?"]
        };

        if (!prompts[intent]) return;

        const [slot, prompt] = prompts[intent];
        this.state.awaitingAnswerFor = slot;
        this.addMessage("system", prompt);
    }

    // ------------------------------
    // Process text input
    // ------------------------------
    async process(input) {
        input = input.trim();
        if (!input) return;

        this.addMessage("user", input);

        // 1️⃣ Explicit answer to a pending question
        if (this.state.awaitingAnswerFor) {
            await this.consumeAnswer(input);
            return;
        }

        // 2️⃣ Explicit command
        if (this.looksLikeCommand(input)) {
            const result = await ProjectManager.process_nlp_command(input);
            this.addMessage("system", result);
            this.refresh();
            return;
        }

        // 3️⃣ Implicit intent / free-form
        await this.inferImplicitIntent(input);
    }

    // ------------------------------
    // Consume prompted answers
    // ------------------------------
    async consumeAnswer(text) {
        switch (this.state.awaitingAnswerFor) {
            case "GAME_NAME":
                this.state.gameName = text;
                this.addMessage("system", `Game named "${text}".`);
                break;

            case "CONCEPT":
                this.state.concept = text;
                this.addMessage("system", `Concept set: "${text}".`);
                break;

            case "SCENE_NAME":
                this.state.currentScene = text;
                await ProjectManager.execute(`create scene ${text}`);
                this.addMessage("system", `Scene "${text}" created.`);
                break;

            case "PLAYER_NAME":
                this.state.tempNode = { type: "Player", name: text };
                const existingControllers = Object.keys(this.state.controllers);
                const prompt = existingControllers.length
                    ? `Assign a controller? (type name or choose: ${existingControllers.join(", ")})`
                    : `Assign a controller for "${text}"? (type new name)`;
                this.addMessage("system", prompt);
                this.state.awaitingAnswerFor = "PLAYER_CONTROLLER";
                return; // Wait for next input

            case "PLAYER_CONTROLLER":
                const controllerName = text || "DefaultController";
                this.state.tempNode.controller = controllerName;
                // Store controller for reuse
                this.state.controllers[controllerName] ??= { mapping: {} };

                // Execute creation
                await ProjectManager.execute(
                    `add node ${this.state.tempNode.name} Player to ${this.state.currentScene}`
                );

                this.state.nodesInScene ??= {};
                this.state.nodesInScene[this.state.currentScene] ??= [];
                this.state.nodesInScene[this.state.currentScene].push(this.state.tempNode);

                this.addMessage(
                    "system",
                    `Player "${this.state.tempNode.name}" added with controller "${controllerName}".`
                );

                this.state.tempNode = null;
                break;

            case "CAMERA_NAME":
            case "BUTTON_NAME":
            case "LABEL_NAME":
                const typeMap = {
                    CAMERA_NAME: "Camera",
                    BUTTON_NAME: "Button",
                    LABEL_NAME: "Label"
                };
                const nodeType = typeMap[this.state.awaitingAnswerFor];
                const nodeName = text;

                await ProjectManager.execute(
                    `add node ${nodeName} ${nodeType} to ${this.state.currentScene}`
                );

                this.state.nodesInScene ??= {};
                this.state.nodesInScene[this.state.currentScene] ??= [];
                this.state.nodesInScene[this.state.currentScene].push({ type: nodeType, name: nodeName });

                this.addMessage(
                    "system",
                    `${nodeType} "${nodeName}" added to scene "${this.state.currentScene}".`
                );
                break;

            default:
                console.warn("Unhandled awaitingAnswerFor:", this.state.awaitingAnswerFor);
        }

        this.state.awaitingAnswerFor = null;
        this.refresh();
    }

    // ------------------------------
    // Implicit free-form processing
    // ------------------------------
    async inferImplicitIntent(text) {
        const lower = text.toLowerCase();

        if (!this.state.gameName) {
            this.state.gameName = text;
            this.addMessage("system", `Game named "${text}".`);
        } else if (!this.state.concept) {
            this.state.concept = text;
            this.addMessage("system", `Concept set: "${text}".`);
        } else if (!this.state.currentScene) {
            this.state.currentScene = text;
            await ProjectManager.execute(`create scene ${text}`);
            this.addMessage("system", `Scene "${text}" created.`);
        } else if (["player", "camera", "button", "label"].includes(lower)) {
            await this.handleIntent("Add " + lower.charAt(0).toUpperCase() + lower.slice(1));
        } else {
            this.addMessage(
                "system",
                `I didn’t understand "${text}". Try "add player" or use the buttons.`
            );
        }

        this.refresh();
    }

    // ------------------------------
    // Helpers
    // ------------------------------
    looksLikeCommand(text) {
        return /^(create|add|set|attach|link|export|list|name)\b/i.test(text);
    }

    refresh() {
        updateInfoPanel();
        updateSuggestions();
    }
}

// ------------------------------
// Wiring
// ------------------------------
const nlpProcessor = new NLPProcessor(GodotState, chatInput, addMessage);
window.handleSuggestionClick = intent => nlpProcessor.handleIntent(intent);

chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        const v = chatInput.value;
        chatInput.value = "";
        nlpProcessor.process(v);
    }
});

console.log("NLP active: async, intent-aware, dynamic questions enabled.");
