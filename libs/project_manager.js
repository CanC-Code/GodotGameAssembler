// libs/project_manager.js
// Author: CCVO
// Purpose: Connect Godot Game Assembler UI to ProjectManager

(function () {

    if (!window.ProjectManager) throw new Error("ProjectManager not loaded");

    const pm = window.ProjectManager;

    // ------------------------------
    // DOM References
    // ------------------------------
    const projectTreeEl = document.getElementById("project-tree");
    const fileInfoEl = document.getElementById("file-info");
    const filePreviewEl = document.getElementById("file-preview");
    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");
    const nlpLog = document.getElementById("nlp-log");

    // ------------------------------
    // Project Tree Rendering
    // ------------------------------
    function renderProjectTree() {
        const scenes = pm.getScenes();
        projectTreeEl.innerHTML = "";

        if (scenes.length === 0) {
            projectTreeEl.innerHTML = "<em>No scenes</em>";
            return;
        }

        scenes.forEach(scene => {
            const sceneItem = document.createElement("div");
            sceneItem.classList.add("tree-item");
            sceneItem.textContent = scene;
            sceneItem.addEventListener("click", () => selectScene(scene));
            projectTreeEl.appendChild(sceneItem);
        });
    }

    function selectScene(sceneName) {
        // Highlight selected
        Array.from(projectTreeEl.children).forEach(el => el.classList.remove("selected"));
        const selected = Array.from(projectTreeEl.children).find(el => el.textContent === sceneName);
        if (selected) selected.classList.add("selected");

        // Show info
        const scene = pm.getSceneFile(sceneName);
        if (!scene) return;

        fileInfoEl.innerHTML = `<strong>Scene:</strong> ${sceneName}<br>
            <strong>Nodes:</strong> ${Object.keys(scene.nodes).length}`;

        // Preview placeholder (for now)
        filePreviewEl.innerHTML = `<em>Scene preview not implemented yet.</em>`;
    }

    // ------------------------------
    // NLP Command Handling
    // ------------------------------
    async function sendNLPCommandGUI() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpLog.innerHTML += `> ${cmd}\n`;
        nlpInput.value = "";

        if (pm) {
            const result = await pm.process_nlp_command(cmd);
            nlpLog.innerHTML += `${result}\n`;
            nlpLog.scrollTop = nlpLog.scrollHeight;

            // After command, refresh project tree
            renderProjectTree();
        } else {
            nlpLog.innerHTML += "ProjectManager not loaded.\n";
        }
    }

    nlpSend.addEventListener("click", sendNLPCommandGUI);
    nlpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendNLPCommandGUI();
    });

    // ------------------------------
    // Initial Rendering
    // ------------------------------
    renderProjectTree();

})();