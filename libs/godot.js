// libs/godot.js
// Author: CCVO
// Purpose: Fully dynamic UI bridge for GodotGameAssembler
// Top-left: Project tree, top-right: info + preview, bottom: NLP

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

        if (window.ProjectManager) {
            const result = await ProjectManager.process_nlp_command(cmd);
            nlpLog.innerHTML += `${result}\n`;
            nlpLog.scrollTop = nlpLog.scrollHeight;
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
    // PROJECT TREE
    // ------------------------------
    function createTreeItem(name, type, parentEl, clickHandler) {
        const el = document.createElement("div");
        el.textContent = name;
        el.classList.add("tree-item");
        el.dataset.type = type;

        el.addEventListener("click", (e) => {
            e.stopPropagation();
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
            showPlaceholder();
            return;
        }

        // Render scenes
        scenes.forEach(sceneName => {
            const sceneEl = createTreeItem(sceneName, "scene", projectTreeEl, () => {
                showSceneInfo(sceneName);
            });

            const sceneObj = ProjectManager.get_scene_file(sceneName) || { nodes: {} };
            const nodes = sceneObj.nodes || {};

            if (Object.keys(nodes).length > 0) {
                const nodeContainer = document.createElement("div");
                nodeContainer.style.paddingLeft = "1em";
                sceneEl.appendChild(nodeContainer);

                Object.keys(nodes).forEach(nodeName => {
                    const node = nodes[nodeName];
                    createTreeItem(nodeName + ` (${node.type})`, "node", nodeContainer, () => {
                        showNodeInfo(sceneName, nodeName);
                    });
                });
            }
        });

        // Render folders and assets if ProjectManager has graph.folders
        const graph = ProjectManager.graph || ProjectManager;
        if (graph.folders) {
            Object.keys(graph.folders).forEach(folderPath => {
                const folder = graph.folders[folderPath];
                const folderEl = createTreeItem(folder.name + ` (Folder, ${folder.files.length} files)`, "folder", projectTreeEl, () => {
                    showFolderInfo(folderPath);
                });

                const folderContainer = document.createElement("div");
                folderContainer.style.paddingLeft = "1em";
                folderEl.appendChild(folderContainer);

                folder.files.forEach(filePath => {
                    const asset = graph.assets[filePath];
                    if (!asset) return;
                    createTreeItem(asset.name + ` (${asset.extension})`, "file", folderContainer, () => {
                        showFileInfo(filePath);
                    });
                });
            });
        }
    }

    // ------------------------------
    // INFO / PREVIEW PANEL
    // ------------------------------
    function showPlaceholder() {
        fileInfoEl.innerHTML = "<em>No file selected</em>";
        filePreviewEl.innerHTML = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:#888;">Viewport Placeholder</div>`;
    }

    function showSceneInfo(sceneName) {
        const scene = ProjectManager.get_scene_file(sceneName);
        if (!scene) return showPlaceholder();

        fileInfoEl.innerHTML = `<strong>Scene:</strong> ${sceneName}<br>Nodes: ${Object.keys(scene.nodes || {}).length}`;
        showPlaceholder();
    }

    function showNodeInfo(sceneName, nodeName) {
        const node = ProjectManager.getNode(sceneName, nodeName);
        if (!node) return showSceneInfo(sceneName);

        fileInfoEl.innerHTML =
            `<strong>Node:</strong> ${nodeName}<br>` +
            `<strong>Type:</strong> ${node.type}<br>` +
            `<strong>Parent:</strong> ${node.parent || "(none)"}<br>` +
            `<strong>Scripts:</strong> ${node.scripts.join(", ") || "(none)"}`;

        showPlaceholder();
    }

    function showFolderInfo(folderPath) {
        const graph = ProjectManager.graph || ProjectManager;
        const folder = graph.getFolderContents(folderPath);
        if (!folder) return showPlaceholder();

        fileInfoEl.innerHTML =
            `<strong>Folder:</strong> ${folderPath}<br>` +
            `<strong>Files:</strong> ${folder.files.length}<br>` +
            `<strong>Subfolders:</strong> ${folder.subfolders?.length || 0}`;

        showPlaceholder();
    }

    function showFileInfo(filePath) {
        const graph = ProjectManager.graph || ProjectManager;
        const asset = graph.getAsset(filePath);
        if (!asset) return showPlaceholder();

        fileInfoEl.innerHTML =
            `<strong>File:</strong> ${asset.name}<br>` +
            `<strong>Type:</strong> ${asset.type}<br>` +
            `<strong>Extension:</strong> ${asset.extension}<br>` +
            `<strong>Folder:</strong> ${asset.folder || "(none)"}`;

        // Display image preview or placeholder for 3D models
        if (asset.extension.match(/\.(jpg|jpeg|png)$/i) && asset.data) {
            filePreviewEl.innerHTML = `<img src="${asset.data}" style="max-width:100%; max-height:100%;">`;
        } else if (asset.extension.match(/\.(gltf|glb|vox)$/i)) {
            filePreviewEl.innerHTML = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:#888;">3D Model Placeholder</div>`;
        } else {
            showPlaceholder();
        }
    }

    // ------------------------------
    // INITIAL RENDER
    // ------------------------------
    renderProjectTree();

})();