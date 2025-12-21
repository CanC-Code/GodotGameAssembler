// libs/godot.js
// Author: CCVO
// Purpose: Hybrid NLP chat + command interface for Godot Game Assembler
// Integrated with ProjectManager, ProjectGraph, assets, and file/folder views

(function () {

    if (!window.ProjectManager) throw new Error("ProjectManager not loaded");
    if (!window.ProjectGraph) throw new Error("ProjectGraph not loaded");

    // ------------------------------
    // DOM Elements
    // ------------------------------
    const projectTreeEl = document.getElementById("project-tree");
    const fileInfoEl = document.getElementById("file-info");
    const filePreviewEl = document.getElementById("file-preview");
    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");
    const nlpLog = document.getElementById("nlp-log");

    // ------------------------------
    // Utilities
    // ------------------------------
    function appendLog(message, type = "system") {
        const div = document.createElement("div");
        div.className = `chat-message ${type}`;
        div.textContent = message;
        nlpLog.appendChild(div);
        nlpLog.scrollTop = nlpLog.scrollHeight;
    }

    function refreshProjectTree() {
        const scenes = ProjectManager.get_scenes();
        projectTreeEl.innerHTML = "";

        if (!scenes.length) {
            projectTreeEl.innerHTML = "<em>No scenes</em>";
            return;
        }

        scenes.forEach(sceneName => {
            const sceneEl = document.createElement("div");
            sceneEl.className = "tree-item";
            sceneEl.textContent = sceneName;
            sceneEl.onclick = () => displaySceneInfo(sceneName);
            projectTreeEl.appendChild(sceneEl);
        });
    }

    function displaySceneInfo(sceneName) {
        const scene = ProjectManager.get_scene_file(sceneName);
        if (!scene) return;

        fileInfoEl.innerHTML = `Scene: ${sceneName}\nNodes: ${Object.keys(scene.nodes).length}`;
        filePreviewEl.innerHTML = `<em>Scene preview placeholder</em>`;
    }

    // ------------------------------
    // NLP Chat / Command Handler
    // ------------------------------
    async function processNLPInput(input) {
        if (!input) return;

        appendLog(`> ${input}`, "user");

        if (!ProjectManager) {
            appendLog("ProjectManager not loaded.", "system");
            return;
        }

        // Detect if input is a known command
        const commandRegex = /^(create|add|attach|list|export)\b/i;
        if (commandRegex.test(input)) {
            // Process as command
            try {
                const result = await ProjectManager.process_nlp_command(input);
                appendLog(result, "command");
                refreshProjectTree();
            } catch (err) {
                appendLog(`Command error: ${err.message}`, "system");
            }
        } else {
            // Process as chat / game conversation
            const chatResponse = generateChatResponse(input);
            appendLog(chatResponse, "system");
        }
    }

    // ------------------------------
    // Simple Chat / Game Brainstorm Engine
    // ------------------------------
    function generateChatResponse(input) {
        input = input.toLowerCase();

        if (input.includes("name") && input.includes("game")) {
            return "Suggested name: 'Galactic Pioneers'. You can create a main scene using 'create scene MainScene'.";
        }

        if (input.includes("idea") || input.includes("concept")) {
            return "Idea: A voxel-based space exploration game. Start by creating a 'MainScene' and adding a Player node.";
        }

        if (input.includes("build") || input.includes("start")) {
            return "You can add a scene using 'create scene <SceneName>' and then add nodes and scripts.";
        }

        return "Let's keep brainstorming! Ask me to name your game, expand its concept, or create a scene.";
    }

    // ------------------------------
    // Event Listeners
    // ------------------------------
    nlpSend.addEventListener("click", () => processNLPInput(nlpInput.value.trim()));
    nlpInput.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            processNLPInput(nlpInput.value.trim());
            nlpInput.value = "";
        }
    });

    // ------------------------------
    // Initial Setup
    // ------------------------------
    refreshProjectTree();
    appendLog("NLP interface ready. Type 'help' for commands or start chatting about your game.", "system");

    console.log("Godot.js loaded: NLP + command interface initialized.");

})();