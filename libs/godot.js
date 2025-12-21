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
        nextPrompt: "name_game", // states: name_game, set_concept, create_scene, idle
    };

    function logMessage(msg) {
        nlpLog.innerHTML += msg + "\n";
        nlpLog.scrollTop = nlpLog.scrollHeight;
    }

    async function handleInput(userInput) {
        logMessage(`> ${userInput}`);

        // Trim input
        const text = userInput.trim();

        // Check conversation state
        if (!convo.gameNamed && convo.nextPrompt === "name_game") {
            const m = text.match(/^name\s+game\s+"?([^"]+)"?/i);
            if (m) {
                const name = m[1];
                convo.gameNamed = true;
                ProjectManager.projectName = name;
                logMessage(`Game named '${name}'.`);
                convo.nextPrompt = "set_concept";
                logMessage("Please set your game concept: set concept \"<description>\"");
                return;
            } else {
                logMessage("Please name your game using: name game \"<Name>\"");
                return;
            }
        }

        if (!convo.conceptSet && convo.nextPrompt === "set_concept") {
            const m = text.match(/^set\s+concept\s+"?([^"]+)"?/i);
            if (m) {
                const concept = m[1];
                convo.conceptSet = true;
                ProjectManager.projectConcept = concept;
                logMessage(`Concept set: "${concept}"`);
                convo.nextPrompt = "create_scene";
                logMessage("Let's create your first scene: create scene <SceneName>");
                return;
            } else {
                logMessage("Please set your game concept using: set concept \"<description>\"");
                return;
            }
        }

        if (convo.nextPrompt === "create_scene") {
            const m = text.match(/^create\s+scene\s+(\w+)/i);
            if (m) {
                const sceneName = m[1];
                const result = await ProjectManager.process_nlp_command(text);
                logMessage(result);
                convo.nextPrompt = "idle";
                logMessage("Scene created. You can now add nodes, buttons, scripts, or more scenes. Type 'help' for commands.");
                return;
            } else {
                logMessage("Please create a scene using: create scene <SceneName>");
                return;
            }
        }

        // Default: pass to NLP_PRO
        const result = await ProjectManager.process_nlp_command(text);
        logMessage(result);
    }

    function sendNLPCommandGUI() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpInput.value = "";
        handleInput(cmd);
    }

    // Event listeners
    nlpSend.addEventListener("click", sendNLPCommandGUI);
    nlpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendNLPCommandGUI();
    });

    // ------------------------------
    // Initial prompt
    // ------------------------------
    logMessage("Hello! What would you like to do?");
    logMessage("Start by naming your game: name game \"<Name>\"");

    console.log("Godot interactive chat initialized.");

})();
