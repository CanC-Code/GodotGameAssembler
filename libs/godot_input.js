// libs/godot_input.js
// Author: CCVO
// Purpose: Input parsing + transactional object creation (NO silent defaults)

// ------------------------------
// Safe ProjectManager bridge
// ------------------------------
function executeProjectCommand(command) {
    if (!window.ProjectManager) {
        console.error("ProjectManager not loaded");
        return;
    }

    if (typeof ProjectManager.execute === "function") {
        ProjectManager.execute(command);
    } else if (typeof ProjectManager.run === "function") {
        ProjectManager.run(command);
    } else if (typeof ProjectManager.dispatch === "function") {
        ProjectManager.dispatch(command);
    } else {
        console.error("No executable command method found on ProjectManager", ProjectManager);
    }
}

// ------------------------------
// Progressive input processor
// ------------------------------
function processInput(input) {
    input = input.trim();
    if (!input) return;

    addMessage("user", input);

    // ------------------------------
    // Pending transactional actions
    // ------------------------------
    if (GodotState.pendingAction) {
        handlePendingAction(input);
        return;
    }

    // ------------------------------
    // Initial project bootstrap
    // ------------------------------
    if (!GodotState.gameName) {
        GodotState.gameName = input;
        addMessage("system", `Game named "${GodotState.gameName}".`);
    }
    else if (!GodotState.concept) {
        GodotState.concept = input;
        addMessage("system", `Concept set: "${GodotState.concept}".`);
    }
    else if (!GodotState.currentScene) {
        GodotState.currentScene = input;
        GodotState.nodesInScene[input] = [];
        executeProjectCommand(`create scene ${input}`);
        addMessage("system", `Scene "${input}" created.`);
    }
    else {
        // ------------------------------
        // Command parsing
        // ------------------------------
        const cmd = input.toLowerCase();

        if (cmd === "player" || cmd === "add player" || cmd === "new player") {
            GodotState.pendingAction = {
                type: "create_player",
                step: "ask_name"
            };
            addMessage("system", "Creating a Player. What should its name be?");
            updateSuggestions([]);
            return;
        }

        executeProjectCommand(input);
    }

    updateInfoPanel();
    addMessage("system", getNextPrompt());
    updateSuggestions();
}

// ------------------------------
// Pending Action Handler
// ------------------------------
function handlePendingAction(input) {
    const action = GodotState.pendingAction;

    // ------------------------------
    // Player creation pipeline
    // ------------------------------
    if (action.type === "create_player") {

        if (action.step === "ask_name") {
            action.playerName = input;
            action.step = "ask_controller_type";

            addMessage(
                "system",
                `How should "${action.playerName}" be controlled?\n` +
                `• keyboard\n` +
                `• gamepad\n` +
                `• touch`
            );
            return;
        }

        if (action.step === "ask_controller_type") {
            const mode = input.toLowerCase();

            if (!["keyboard", "gamepad", "touch"].includes(mode)) {
                addMessage("system", "Please choose: keyboard, gamepad, or touch.");
                return;
            }

            action.controllerMode = mode;

            // Keyboard / gamepad are immediate
            if (mode !== "touch") {
                const controllerName = `${action.playerName}_${mode}`;

                executeProjectCommand(
                    `add player ${action.playerName} with controller ${controllerName}`
                );

                GodotState.nodesInScene[GodotState.currentScene].push({
                    name: action.playerName,
                    type: "Player",
                    controller: controllerName
                });

                GodotState.pendingAction = null;
                addMessage("system", `Player "${action.playerName}" added.`);
                return;
            }

            // Touch controller requires editor
            action.step = "design_touch_controller";
            addMessage("system", "Opening touch controller editor. Design controls and press Save.");
            openTouchEditor();
            return;
        }
    }
}

// ------------------------------
function getNextPrompt() {
    if (!GodotState.gameName) return "What is the name of your game?";
    if (!GodotState.concept) return `Describe the concept of "${GodotState.gameName}".`;
    if (!GodotState.currentScene) return "What should the first scene be called?";
    return `Add nodes, players, controls, or create another scene.`;
}

// ------------------------------
// Exports
// ------------------------------
window.processInput = processInput;
window.executeProjectCommand = executeProjectCommand;
