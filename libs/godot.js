// libs/godot.js
// Author: CCVO
// Purpose: Guided interactive chat for GodotGameAssembler
// Features: proactive prompts, NLP command handling, game creation guidance

(function () {

    if (!window.ProjectManager) {
        throw new Error("ProjectManager must be loaded before godot.js");
    }

    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");
    const nlpLog = document.getElementById("nlp-log");

    // ------------------------------
    // Conversation State
    // ------------------------------
    const convo = {
        gameNamed: false,
        conceptSet: false,
        sceneCreated: false,
        nextPrompt: "name_game", // states: name_game, set_concept, create_scene, idle
    };

    function logMessage(msg) {
        nlpLog.innerHTML += msg + "\n";
        nlpLog.scrollTop = nlpLog.scrollHeight;
    }

    async function handleInput(userInput) {
        logMessage(`> ${userInput}`);

        const text = userInput.trim();
        const pm = window.ProjectManager;

        // --- Step 1: Name Game ---
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

        // --- Step 2: Set Concept ---
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

        // --- Step 3: Create Scene ---
        if (!convo.sceneCreated && convo.nextPrompt === "create_scene") {
            const m = text.match(/^create\s+scene\s+(\w+)/i);
            if (m) {
                const sceneName = m[1];
                const result = await pm.process_nlp_command(text);
                logMessage(result);
                convo.sceneCreated = true;
                convo.nextPrompt = "idle";
                logMessage("Scene created. You can now add nodes, buttons, thumbsticks, scripts, or more scenes.");
                logMessage("Type 'help' for commands. You can also import or export your project.");
                return;
            } else {
                logMessage("Please create a scene using: create scene <SceneName>");
                return;
            }
        }

        // --- Default: Pass to ProjectManager NLP ---
        const result = await pm.process_nlp_command(text);
        logMessage(result);
        logMessage("Tip: You can create scenes, add nodes/buttons, attach scripts, import/export projects, or type 'help'.");
    }

    function sendNLPCommandGUI() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpInput.value = "";
        handleInput(cmd);
    }

    // --- Event listeners ---
    nlpSend.addEventListener("click", sendNLPCommandGUI);
    nlpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendNLPCommandGUI();
    });

    // ------------------------------
    // Initial prompt
    // ------------------------------
    logMessage("Hello! Welcome to Godot Game Assembler.");
    logMessage("What would you like to do?");
    logMessage("Start by naming your game: name game \"<Name>\"");

    console.log("Godot interactive chat initialized.");

})();
