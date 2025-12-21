// godot.js
// Handles GUI interactions for Godot Game Assembler

(function () {

    const pm = window.ProjectManager;
    if (!pm) throw new Error("ProjectManager not loaded");

    const nlpLog = document.getElementById("nlp-log");
    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");

    // ------------------------------
    // NLP Logging Helper
    // ------------------------------
    function logNLP(text, prefix = "> ") {
        nlpLog.textContent += `${prefix}${text}\n`;
        nlpLog.scrollTop = nlpLog.scrollHeight;
    }

    // ------------------------------
    // Send NLP Command
    // ------------------------------
    async function sendNLPCommand() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;

        logNLP(cmd);

        const result = await pm.process_nlp_command(cmd);
        logNLP(result, "");

        nlpInput.value = "";
        nlpInput.focus();

        // Optional: refresh project tree after changes
        renderProjectTree();
    }

    nlpSend.addEventListener("click", sendNLPCommand);

    nlpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendNLPCommand();
        }
    });

    // ------------------------------
    // Project Tree Rendering
    // ------------------------------
    const projectTreeEl = document.getElementById("project-tree");
    function renderProjectTree() {
        const scenes = pm.get_scenes();
        if (!scenes.length) {
            projectTreeEl.innerHTML = "<em>No scenes</em>";
            return;
        }

        projectTreeEl.innerHTML = "";
        scenes.forEach(sceneName => {
            const sceneItem = document.createElement("div");
            sceneItem.className = "tree-item";
            sceneItem.textContent = sceneName;

            sceneItem.addEventListener("click", () => {
                document.querySelectorAll(".tree-item").forEach(el => el.classList.remove("selected"));
                sceneItem.classList.add("selected");

                const sceneFile = pm.get_scene_file(sceneName);
                document.getElementById("file-info").textContent = sceneFile;
                document.getElementById("file-preview").textContent = sceneFile;
            });

            projectTreeEl.appendChild(sceneItem);
        });
    }

    // Initial render
    renderProjectTree();

})();