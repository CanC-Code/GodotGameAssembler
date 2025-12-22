// libs/nlp_pro.js
// Author: CCVO
// Purpose: Intent-aware NLP controller (human-friendly)

class NLPProcessor {
    constructor(state, chatInput, addMessage) {
        this.state = state;
        this.chatInput = chatInput;
        this.addMessage = addMessage;

        this.state.workflowStage ??= "INIT";
        this.state.awaitingAnswerFor ??= null;
    }

    // ------------------------------
    // Button-driven intent
    // ------------------------------
    handleIntent(intent) {
        const prompts = {
            "Set Game Name": ["GAME_NAME", "What is the name of your game?"],
            "Set Concept": ["CONCEPT", "Describe the game concept."],
            "Create Scene": ["SCENE_NAME", "What should the scene be called?"]
        };

        if (!prompts[intent]) return;

        const [slot, prompt] = prompts[intent];
        this.state.awaitingAnswerFor = slot;
        this.addMessage("system", prompt);
    }

    // ------------------------------
    // Text input entry point
    // ------------------------------
    process(input) {
        input = input.trim();
        if (!input) return;

        this.addMessage("user", input);

        // 1️⃣ If answering a question → consume it
        if (this.state.awaitingAnswerFor) {
            this.consumeAnswer(input);
            return;
        }

        // 2️⃣ If looks like a command → execute
        if (this.looksLikeCommand(input)) {
            const result = ProjectManager.process_nlp_command(input);
            this.addMessage("system", result ?? `Executed: "${input}"`);
            return;
        }

        // 3️⃣ Otherwise infer intent from workflow
        this.inferImplicitIntent(input);
    }

    // ------------------------------
    // Answer consumption
    // ------------------------------
    consumeAnswer(text) {
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
                ProjectManager.process_nlp_command(`create scene ${text}`);
                this.addMessage("system", `Scene "${text}" created.`);
                break;
        }

        this.state.awaitingAnswerFor = null;
        updateInfoPanel();
        updateSuggestions();
    }

    // ------------------------------
    // Implicit intent (magic)
    // ------------------------------
    inferImplicitIntent(text) {
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
            ProjectManager.process_nlp_command(`create scene ${text}`);
            this.addMessage("system", `Scene "${text}" created.`);
        }
        else {
            this.addMessage(
                "system",
                `I’m not sure what "${text}" refers to. Try a command like "add player" or use the buttons.`
            );
        }

        updateInfoPanel();
        updateSuggestions();
    }

    // ------------------------------
    // Command detection
    // ------------------------------
    looksLikeCommand(text) {
        return /^(create|add|set|attach|link|export|list|name)\b/i.test(text);
    }
}

// ------------------------------
// Global wiring
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

console.log("NLP ready: implicit intent + commands unified.");
