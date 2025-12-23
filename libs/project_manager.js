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

    let selectedScene = null;
    let selectedFolder = null;
    let selectedAsset = null;

    // ------------------------------
    // Project Tree Rendering
    // ------------------------------
    function renderProjectTree() {
        projectTreeEl.innerHTML = "";

        // Scenes
        const scenes = pm.getScenes();
        const sceneHeader = document.createElement("div");
        sceneHeader.classList.add("tree-header");
        sceneHeader.textContent = "Scenes";
        projectTreeEl.appendChild(sceneHeader);

        if (scenes.length === 0) {
            const none = document.createElement("div");
            none.classList.add("tree-item");
            none.innerHTML = "<em>No scenes</em>";
            projectTreeEl.appendChild(none);
        } else {
            scenes.forEach(scene => {
                const sceneItem = document.createElement("div");
                sceneItem.classList.add("tree-item");
                sceneItem.textContent = scene;
                sceneItem.addEventListener("click", () => selectScene(scene));
                projectTreeEl.appendChild(sceneItem);
            });
        }

        // Folders
        const folders = Object.keys(pm.graph?.folders || {});
        if (folders.length > 0) {
            const folderHeader = document.createElement("div");
            folderHeader.classList.add("tree-header");
            folderHeader.textContent = "Folders";
            projectTreeEl.appendChild(folderHeader);

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

        highlightSelected();
    }

    // ------------------------------
    // Selection Handling
    // ------------------------------
    function highlightSelected() {
        Array.from(projectTreeEl.children).forEach(el => el.classList.remove("selected"));

        Array.from(projectTreeEl.children).forEach(el => {
            if (selectedScene && el.textContent === selectedScene) el.classList.add("selected");
            if (selectedFolder && el.textContent.startsWith(pm.graph?.folders[selectedFolder]?.name + "/")) el.classList.add("selected");
            if (selectedAsset && el.textContent === pm.graph.getAsset(selectedAsset)?.name) el.classList.add("selected");
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

            const nodeCount = Object.keys(scene.nodes || {}).length;
            fileInfoEl.innerHTML = `<strong>Scene:</strong> ${selectedScene}<br>
                <strong>Nodes:</strong> ${nodeCount}`;
            filePreviewEl.innerHTML = `<em>Scene preview not implemented yet.</em>`;
        }
        else if (selectedFolder) {
            const contents = pm.graph.getFolderContents(selectedFolder);
            const fileCount = contents.files.length;
            const folderCount = contents.subfolders.length;

            fileInfoEl.innerHTML = `<strong>Folder:</strong> ${selectedFolder}<br>
                <strong>Files:</strong> ${fileCount}<br>
                <strong>Subfolders:</strong> ${folderCount}`;

            if (fileCount > 0) {
                const fileList = document.createElement("ul");
                contents.files.forEach(f => {
                    const li = document.createElement("li");
                    li.textContent = f.name + " (" + f.extension + ")";
                    li.addEventListener("click", () => selectAsset(f.name));
                    fileList.appendChild(li);
                });
                filePreviewEl.appendChild(fileList);
            } else {
                filePreviewEl.innerHTML = "<em>No files to preview</em>";
            }
        }
        else if (selectedAsset) {
            const asset = pm.graph.getAsset(selectedAsset);
            if (!asset) return;

            fileInfoEl.innerHTML = `<strong>Asset:</strong> ${asset.name}<br>
                <strong>Type:</strong> ${asset.type}<br>
                <strong>Extension:</strong> ${asset.extension}<br>
                <strong>Folder:</strong> ${asset.folder || "root"}`;

            if (["jpg", "jpeg", "png", "gif"].includes(asset.extension.toLowerCase())) {
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
    // Initial Rendering
    // ------------------------------
    renderProjectTree();
    updateInfoPanel();

    // Expose globals
    window.renderProjectTree = renderProjectTree;
    window.updateInfoPanel = updateInfoPanel;
    window.selectScene = selectScene;
    window.selectFolder = selectFolder;
    window.selectAsset = selectAsset;
})();
