// libs/nlp_pro.js
// Author: CCVO
// Purpose: Intent-aware NLP controller (human-first)

class NLPProcessor {
    constructor(state, chatInput, addMessage) {
        this.state = state;
        this.chatInput = chatInput;
        this.addMessage = addMessage;

        this.state.workflowStage ??= "INIT";
        this.state.awaitingAnswerFor ??= null;
        this.state.tempNode ??= null;
    }

    // ------------------------------
    // Button intent handler
    // ------------------------------
    handleIntent(intent) {
        const prompts = {
            "Set Game Name": ["GAME_NAME", "What is the name of your game?"],
            "Set Concept": ["CONCEPT", "Describe the game concept."],
            "Create Scene": ["SCENE_NAME", "What should the scene be called?"],
            "Add Player": ["PLAYER_NAME", "Enter player name:"]
        };

        if (!prompts[intent]) return;

        const [slot, prompt] = prompts[intent];
        this.state.awaitingAnswerFor = slot;
        this.addMessage("system", prompt);
    }

    // ------------------------------
    // Main text processor
    // ------------------------------
    async process(input) {
        input = input.trim();
        if (!input) return;

        this.addMessage("user", input);

        // 1️⃣ Explicit answer to a question
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

        // 3️⃣ Implicit intent
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
                window.showControllerModal(text, async (controllerName) => {
                    this.state.tempNode.controller = controllerName;
                    GodotState.controllers ??= {};
                    GodotState.controllers[controllerName] ??= { mapping: {} };

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
                    this.state.awaitingAnswerFor = null;
                    this.refresh();
                });
                return;
        }

        this.state.awaitingAnswerFor = null;
        this.refresh();
    }

    // ------------------------------
    // Implicit intent inference
    // ------------------------------
    async inferImplicitIntent(text) {
        const lower = text.toLowerCase();

        if (!this.state.gameName) {
            this.state.gameName = text;
            this.addMessage("system", `Game named "${text}".`);
        }
        else if (!this.state.concept) {
            this.state.concept = text;
            this.addMessage("system", `Concept set: "${text}".`);
        }
        else if (!this.state.currentScene) {
            this.state.currentScene = text;
            await ProjectManager.execute(`create scene ${text}`);
            this.addMessage("system", `Scene "${text}" created.`);
        }
        else if (["player", "camera", "button", "label"].includes(lower)) {
            // Player node triggers name + controller assignment
            if (lower === "player") {
                this.handleIntent("Add Player");
                return;
            }

            const typeMap = {
                camera: "Camera",
                button: "Button",
                label: "Label"
            };

            const nodeName = lower.charAt(0).toUpperCase() + lower.slice(1);
            const nodeType = typeMap[lower];

            await ProjectManager.execute(
                `add node ${nodeName} ${nodeType} to ${this.state.currentScene}`
            );

            this.addMessage(
                "system",
                `Node "${nodeName}" added to scene "${this.state.currentScene}".`
            );
        }
        else {
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

console.log("NLP active: async-safe, intent-aware, controller integrated.");
