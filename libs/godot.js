// libs/godot.js
// Author: CCVO
// Purpose: Guided interactive chat for GodotGameAssembler
// Features: proactive prompts, NLP command handling, game creation guidance, multi-step workflow

(function () {

    if (!window.ProjectManager) {
        throw new Error("ProjectManager must be loaded before godot.js");
    }

    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");
    const nlpLog = document.getElementById("nlp-log");
    const pm = window.ProjectManager;

    // ------------------------------
    // Conversation State
    // ------------------------------
    const convo = {
        gameNamed: false,
        conceptSet: false,
        firstSceneCreated: false,
        nextPrompt: "name_game", // states: name_game, set_concept, create_scene, idle
    };

    function logMessage(msg) {
        nlpLog.innerHTML += msg + "\n";
        nlpLog.scrollTop = nlpLog.scrollHeight;
    }

    async function handleInput(userInput) {
        logMessage(`> ${userInput}`);
        const text = userInput.trim();

        // ------------------------------
        // Naming the Game
        // ------------------------------
        if (!convo.gameNamed && convo.nextPrompt === "name_game") {
            const m = text.match(/^name\s+game\s+"?([^"]+)"?/i);
            if (m) {
                const name = m[1];
                convo.gameNamed = true;
                pm.projectName = name;
                logMessage(`Game named '${name}'.`);
                convo.nextPrompt = "set_concept";
                logMessage("Please set your game concept: set concept \"<description>\"");
                return;
            } else {
                logMessage("Please name your game using: name game \"<Name>\"");
                return;
            }
        }

        // ------------------------------
        // Setting Game Concept
        // ------------------------------
        if (!convo.conceptSet && convo.nextPrompt === "set_concept") {
            const m = text.match(/^set\s+concept\s+"?([^"]+)"?/i);
            if (m) {
                const concept = m[1];
                convo.conceptSet = true;
                pm.projectConcept = concept;
                logMessage(`Concept set: "${concept}"`);
                convo.nextPrompt = "create_scene";
                logMessage("Let's create your first scene: create scene <SceneName>");
                return;
            } else {
                logMessage("Please set your game concept using: set concept \"<description>\"");
                return;
            }
        }

        // ------------------------------
        // Creating First Scene
        // ------------------------------
        if (!convo.firstSceneCreated && convo.nextPrompt === "create_scene") {
            const m = text.match(/^create\s+scene\s+(\w+)/i);
            if (m) {
                const sceneName = m[1];
                const result = await pm.process_nlp_command(text);
                logMessage(result);
                convo.firstSceneCreated = true;
                convo.nextPrompt = "idle";
                logMessage("Scene created. You can now add nodes, UI, buttons, scripts, cameras, physics, and more.");
                logMessage("Type 'help' to see all available commands.");
                return;
            } else {
                logMessage("Please create a scene using: create scene <SceneName>");
                return;
            }
        }

        // ------------------------------
        // Default NLP Processing / Guidance
        // ------------------------------
        // This handles all remaining commands dynamically, including node addition, UI, thumbsticks, physics, etc.
        const result = await pm.process_nlp_command(text);
        logMessage(result);

        // Suggest next guided step if project is minimal
        if (!convo.firstSceneCreated && convo.gameNamed && convo.conceptSet) {
            logMessage("Tip: create your first scene to start building your game.");
        }
    }

    function sendNLPCommandGUI() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpInput.value = "";
        handleInput(cmd);
    }

    // ------------------------------
    // Event Listeners
    // ------------------------------
    nlpSend.addEventListener("click", sendNLPCommandGUI);
    nlpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendNLPCommandGUI();
    });

    // ------------------------------
    // Initial Chat Prompt
    // ------------------------------
    logMessage("Hello! What would you like to do?");
    logMessage("Start by naming your game: name game \"<Name>\"");
    logMessage("I will guide you through concept, scene creation, nodes, UI, physics, and full game features.");

    console.log("Godot interactive chat initialized.");

})();
