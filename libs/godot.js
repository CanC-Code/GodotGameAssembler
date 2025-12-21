// libs/godot.js
// Author: CCVO
// Purpose: Interactive GodotGameAssembler frontend logic
// Handles NLP console, guided game creation, project tree updates

(function () {

    // ------------------------------
    // Core references
    // ------------------------------
    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");
    const nlpLog = document.getElementById("nlp-log");
    const projectTreeEl = document.getElementById("project-tree");
    const fileInfoEl = document.getElementById("file-info");
    const filePreviewEl = document.getElementById("file-preview");

    const PM = window.ProjectManager;

    if (!PM) throw new Error("ProjectManager not loaded");

    // ------------------------------
    // Utility
    // ------------------------------
    function escapeHTML(str) {
        return str.replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;");
    }

    // ------------------------------
    // Guided NLP Interpreter
    // ------------------------------
    async function interpretCommand(cmd) {
        cmd = cmd.trim();

        if (!PM.gameState) PM.gameState = { step: "askName" };

        // Step 1: Ask for game name
        if (PM.gameState.step === "askName") {
            PM.gameName = cmd;
            PM.gameState.step = "askConcept";
            return `Game named "${cmd}".\nDescribe the concept of your game:`;
        }

        // Step 2: Ask for concept
        if (PM.gameState.step === "askConcept") {
            PM.gameConcept = cmd;
            PM.gameState.step = "ready";
            return `Concept set: "${cmd}".\nYou can now create scenes, add nodes, buttons, thumbsticks, and scripts.\nType 'help' to see commands.`;
        }

        // Friendly NLP shortcuts
        if (cmd.toLowerCase().startsWith("name game ")) {
            PM.gameName = cmd.substr(10).trim();
            return `Game named "${PM.gameName}".`;
        }
        if (cmd.toLowerCase().startsWith("set concept ")) {
            PM.gameConcept = cmd.substr(12).trim();
            return `Concept set: "${PM.gameConcept}".`;
        }

        // Delegate to ProjectManager
        const result = await PM.process_nlp_command(cmd);
        return result;
    }

    // ------------------------------
    // Project Tree UI
    // ------------------------------
    function buildTree() {
        if (!PM) return;

        const scenes = PM.get_scenes();
        if (!scenes.length) {
            projectTreeEl.innerHTML = `<em>No scenes</em>`;
            return;
        }

        projectTreeEl.innerHTML = "";
        scenes.forEach(sceneName => {
            const sceneNode = document.createElement("div");
            sceneNode.className = "tree-item";
            sceneNode.textContent = sceneName;
            sceneNode.onclick = () => selectScene(sceneName);
            projectTreeEl.appendChild(sceneNode);

            const sceneData = PM.get_scene_file(sceneName);
            if (sceneData && sceneData.nodes) {
                Object.keys(sceneData.nodes).forEach(nodeName => {
                    const nodeEl = document.createElement("div");
                    nodeEl.className = "tree-item";
                    nodeEl.style.paddingLeft = "15px";
                    nodeEl.textContent = nodeName + " (" + sceneData.nodes[nodeName].type + ")";
                    nodeEl.onclick = () => selectNode(sceneName, nodeName);
                    projectTreeEl.appendChild(nodeEl);
                });
            }
        });
    }

    function selectScene(sceneName) {
        const sceneData = PM.get_scene_file(sceneName);
        fileInfoEl.innerHTML = `<strong>Scene:</strong> ${sceneName}<br>
            <strong>Nodes:</strong> ${Object.keys(sceneData.nodes).length}`;
        filePreviewEl.innerHTML = `<em>Preview unavailable (3D / UI not implemented yet)</em>`;
    }

    function selectNode(sceneName, nodeName) {
        const node = PM.get_scene_file(sceneName).nodes[nodeName];
        fileInfoEl.innerHTML = `<strong>Scene:</strong> ${sceneName}<br>
            <strong>Node:</strong> ${nodeName}<br>
            <strong>Type:</strong> ${node.type}<br>
            <strong>Children:</strong> ${node.children.join(", ") || "none"}<br>
            <strong>Scripts:</strong> ${node.scripts.join(", ") || "none"}`;
        filePreviewEl.innerHTML = `<em>Preview unavailable (3D / UI not implemented yet)</em>`;
    }

    // ------------------------------
    // NLP Input Handler
    // ------------------------------
    async function sendNLPCommandGUI() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpLog.innerHTML += `> ${escapeHTML(cmd)}\n`;
        nlpInput.value = "";

        try {
            const result = await interpretCommand(cmd);
            nlpLog.innerHTML += `${escapeHTML(result)}\n`;
        } catch (err) {
            nlpLog.innerHTML += `Error: ${escapeHTML(err.message)}\n`;
        }

        nlpLog.scrollTop = nlpLog.scrollHeight;
        buildTree();
    }

    nlpSend.addEventListener("click", sendNLPCommandGUI);
    nlpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendNLPCommandGUI();
    });

    // ------------------------------
    // Initialize console
    // ------------------------------
    nlpLog.innerHTML = "Welcome to Godot Game Assembler!\nWhat is the name of your game?\n";

    // Initial tree build
    buildTree();

    console.log("Godot interactive frontend loaded.");
})();