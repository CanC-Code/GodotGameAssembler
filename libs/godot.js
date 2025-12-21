// libs/godot.js
(function () {

    const appRoot = document.getElementById("app-root");
    const topLeft = document.getElementById("top-left");
    const projectTree = document.getElementById("project-tree");
    const topRight = document.getElementById("top-right");
    const fileInfo = document.getElementById("file-info");
    const filePreview = document.getElementById("file-preview");

    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");
    const nlpLog = document.getElementById("nlp-log");

    // ------------------------------
    // Toolbar
    // ------------------------------
    const toolbar = document.createElement("div");
    toolbar.style.display = "flex";
    toolbar.style.gap = "0.5em";
    toolbar.style.marginBottom = "0.5em";

    const btnNew = document.createElement("button");
    btnNew.textContent = "New Project";
    const btnImport = document.createElement("button");
    btnImport.textContent = "Import ZIP";
    const btnExport = document.createElement("button");
    btnExport.textContent = "Export Project";

    toolbar.appendChild(btnNew);
    toolbar.appendChild(btnImport);
    toolbar.appendChild(btnExport);

    topLeft.insertBefore(toolbar, projectTree);

    // ------------------------------
    // Utility: Render Project Tree
    // ------------------------------
    function renderProjectTree() {
        if (!window.ProjectManager) return;
        projectTree.innerHTML = "";

        // Folders
        const folders = ProjectManager.get_folder_contents("/") || { files: [], subfolders: [] };
        for (const folder of folders.subfolders) {
            const item = document.createElement("div");
            item.className = "tree-item";
            item.textContent = `📁 ${folder.name} (${folder.files.length} files)`;
            item.addEventListener("click", () => selectFolder(folder));
            projectTree.appendChild(item);
        }

        // Scenes
        const scenes = ProjectManager.get_scenes();
        for (const scene of scenes) {
            const item = document.createElement("div");
            item.className = "tree-item";
            item.textContent = `🎬 ${scene}`;
            item.addEventListener("click", () => selectScene(scene));
            projectTree.appendChild(item);
        }

        // Root-level files
        for (const file of folders.files) {
            const item = document.createElement("div");
            item.className = "tree-item";
            item.textContent = `📄 ${file.name}`;
            item.addEventListener("click", () => selectAsset(file));
            projectTree.appendChild(item);
        }
    }

    // ------------------------------
    // Selection Handlers
    // ------------------------------
    function selectScene(sceneName) {
        fileInfo.innerHTML = `<strong>Scene:</strong> ${sceneName}`;
        const scene = ProjectManager.get_scene_file(sceneName);
        filePreview.innerHTML = `<pre>${JSON.stringify(scene, null, 2)}</pre>`;
    }

    function selectFolder(folder) {
        fileInfo.innerHTML = `<strong>Folder:</strong> ${folder.name} <br/> Parent: ${folder.parent || "/"}`;
        const contents = ProjectManager.get_folder_contents(folder.name);
        let html = "";
        for (const f of contents.files) html += `📄 ${f.name} <br/>`;
        for (const sf of contents.subfolders) html += `📁 ${sf.name} (${sf.files.length} files)<br/>`;
        filePreview.innerHTML = html || "<em>Empty folder</em>";
    }

    function selectAsset(asset) {
        fileInfo.innerHTML = `<strong>File:</strong> ${asset.name} <br/> Type: ${asset.type}.${asset.extension}`;
        filePreview.innerHTML = `<pre>${asset.data ? "Binary/Data present" : "No data"}</pre>`;
    }

    // ------------------------------
    // NLP Input Handling
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
        } else {
            nlpLog.innerHTML += "ProjectManager not loaded.\n";
        }

        renderProjectTree();
    }

    nlpSend.addEventListener("click", sendNLPCommandGUI);
    nlpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendNLPCommandGUI();
    });

    // ------------------------------
    // Toolbar Button Events
    // ------------------------------
    btnNew.addEventListener("click", () => {
        if (!window.ProjectManager) return;
        const name = prompt("New project name:", "Untitled");
        if (name) {
            const msg = ProjectManager.newProject(name);
            nlpLog.innerHTML += `${msg}\n`;
            renderProjectTree();
        }
    });

    btnImport.addEventListener("click", async () => {
        if (!window.ProjectManager) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".zip";
        input.onchange = async () => {
            const file = input.files[0];
            const msg = await ProjectManager.importZip(file);
            nlpLog.innerHTML += `${msg}\n`;
            renderProjectTree();
        };
        input.click();
    });

    btnExport.addEventListener("click", async () => {
        if (!window.ProjectManager) return;
        const msg = await ProjectManager.generate_project(ProjectManager.gameName || "GodotProject");
        nlpLog.innerHTML += `Exported project: ${msg}\n`;
    });

    // Initial render
    renderProjectTree();

})();