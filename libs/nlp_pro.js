// libs/nlp_pro.js
// Author: CCVO
// Purpose: Intent-aware NLP controller with conversational creation

class NLPProcessor {
    constructor(state, chatInput, addMessage) {
        this.state = state;
        this.chatInput = chatInput;
        this.addMessage = addMessage;
    }

    // ------------------------------
    // Button intent handler
    // ------------------------------
    handleIntent(intent) {
        const intentMap = {
            "Set Game Name": () => this.ask("GAME_NAME", "What is the name of your game?"),
            "Set Concept": () => this.ask("CONCEPT", "Describe the game concept."),
            "Create Scene": () => this.ask("SCENE_NAME", "What should the scene be called?"),
            "Add Player": () => this.startPlayerCreation(),
            "Create Touch Controller": () => this.createTouchController()
        };

        if (intentMap[intent]) intentMap[intent]();
    }

    ask(slot, question) {
        this.state.creationContext = {
            type: "ANSWER",
            slot
        };
        this.addMessage("system", question);
    }

    // ------------------------------
    // Main processor
    // ------------------------------
    async process(input) {
        input = input.trim();
        if (!input) return;

        this.addMessage("user", input);

        // 1️⃣ Awaiting structured answer
        if (this.state.creationContext) {
            await this.consumeContext(input);
            return;
        }

        // 2️⃣ Explicit command
        if (this.looksLikeCommand(input)) {
            const result = await ProjectManager.execute(input);
            if (result) this.addMessage("system", result);
            this.refresh();
            return;
        }

        // 3️⃣ Implicit intent
        await this.inferIntent(input);
    }

    // ------------------------------
    // Context consumer
    // ------------------------------
    async consumeContext(input) {
        const ctx = this.state.creationContext;

        // Basic answers
        if (ctx.type === "ANSWER") {
            if (ctx.slot === "GAME_NAME") {
                this.state.gameName = input;
                this.addMessage("system", `Game named "${input}".`);
            }

            if (ctx.slot === "CONCEPT") {
                this.state.concept = input;
                this.addMessage("system", `Concept set: "${input}".`);
            }

            if (ctx.slot === "SCENE_NAME") {
                this.state.currentScene = input;
                await ProjectManager.execute(`create scene ${input}`);
                this.state.nodesInScene[input] = [];
                this.addMessage("system", `Scene "${input}" created.`);
            }

            this.state.creationContext = null;
            this.refresh();
            return;
        }

        // Player creation flow
        if (ctx.type === "CREATE_PLAYER") {
            if (ctx.step === "NAME") {
                ctx.data.name = input;
                ctx.step = "CONTROLLER";
                this.addMessage(
                    "system",
                    "Should this player use an existing controller or create a new one?"
                );
                return;
            }

            if (ctx.step === "CONTROLLER") {
                let controllerId;

                if (/touch/i.test(input)) {
                    controllerId = `touch_${Date.now()}`;
                    this.state.createController(controllerId, "touch");
                    this.addMessage("system", "Touch controller created. Opening editor.");
                    window.openTouchEditor();
                } else {
                    controllerId = "keyboard_default";
                    this.state.createController(controllerId, "keyboard");
                }

                // Create player node
                const node = {
                    name: ctx.data.name,
                    type: "Player",
                    controller: controllerId
                };

                this.state.nodesInScene[this.state.currentScene].push(node);
                this.state.lastNodeAdded = node.name;

                this.addMessage(
                    "system",
                    `Player "${node.name}" added using controller "${controllerId}".`
                );

                this.state.creationContext = null;
                this.refresh();
            }
        }
    }

    // ------------------------------
    // Intent inference
    // ------------------------------
    async inferIntent(input) {
        const lower = input.toLowerCase();

        if (!this.state.gameName) {
            this.ask("GAME_NAME", "What is the name of your game?");
            return;
        }

        if (!this.state.concept) {
            this.ask("CONCEPT", "Describe the game concept.");
            return;
        }

        if (!this.state.currentScene) {
            this.ask("SCENE_NAME", "What should the first scene be called?");
            return;
        }

        if (lower === "player") {
            this.startPlayerCreation();
            return;
        }

        this.addMessage(
            "system",
            `I didn’t understand "${input}". Try "player", "add button", or use the suggestions.`
        );
    }

    // ------------------------------
    // Creation starters
    // ------------------------------
    startPlayerCreation() {
        this.state.creationContext = {
            type: "CREATE_PLAYER",
            step: "NAME",
            data: {}
        };
        this.addMessage("system", "Creating a Player. What should its name be?");
    }

    createTouchController() {
        const id = `touch_${Date.now()}`;
        this.state.createController(id, "touch");
        this.addMessage("system", `Touch controller "${id}" created.`);
        window.openTouchEditor();
        this.refresh();
    }

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

window.handleSuggestionClick = intent =>
    nlpProcessor.handleIntent(intent);

chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        const v = chatInput.value;
        chatInput.value = "";
        nlpProcessor.process(v);
    }
});

console.log("NLP active: conversational, context-aware.");
