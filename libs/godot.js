// libs/godot.js
// Author: CCVO
// Purpose: Guided interactive chat for GodotGameAssembler
// Features: proactive prompts, NLP command handling, game creation guidance
// Fully waits for ProjectManager to be available before initializing

(function () {

    // ------------------------------
    // Wait for ProjectManager to be ready
    // ------------------------------
    function waitForProjectManager(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const interval = setInterval(() => {
                if (window.ProjectManager) {
                    clearInterval(interval);
                    resolve(window.ProjectManager);
                } else if (Date.now() - start > timeout) {
                    clearInterval(interval);
                    reject(new Error("ProjectManager not loaded within timeout"));
                }
            }, 50);
        });
    }

    waitForProjectManager().then(ProjectManager => {

        // ------------------------------
        // DOM References
        // ------------------------------
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

        // ------------------------------
        // NLP Input Handler
        // ------------------------------
        async function handleInput(userInput) {
            logMessage(`> ${userInput}`);
            const text = userInput.trim();

            // --- Step 1: Name Game ---
            if (!convo.gameNamed && convo.nextPrompt === "name_game") {
                const m = text.match(/^name\s+game\s+"?([^"]+)"?/i);
                if (m) {
                    const name = m[1];
                    convo.gameNamed = true;
                    ProjectManager.projectName = name;
                    logMessage(`Game named '${name}'.`);
                    convo.nextPrompt = "set_concept";
                    logMessage('Please set your game concept: set concept "<description>"');
                    return;
                } else {
                    logMessage('Please name your game using: name game "<Name>"');
                    return;
                }
            }

            // --- Step 2: Set Concept ---
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
                    logMessage('Please set your game concept using: set concept "<description>"');
                    return;
                }
            }

            // --- Step 3: Create Scene ---
            if (convo.nextPrompt === "create_scene") {
                const m = text.match(/^create\s+scene\s+(\w+)/i);
                if (m) {
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

            // --- Default: Pass to ProjectManager NLP ---
            const result = await ProjectManager.process_nlp_command(text);
            logMessage(result);
        }

        // ------------------------------
        // Send Handler
        // ------------------------------
        function sendNLPCommandGUI() {
            const cmd = nlpInput.value.trim();
            if (!cmd) return;
            nlpInput.value = "";
            handleInput(cmd);
        }

        nlpSend.addEventListener("click", sendNLPCommandGUI);
        nlpInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") sendNLPCommandGUI();
        });

        // ------------------------------
        // Initial Prompt
        // ------------------------------
        logMessage("Hello! What would you like to do?");
        logMessage('Start by naming your game: name game "<Name>"');

        console.log("Godot interactive chat initialized.");

    }).catch(err => {
        console.error("godot.js initialization failed:", err);
        alert("Error: ProjectManager not loaded. Check your script order.");
    });

})();
