// libs/godot.js
// Author: CCVO
// Purpose: Integrates ProjectManager with GUI and NLP for GodotGameAssembler

(function () {

    if (!window.ProjectManager) throw new Error("ProjectManager not loaded");

    const projectTree = document.getElementById("project-tree");
    const fileInfo = document.getElementById("file-info");
    const filePreview = document.getElementById("file-preview");
    const nlpLog = document.getElementById("nlp-log");
    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");

    let selectedItem = null;

    // -------------------------------
    // Project Tree Rendering
    // -------------------------------
    function renderProjectTree() {
        const scenes = ProjectManager.get_scenes();
        projectTree.innerHTML = "";

        if (scenes.length === 0) {
            projectTree.innerHTML = "<em>No scenes</em>";
            return;
        }

        scenes.forEach(sceneName => {
            const div = document.createElement("div");
            div.textContent = sceneName;
            div.classList.add("tree-item");
            div.dataset.type = "scene";
            div.dataset.name = sceneName;

            div.addEventListener("click", () => selectItem(div));
            projectTree.appendChild(div);

            // Render nodes inside the scene
            const nodes = ProjectManager.get_scene_file(sceneName).nodes;
            for (const nodeName in nodes) {
                const ndiv = document.createElement("div");
                ndiv.textContent = `  └─ ${nodeName} (${nodes[nodeName].type})`;
                ndiv.classList.add("tree-item");
                ndiv.dataset.type = "node";
                ndiv.dataset.scene = sceneName;
                ndiv.dataset.name = nodeName;
                ndiv.style.paddingLeft = "20px";
                ndiv.addEventListener("click", () => selectItem(ndiv));
                projectTree.appendChild(ndiv);
            }
        });
    }

    // -------------------------------
    // Item Selection
    // -------------------------------
    function selectItem(div) {
        document.querySelectorAll(".tree-item").forEach(i => i.classList.remove("selected"));
        div.classList.add("selected");
        selectedItem = div;

        const type = div.dataset.type;

        if (type === "scene") {
            const sceneData = ProjectManager.get_scene_file(div.dataset.name);
            fileInfo.innerHTML = `<b>Scene:</b> ${div.dataset.name} <br>Nodes: ${Object.keys(sceneData.nodes).length}`;
            filePreview.innerHTML = "<em>Scene preview placeholder</em>";
        } else if (type === "node") {
            const nodeData = ProjectManager.get_scene_file(div.dataset.scene).nodes[div.dataset.name];
            fileInfo.innerHTML = `<b>Node:</b> ${div.dataset.name} <br>Type: ${nodeData.type} <br>Parent: ${nodeData.parent || "None"} <br>Scripts: ${nodeData.scripts.join(", ") || "None"}`;
            filePreview.innerHTML = "<em>Node preview placeholder</em>";
        }
    }

    // -------------------------------
    // NLP Integration
    // -------------------------------
    async function processCommand(cmd) {
        if (!cmd) return;
        nlpLog.innerHTML += `> ${cmd}\n`;
        nlpInput.value = "";

        const result = await ProjectManager.process_nlp_command(cmd);
        nlpLog.innerHTML += `${result}\n`;
        nlpLog.scrollTop = nlpLog.scrollHeight;

        renderProjectTree();
    }

    nlpSend.addEventListener("click", () => processCommand(nlpInput.value.trim()));
    nlpInput.addEventListener("keydown", e => {
        if (e.key === "Enter") processCommand(nlpInput.value.trim());
    });

    // -------------------------------
    // Initialize
    // -------------------------------
    renderProjectTree();
    console.log("Godot GUI integrated and initialized.");

})();