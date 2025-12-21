// libs/godot.js
// Author: CCVO
// Purpose: GUI integration for GodotGameAssembler

(function () {

    const projectTree = document.getElementById("project-tree");
    const fileInfo = document.getElementById("file-info");
    const filePreview = document.getElementById("file-preview");
    const nlpLog = document.getElementById("nlp-log");
    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");

    function updateProjectTree() {
        if (!window.ProjectManager) return;
        const scenes = ProjectManager.get_scenes();
        if (!scenes.length) {
            projectTree.innerHTML = "<em>No scenes</em>";
            return;
        }

        projectTree.innerHTML = "";
        scenes.forEach(scene => {
            const div = document.createElement("div");
            div.textContent = scene;
            div.classList.add("tree-item");
            div.onclick = () => selectScene(scene);
            projectTree.appendChild(div);
        });
    }

    function selectScene(scene) {
        const s = ProjectManager.get_scene_file(scene);
        fileInfo.innerHTML = `<strong>Scene:</strong> ${scene}<br>Nodes: ${Object.keys(s.nodes).length}`;
        filePreview.innerHTML = Object.entries(s.nodes).map(([name, n]) => `${n.type}: ${name}`).join("<br>");
    }

    async function sendNLPCommandGUI() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpLog.innerHTML += `> ${cmd}\n`;
        nlpInput.value = "";

        if (window.ProjectManager) {
            const result = await ProjectManager.process_nlp_command(cmd);
            nlpLog.innerHTML += `${result}\n`;
            nlpLog.scrollTop = nlpLog.scrollHeight;
            updateProjectTree();
        } else {
            nlpLog.innerHTML += "ProjectManager not loaded.\n";
        }
    }

    nlpSend.addEventListener("click", sendNLPCommandGUI);
    nlpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendNLPCommandGUI();
    });

    // Initial render
    updateProjectTree();

})();