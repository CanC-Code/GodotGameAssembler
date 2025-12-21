// libs/project_manager.js
// Author: CCVO
// Purpose: Connect Godot Game Assembler UI to ProjectManager with dynamic info panel

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

    // Track selected scene / folder / asset
    let selectedScene = null;
    let selectedFolder = null;
    let selectedAsset = null;

    // ------------------------------
    // Project Tree Rendering
    // ------------------------------
    function renderProjectTree() {
        projectTreeEl.innerHTML = "";

        const scenes = pm.getScenes();
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

        // Optionally, list folders
        const folders = Object.keys(pm.graph?.folders || {});
        folders.forEach(folderPath => {
            const folder = pm.graph.folders[folderPath];
            const folderItem = document.createElement("div");
            folderItem.classList.add("tree-item");
            folderItem.textContent = folder.name + "/";
            folderItem.style.fontStyle = "italic";
            folderItem.addEventListener("click", () => selectFolder(folderPath));
            projectTreeEl.appendChild(folderItem);
        });
    }

    // ------------------------------
    // Selection Handling
    // ------------------------------
    function highlightSelected() {
        Array.from(projectTreeEl.children).forEach(el => el.classList.remove("selected"));
        Array.from(projectTreeEl.children).forEach(el => {
            if (el.textContent === selectedScene ||
                el.textContent.startsWith(pm.graph?.folders[selectedFolder]?.name + "/")) {
                el.classList.add("selected");
            }
        });
    }

    function selectScene(sceneName) {
        selectedScene = sceneName;
        selectedFolder = null;
        selectedAsset = null;

        highlightSelected();
        updateInfoPanel();
    }

    function selectFolder(folderPath) {
        selectedFolder = folderPath;
        selectedScene = null;
        selectedAsset = null;

        highlightSelected();
        updateInfoPanel();
    }

    function selectAsset(assetPath) {
        selectedAsset = assetPath;
        selectedScene = null;
        selectedFolder = null;

        highlightSelected();
        updateInfoPanel();
    }

    // ------------------------------
    // Info Panel Updates
    // ------------------------------
    function updateInfoPanel() {
        fileInfoEl.innerHTML = "";
        filePreviewEl.innerHTML = "";

        if (selectedScene) {
            const scene = pm.getSceneFile(selectedScene);
            if (!scene) return;

            fileInfoEl.innerHTML = `<strong>Scene:</strong> ${selectedScene}<br>
                <strong>Nodes:</strong> ${Object.keys(scene.nodes).length}`;

            filePreviewEl.innerHTML = `<em>Scene preview not implemented yet.</em>`;
        }

        else if (selectedFolder) {
            const contents = pm.graph.getFolderContents(selectedFolder);
            const fileCount = contents.files.length;
            const folderCount = contents.subfolders.length;

            fileInfoEl.innerHTML = `<strong>Folder:</strong> ${selectedFolder}<br>
                <strong>Files:</strong> ${fileCount}<br>
                <strong>Subfolders:</strong> ${folderCount}`;

            filePreviewEl.innerHTML = "<em>Folder preview not implemented yet.</em>";
        }

        else if (selectedAsset) {
            const asset = pm.graph.getAsset(selectedAsset);
            if (!asset) return;

            fileInfoEl.innerHTML = `<strong>Asset:</strong> ${asset.name}<br>
                <strong>Type:</strong> ${asset.type}<br>
                <strong>Extension:</strong> ${asset.extension}<br>
                <strong>Folder:</strong> ${asset.folder || "root"}`;

            if (["jpg", "png", "jpeg", "gif"].includes(asset.extension.toLowerCase())) {
                filePreviewEl.innerHTML = `<img src="${asset.data}" style="max-width:100%; max-height:100%;" />`;
            } else {
                filePreviewEl.innerHTML = `<em>Preview not available for this type.</em>`;
            }
        }

        else {
            fileInfoEl.innerHTML = "<em>No selection</em>";
            filePreviewEl.innerHTML = "<em>Preview will appear here</em>";
        }
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

            // Refresh tree after changes
            renderProjectTree();
            updateInfoPanel();
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
    updateInfoPanel();

})();