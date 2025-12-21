// libs/project_manager.js
// Author: CCVO
// Purpose: Connect Godot Game Assembler UI to ProjectManager with dynamic info panel, import/export support

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

    // Optional import/export buttons
    const importInput = document.getElementById("import-zip");
    const exportBtn = document.getElementById("export-btn");

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
        if (scenes.length === 0 && !Object.keys(pm.graph?.folders || {}).length) {
            projectTreeEl.innerHTML = "<em>No scenes or folders</em>";
        }

        scenes.forEach(scene => {
            const sceneItem = document.createElement("div");
            sceneItem.classList.add("tree-item");
            sceneItem.textContent = scene;
            sceneItem.addEventListener("click", () => selectScene(scene));
            projectTreeEl.appendChild(sceneItem);
        });

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
                (selectedFolder && el.textContent.startsWith(pm.graph?.folders[selectedFolder]?.name + "/")) ||
                el.textContent === pm.graph?.assets[selectedAsset]?.name) {
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
            filePreviewEl.innerHTML = "<em>Scene preview not implemented yet.</em>";
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
                filePreviewEl.innerHTML = "<em>Preview not available for this type.</em>";
            }
        }
        else {
            fileInfoEl.innerHTML = "<em>No selection</em>";
            filePreviewEl.innerHTML = "<em>Preview will appear here</em>";
        }
    }

    // ------------------------------
    // Import / Export
    // ------------------------------
    async function importProject(file) {
        if (!file) return;
        const zip = await JSZip.loadAsync(file);
        pm.graph = new ProjectGraph(); // reset graph

        for (const path in zip.files) {
            const entry = zip.files[path];
            if (entry.dir) {
                pm.graph.addFolder(path);
            } else {
                const ext = path.split('.').pop().toLowerCase();
                const data = await entry.async("base64");
                pm.graph.addAsset(path, "file", ext, path.includes('/') ? path.split("/").slice(0,-1).join("/") : null,
                    `data:application/octet-stream;base64,${data}`);
            }
        }

        renderProjectTree();
        updateInfoPanel();
        return `Project imported: ${file.name}`;
    }

    async function exportProject() {
        const name = prompt("Enter project name for export:", pm.projectName || "GodotProject");
        if (!name) return;

        const exporter = new ZipExporter(pm.graph, pm.sceneComposer, pm.assetHandler);
        exporter.setExportFinishedCallback(filename => {
            console.log(`Export finished: ${filename}`);
        });
        await exporter.exportProject(name);
    }

    if (importInput) {
        importInput.addEventListener("change", async e => {
            const file = e.target.files[0];
            if (!file) return;
            const result = await importProject(file);
            nlpLog.innerHTML += `${result}\n`;
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener("click", exportProject);
    }

    // ------------------------------
    // NLP Command Handling
    // ------------------------------
    async function sendNLPCommandGUI() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpInput.value = "";
        nlpLog.innerHTML += `> ${cmd}\n`;

        if (!pm) {
            nlpLog.innerHTML += "ProjectManager not loaded.\n";
            return;
        }

        // Handle import/export commands
        if (cmd.match(/^export\s+project\s+"?([^"]+)"?/i)) {
            const name = cmd.match(/^export\s+project\s+"?([^"]+)"?/i)[1];
            const exporter = new ZipExporter(pm.graph, pm.sceneComposer, pm.assetHandler);
            exporter.setExportFinishedCallback(filename => {
                nlpLog.innerHTML += `Export finished: ${filename}\n`;
            });
            await exporter.exportProject(name);
            return;
        }

        if (cmd.match(/^import\s+project/i)) {
            nlpLog.innerHTML += `Use the file input to select a ZIP to import.\n`;
            return;
        }

        const result = await pm.process_nlp_command(cmd);
        nlpLog.innerHTML += `${result}\n`;
        nlpLog.scrollTop = nlpLog.scrollHeight;

        // Refresh tree and info
        renderProjectTree();
        updateInfoPanel();
    }

    nlpSend.addEventListener("click", sendNLPCommandGUI);
    nlpInput.addEventListener("keydown", e => {
        if (e.key === "Enter") sendNLPCommandGUI();
    });

    // ------------------------------
    // Initial Rendering
    // ------------------------------
    renderProjectTree();
    updateInfoPanel();

})();
