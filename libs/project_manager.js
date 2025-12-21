// libs/project_manager.js
// Author: CCVO
// Purpose: Connect Godot Game Assembler UI to ProjectManager with dynamic info panel and chat-driven workflow

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

    // Track selected scene / folder / asset / node
    let selectedScene = null;
    let selectedFolder = null;
    let selectedAsset = null;
    let selectedNode = null;

    // ------------------------------
    // Project Tree Rendering
    // ------------------------------
    function renderProjectTree() {
        projectTreeEl.innerHTML = "";

        const scenes = pm.getScenes();
        if (scenes.length === 0) {
            projectTreeEl.innerHTML = "<em>No scenes</em>";
        }

        scenes.forEach(sceneName => {
            const sceneItem = document.createElement("div");
            sceneItem.classList.add("tree-item");
            sceneItem.textContent = sceneName;
            sceneItem.addEventListener("click", () => selectScene(sceneName));
            projectTreeEl.appendChild(sceneItem);

            // Render nodes under this scene
            const sceneData = pm.getSceneFile(sceneName);
            if (sceneData) {
                Object.keys(sceneData.nodes).forEach(nodeName => {
                    const nodeItem = document.createElement("div");
                    nodeItem.classList.add("tree-item");
                    nodeItem.style.paddingLeft = "20px";
                    nodeItem.textContent = nodeName + ` (${sceneData.nodes[nodeName].type})`;
                    nodeItem.addEventListener("click", () => selectNode(sceneName, nodeName));
                    projectTreeEl.appendChild(nodeItem);
                });
            }
        });

        // Folders
        const folders = Object.keys(pm.graph?.folders || {});
        folders.forEach(folderPath => {
            const folder = pm.graph.folders[folderPath];
            const folderItem = document.createElement("div");
            folderItem.classList.add("tree-item");
            folderItem.textContent = folder.name + "/";
            folderItem.style.fontStyle = "italic";
            folderItem.addEventListener("click", () => selectFolder(folderPath));
            projectTreeEl.appendChild(folderItem);

            // Render files in folder
            folder.files.forEach(filePath => {
                const fileAsset = pm.graph.getAsset(filePath);
                const fileItem = document.createElement("div");
                fileItem.classList.add("tree-item");
                fileItem.style.paddingLeft = "20px";
                fileItem.textContent = fileAsset.name;
                fileItem.addEventListener("click", () => selectAsset(filePath));
                projectTreeEl.appendChild(fileItem);
            });

            // Render subfolders
            folder.subfolders.forEach(subPath => {
                const subfolder = pm.graph.folders[subPath];
                const subItem = document.createElement("div");
                subItem.classList.add("tree-item");
                subItem.style.paddingLeft = "20px";
                subItem.textContent = subfolder.name + "/";
                subItem.style.fontStyle = "italic";
                subItem.addEventListener("click", () => selectFolder(subPath));
                projectTreeEl.appendChild(subItem);
            });
        });

        highlightSelected();
    }

    // ------------------------------
    // Selection Handling
    // ------------------------------
    function highlightSelected() {
        Array.from(projectTreeEl.children).forEach(el => el.classList.remove("selected"));

        Array.from(projectTreeEl.children).forEach(el => {
            if (selectedScene && el.textContent === selectedScene) el.classList.add("selected");
            if (selectedNode && el.textContent.startsWith(selectedNode + " (")) el.classList.add("selected");
            if (selectedFolder && el.textContent.startsWith(pm.graph?.folders[selectedFolder]?.name + "/")) el.classList.add("selected");
            if (selectedAsset && el.textContent === pm.graph.getAsset(selectedAsset)?.name) el.classList.add("selected");
        });
    }

    function selectScene(sceneName) {
        selectedScene = sceneName;
        selectedNode = null;
        selectedFolder = null;
        selectedAsset = null;
        highlightSelected();
        updateInfoPanel();
    }

    function selectNode(sceneName, nodeName) {
        selectedScene = sceneName;
        selectedNode = nodeName;
        selectedFolder = null;
        selectedAsset = null;
        highlightSelected();
        updateInfoPanel();
    }

    function selectFolder(folderPath) {
        selectedFolder = folderPath;
        selectedScene = null;
        selectedNode = null;
        selectedAsset = null;
        highlightSelected();
        updateInfoPanel();
    }

    function selectAsset(assetPath) {
        selectedAsset = assetPath;
        selectedScene = null;
        selectedNode = null;
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
            filePreviewEl.innerHTML = "<em>Scene preview placeholder</em>";
        }

        else if (selectedNode) {
            const node = pm.getNode(selectedScene, selectedNode);
            if (!node) return;
            fileInfoEl.innerHTML = `<strong>Node:</strong> ${selectedNode}<br>
                <strong>Type:</strong> ${node.type}<br>
                <strong>Parent:</strong> ${node.parent || "none"}<br>
                <strong>Children:</strong> ${node.children.length}<br>
                <strong>Scripts:</strong> ${node.scripts.join(", ") || "none"}`;
            filePreviewEl.innerHTML = "<em>Node preview placeholder</em>";
        }

        else if (selectedFolder) {
            const contents = pm.graph.getFolderContents(selectedFolder);
            const fileCount = contents.files.length;
            const folderCount = contents.subfolders.length;
            fileInfoEl.innerHTML = `<strong>Folder:</strong> ${selectedFolder}<br>
                <strong>Files:</strong> ${fileCount}<br>
                <strong>Subfolders:</strong> ${folderCount}`;
            filePreviewEl.innerHTML = "<em>Folder preview placeholder</em>";
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
                filePreviewEl.innerHTML = "<em>Preview not available</em>";
            }
        }

        else {
            fileInfoEl.innerHTML = "<em>No selection</em>";
            filePreviewEl.innerHTML = "<em>Preview will appear here</em>";
        }
    }

    // ------------------------------
    // NLP Chat / Command Handling
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

            // Refresh tree and info
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
    // Guided Chat Initialization
    // ------------------------------
    function startChatWorkflow() {
        nlpLog.innerHTML += `Hello! What would you like to do?\n`;
        nlpLog.innerHTML += `Start by naming your game: name game "<Name>"\n`;
        nlpLog.scrollTop = nlpLog.scrollHeight;
    }

    // ------------------------------
    // Initial Rendering
    // ------------------------------
    renderProjectTree();
    updateInfoPanel();
    startChatWorkflow();

})();
