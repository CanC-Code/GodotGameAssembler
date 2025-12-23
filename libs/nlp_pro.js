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
        this.state.pendingPlayer ??= null; // temporary store for interactive player creation
    }

    // ------------------------------
    // Button intent handler
    // ------------------------------
    handleIntent(intent) {
        const prompts = {
            "Set Game Name": ["GAME_NAME", "What is the name of your game?"],
            "Set Concept": ["CONCEPT", "Describe the game concept."],
            "Create Scene": ["SCENE_NAME", "What should the scene be called?"],
            "Add Player": ["PLAYER", "Creating a new player. What should its name be?"]
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
                await ProjectManager.process_nlp_command(`create scene ${text}`);
                this.addMessage("system", `Scene "${text}" created.`);
                break;

            case "PLAYER":
                this.state.pendingPlayer = { name: text };
                this.state.awaitingAnswerFor = "PLAYER_CONTROLLER";
                this.addMessage(
                    "system",
                    `Should player "${text}" use an existing controller or create a new one? (type 'new' or the controller name)`
                );
                return; // exit to wait for controller input

            case "PLAYER_CONTROLLER":
                await this.assignController(text);
                break;
        }

        this.state.awaitingAnswerFor = null;
        this.refresh();
    }

    // ------------------------------
    // Controller assignment
    // ------------------------------
    async assignController(input) {
        const player = this.state.pendingPlayer;
        if (!player) return;

        if (input.toLowerCase() === "new") {
            // Launch touch editor for creating a new controller
            openTouchEditor(); 
            player.controller = `custom_controller_${player.name}`;
            this.addMessage("system", `Player "${player.name}" added. Use the touch editor to configure the controller.`);
        } else {
            // Assign existing controller
            player.controller = input;
            this.addMessage("system", `Player "${player.name}" added using controller "${input}".`);
        }

        // Add player to ProjectManager / current scene
        if (this.state.currentScene) {
            const nodeName = player.name;
            const sceneName = this.state.currentScene;
            await ProjectManager.process_nlp_command(`add node ${nodeName} KinematicBody to ${sceneName}`);
            if (!GodotState.nodesInScene[sceneName]) GodotState.nodesInScene[sceneName] = [];
            GodotState.nodesInScene[sceneName].push({
                name: nodeName,
                type: "KinematicBody",
                controller: player.controller
            });
        }

        this.state.pendingPlayer = null;
    }

    // ------------------------------
    // Implicit intent inference
    // ------------------------------
    async inferImplicitIntent(text) {
        const lower = text.toLowerCase();

        if (!this.state.gameName) {
            this.state.awaitingAnswerFor = "GAME_NAME";
            await this.consumeAnswer(text);
        } else if (!this.state.concept) {
            this.state.awaitingAnswerFor = "CONCEPT";
            await this.consumeAnswer(text);
        } else if (!this.state.currentScene) {
            this.state.awaitingAnswerFor = "SCENE_NAME";
            await this.consumeAnswer(text);
        } else if (["player"].includes(lower)) {
            this.state.awaitingAnswerFor = "PLAYER";
            await this.consumeAnswer(text);
        } else {
            const nodeTypeMap = { camera: "Camera", button: "Button", label: "Label" };
            if (nodeTypeMap[lower]) {
                const nodeName = lower.charAt(0).toUpperCase() + lower.slice(1);
                await ProjectManager.process_nlp_command(
                    `add node ${nodeName} ${nodeTypeMap[lower]} to ${this.state.currentScene}`
                );
                this.addMessage("system", `Node "${nodeName}" added to scene "${this.state.currentScene}".`);
            } else {
                this.addMessage(
                    "system",
                    `I didn’t understand "${text}". Try "add player", "add camera", "add button", or use the suggestions.`
                );
            }
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
        renderProjectTree();
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

console.log("NLP active: async-safe, intent-aware, controller-interactive.");
