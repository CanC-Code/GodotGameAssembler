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

        this.state.awaitingAnswerFor = null;
    }

    // ------------------------------
    // Suggestion Button Entry
    // ------------------------------
    handleIntent(intent) {
        switch (intent) {
            case "Set Game Name":
                this.state.awaitingAnswerFor = "GAME_NAME";
                this.addMessage("system", "What is the name of your game?");
                break;

            case "Set Concept":
                this.state.awaitingAnswerFor = "CONCEPT";
                this.addMessage("system", "Describe the game concept.");
                break;

            case "Create Scene":
                this.state.awaitingAnswerFor = "SCENE_NAME";
                this.addMessage("system", "What should the scene be called?");
                break;

            default:
                this.addMessage("system", `Action "${intent}" not yet implemented.`);
        }
    }

    // ------------------------------
    // Text Input Entry
    // ------------------------------
    process(input) {
        input = input.trim();
        if (!input) return;

        this.addMessage("user", input);

        // 🔑 If we're awaiting an answer, consume it
        if (this.state.awaitingAnswerFor) {
            this.consumeAnswer(input);
            return;
        }

        // Freeform fallback
        executeProjectCommand(input);
        this.addMessage("system", `Executed: "${input}"`);
    }

    consumeAnswer(input) {
        switch (this.state.awaitingAnswerFor) {
            case "GAME_NAME":
                this.state.gameName = input;
                this.addMessage("system", `Game named "${input}".`);
                break;

            case "CONCEPT":
                this.state.concept = input;
                this.addMessage("system", `Concept set: "${input}".`);
                break;

            case "SCENE_NAME":
                this.state.currentScene = input;
                executeProjectCommand(`create scene ${input}`);
                this.addMessage("system", `Scene "${input}" created.`);
                break;
        }

        this.state.awaitingAnswerFor = null;
        updateInfoPanel();
        updateSuggestions();
    }
}

// ------------------------------
// Global Wiring
// ------------------------------
window.NLPProcessor = NLPProcessor;

const nlpProcessor = new NLPProcessor(GodotState, chatInput, addMessage);

window.handleSuggestionClick = function (intent) {
    nlpProcessor.handleIntent(intent);
};

chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        const value = chatInput.value;
        chatInput.value = "";
        nlpProcessor.process(value);
    }
});

console.log("nlp_pro.js loaded: intent-aware NLP active.");
