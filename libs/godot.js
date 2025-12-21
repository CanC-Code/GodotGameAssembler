// libs/godot.js
// Author: CCVO
// Purpose: Interactive Godot Game Assembler chat interface

(function() {

    if (!window.ProjectManager) throw new Error("ProjectManager not loaded");
    const pm = window.ProjectManager;

    // ------------------------------
    // DOM Elements
    // ------------------------------
    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");
    const nlpLog = document.getElementById("nlp-log");

    // ------------------------------
    // Game Metadata
    // ------------------------------
    pm.game = {
        name: null,
        concept: null
    };

    // ------------------------------
    // Greeting / Interactive Prompt
    // ------------------------------
    function greetUser() {
        nlpLog.innerHTML +=
            `Hello! What would you like to do?\n` +
            `Start by naming your game using: name game "<Your Game Name>"\n`;
        nlpLog.scrollTop = nlpLog.scrollHeight;
    }

    // ------------------------------
    // Command Processor
    // ------------------------------
    pm.process_nlp_command = async function(command) {
        const cmd = command.trim();

        // Name game
        if (cmd.toLowerCase().startsWith("name game")) {
            const match = cmd.match(/name game\s+"(.+)"/i);
            if (match) {
                pm.game.name = match[1];
                return `Game named '${pm.game.name}'. You can now set its concept using: set concept "<Concept>"`;
            } else {
                return 'Invalid format. Example: name game "Snake"';
            }
        }

        // Set concept
        if (cmd.toLowerCase().startsWith("set concept")) {
            const match = cmd.match(/set concept\s+"(.+)"/i);
            if (match) {
                pm.game.concept = match[1];
                return `Concept set: "${pm.game.concept}". You can now create your first scene using: create scene <Name>`;
            } else {
                return 'Invalid format. Example: set concept "A simple snake game"';
            }
        }

        // Create scene
        if (cmd.toLowerCase().startsWith("create scene")) {
            const match = cmd.match(/create scene\s+(.+)/i);
            if (match) {
                const sceneName = match[1].trim();
                const success = pm.graph.addScene(sceneName);
                if (success) {
                    return `Scene '${sceneName}' created.`;
                } else {
                    return `Scene '${sceneName}' already exists.`;
                }
            } else {
                return 'Invalid format. Example: create scene intro';
            }
        }

        // Add node
        if (cmd.toLowerCase().startsWith("add node")) {
            const match = cmd.match(/add node\s+(\w+)\s+(\w+)\s+to\s+(\w+)/i);
            if (match) {
                const [, nodeName, nodeType, sceneName] = match;
                const success = pm.graph.addNode(sceneName, nodeName, nodeType);
                if (success) return `Node '${nodeName}' added to '${sceneName}'.`;
                else return `Failed to add node '${nodeName}' to '${sceneName}'.`;
            } else {
                return 'Invalid format. Example: add node Player Node2D to intro';
            }
        }

        // Attach script
        if (cmd.toLowerCase().startsWith("attach script")) {
            const match = cmd.match(/attach script\s+(\w+)\s+to\s+(\w+)\s+in\s+(\w+)/i);
            if (match) {
                const [, scriptName, nodeName, sceneName] = match;
                const success = pm.graph.attachScript(sceneName, nodeName, scriptName);
                if (success) return `Script '${scriptName}' attached to '${nodeName}' in '${sceneName}'.`;
                else return `Failed to attach script '${scriptName}' to '${nodeName}'.`;
            } else {
                return 'Invalid format. Example: attach script MoveScript to Player in intro';
            }
        }

        // List scenes
        if (cmd.toLowerCase() === "list scenes") {
            const scenes = pm.getScenes();
            if (scenes.length === 0) return "No scenes created yet.";
            return "Scenes:\n- " + scenes.join("\n- ");
        }

        // Export project
        if (cmd.toLowerCase().startsWith("export project")) {
            const match = cmd.match(/export project\s+(.+)/i);
            if (match) {
                const projectName = match[1].trim();
                try {
                    await pm.generate_project(projectName);
                    return `Project exported as '${projectName}.zip'`;
                } catch (err) {
                    return `Export failed: ${err.message}`;
                }
            } else {
                return 'Invalid format. Example: export project MyGame';
            }
        }

        // Help
        if (cmd.toLowerCase() === "help") {
            return `Commands:
- name game "<Name>"
- set concept "<Text>"
- create scene <Name>
- add node <Name> <Type> to <Scene>
- attach script <Script> to <Node> in <Scene>
- list scenes
- export project <Name>`;
        }

        return "Unrecognized command. Type 'help'.";
    };

    // ------------------------------
    // Connect NLP Input
    // ------------------------------
    async function sendNLPCommandGUI() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpLog.innerHTML += `> ${cmd}\n`;
        nlpInput.value = "";

        const result = await pm.process_nlp_command(cmd);
        nlpLog.innerHTML += `${result}\n`;
        nlpLog.scrollTop = nlpLog.scrollHeight;

        // Update project tree and info panel dynamically
        if (window.renderProjectTree) window.renderProjectTree();
        if (window.updateInfoPanel) window.updateInfoPanel();
    }

    nlpSend.addEventListener("click", sendNLPCommandGUI);
    nlpInput.addEventListener("keydown", e => {
        if (e.key === "Enter") sendNLPCommandGUI();
    });

    // ------------------------------
    // Initial Greeting
    // ------------------------------
    greetUser();

})();