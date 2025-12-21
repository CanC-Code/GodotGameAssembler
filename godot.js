// libs/godot.js
// Author: CCVO
// Purpose: Connect ProjectManager + NLP + dynamic UI

(function () {

    if (!window.ProjectManager) throw new Error("ProjectManager not loaded");

    const projectTreeEl = document.getElementById("project-tree");
    const fileInfoEl = document.getElementById("file-info");
    const filePreviewEl = document.getElementById("file-preview");
    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");
    const nlpLog = document.getElementById("nlp-log");

    // ------------------------------
    // NLP GUI
    // ------------------------------
    async function sendNLPCommandGUI() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpLog.innerHTML += `> ${cmd}\n`;
        nlpInput.value = "";

        const result = await ProjectManager.process_nlp_command(cmd);
        nlpLog.innerHTML += `${result}\n`;
        nlpLog.scrollTop = nlpLog.scrollHeight;

        renderProjectTree(); // update tree after any command
    }

    nlpSend.addEventListener("click", sendNLPCommandGUI);
    nlpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendNLPCommandGUI();
    });

    // ------------------------------
    // PROJECT TREE RENDERING
    // ------------------------------
    function createTreeItem(name, type, parentEl, clickHandler) {
        const el = document.createElement("div");
        el.textContent = name;
        el.classList.add("tree-item");
        el.dataset.type = type;

        el.addEventListener("click", () => {
            document.querySelectorAll(".tree-item.selected").forEach(s => s.classList.remove("selected"));
            el.classList.add("selected");
            if (clickHandler) clickHandler(name, type);
        });

        parentEl.appendChild(el);
        return el;
    }

    function renderProjectTree() {
        projectTreeEl.innerHTML = "";

        const scenes = ProjectManager.get_scenes();
        if (scenes.length === 0) {
            projectTreeEl.innerHTML = "<em>No scenes</em>";
            fileInfoEl.innerHTML = "<em>No file selected</em>";
            filePreviewEl.innerHTML = "<em>Preview will appear here</em>";
            return;
        }

        scenes.forEach(sceneName => {
            const sceneEl = createTreeItem(sceneName, "scene", projectTreeEl, (name) => {
                showSceneInfo(name);
            });

            // List nodes
            const sceneObj = ProjectManager.get_scene_file(sceneName);
            if (sceneObj && sceneObj.nodes) {
                const nodeContainer = document.createElement("div");
                nodeContainer.style.paddingLeft = "1em";
                sceneEl.appendChild(nodeContainer);

                Object.keys(sceneObj.nodes).forEach(nodeName => {
                    const nodeObj = sceneObj.nodes[nodeName];
                    createTreeItem(nodeName + ` (${nodeObj.type})`, "node", nodeContainer, () => {
                        showNodeInfo(sceneName, nodeName);
                    });
                });
            }
        });
    }

    // ------------------------------
    // FILE INFO / PREVIEW
    // ------------------------------
    function showSceneInfo(sceneName) {
        const scene = ProjectManager.get_scene_file(sceneName);
        if (!scene) return;

        fileInfoEl.innerHTML = `<strong>Scene:</strong> ${sceneName}<br>Nodes: ${Object.keys(scene.nodes).length}`;
        filePreviewEl.innerHTML = `<pre>${JSON.stringify(scene, null, 2)}</pre>`;
    }

    function showNodeInfo(sceneName, nodeName) {
        const scene = ProjectManager.get_scene_file(sceneName);
        if (!scene || !scene.nodes[nodeName]) return;

        const node = scene.nodes[nodeName];
        fileInfoEl.innerHTML =
            `<strong>Node:</strong> ${nodeName}<br>` +
            `<strong>Type:</strong> ${node.type}<br>` +
            `<strong>Parent:</strong> ${node.parent || "(none)"}<br>` +
            `<strong>Scripts:</strong> ${node.scripts.join(", ") || "(none)"}`;

        filePreviewEl.innerHTML = `<pre>${JSON.stringify(node, null, 2)}</pre>`;
    }

    // ------------------------------
    // INITIAL RENDER
    // ------------------------------
    renderProjectTree();

})();