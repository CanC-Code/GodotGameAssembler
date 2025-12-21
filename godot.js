// libs/godot.js
// Author: CCVO
// Purpose: Connect ProjectManager + NLP + dynamic UI with assets, folders, and placeholder viewport

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

        renderProjectTree();
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
        const graph = ProjectManager.graph || ProjectManager;

        if (scenes.length === 0) {
            projectTreeEl.innerHTML = "<em>No scenes</em>";
            fileInfoEl.innerHTML = "<em>No file selected</em>";
            filePreviewEl.innerHTML = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:#888;">Viewport Placeholder</div>`;
            return;
        }

        // Scenes
        scenes.forEach(sceneName => {
            const sceneEl = createTreeItem(sceneName, "scene", projectTreeEl, (name) => {
                showSceneInfo(name);
            });

            const sceneObj = ProjectManager.get_scene_file(sceneName) || {};
            const nodes = sceneObj.nodes || {};

            // Nodes
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

        // Folders
        const folders = Object.keys(ProjectManager.graph?.folders || {});
        folders.forEach(folderPath => {
            const folder = ProjectManager.graph.folders[folderPath];
            const folderEl = createTreeItem(folder.name + ` (Folder, ${folder.files.length} files)`, "folder", projectTreeEl, () => {
                showFolderInfo(folderPath);
            });

            const folderContainer = document.createElement("div");
            folderContainer.style.paddingLeft = "1em";
            folderEl.appendChild(folderContainer);

            // Files
            folder.files.forEach(filePath => {
                const asset = ProjectManager.graph.assets[filePath];
                createTreeItem(asset.name + ` (${asset.extension})`, "file", folderContainer, () => {
                    showFileInfo(filePath);
                });
            });
        });
    }

    // ------------------------------
    // INFO / PREVIEW
    // ------------------------------
    function showSceneInfo(sceneName) {
        const scene = ProjectManager.get_scene_file(sceneName);
        if (!scene) {
            fileInfoEl.innerHTML = "<em>No data</em>";
            filePreviewEl.innerHTML = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:#888;">Viewport Placeholder</div>`;
            return;
        }

        fileInfoEl.innerHTML = `<strong>Scene:</strong> ${sceneName}<br>Nodes: ${Object.keys(scene.nodes || {}).length}`;
        filePreviewEl.innerHTML = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:#888;">Viewport Placeholder</div>`;
    }

    function showNodeInfo(sceneName, nodeName) {
        const node = ProjectManager.getNode(sceneName, nodeName);
        if (!node) return showSceneInfo(sceneName);

        fileInfoEl.innerHTML =
            `<strong>Node:</strong> ${nodeName}<br>` +
            `<strong>Type:</strong> ${node.type}<br>` +
            `<strong>Parent:</strong> ${node.parent || "(none)"}<br>` +
            `<strong>Scripts:</strong> ${node.scripts.join(", ") || "(none)"}`;

        filePreviewEl.innerHTML = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:#888;">Viewport Placeholder</div>`;
    }

    function showFolderInfo(folderPath) {
        const folder = ProjectManager.graph.getFolderContents(folderPath);
        if (!folder) {
            fileInfoEl.innerHTML = "<em>No folder data</em>";
            filePreviewEl.innerHTML = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:#888;">Viewport Placeholder</div>`;
            return;
        }

        fileInfoEl.innerHTML =
            `<strong>Folder:</strong> ${folderPath}<br>` +
            `<strong>Files:</strong> ${folder.files.length}<br>` +
            `<strong>Subfolders:</strong> ${folder.subfolders.length}`;

        filePreviewEl.innerHTML = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:#888;">Viewport Placeholder</div>`;
    }

    function showFileInfo(filePath) {
        const asset = ProjectManager.graph.getAsset(filePath);
        if (!asset) return;

        fileInfoEl.innerHTML =
            `<strong>File:</strong> ${asset.name}<br>` +
            `<strong>Type:</strong> ${asset.type}<br>` +
            `<strong>Extension:</strong> ${asset.extension}<br>` +
            `<strong>Folder:</strong> ${asset.folder || "(none)"}`;

        if (asset.extension.match(/\.(jpg|png|jpeg)$/i) && asset.data) {
            filePreviewEl.innerHTML = `<img src="${asset.data}" style="max-width:100%; max-height:100%;">`;
        } else {
            filePreviewEl.innerHTML = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:#888;">Viewport Placeholder</div>`;
        }
    }

    // ------------------------------
    // INITIAL RENDER
    // ------------------------------
    renderProjectTree();

})();