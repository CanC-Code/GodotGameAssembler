// libs/godot.js
// Author: CCVO
// Purpose: Godot Game Assembler core GUI + NLP + ProjectGraph integration
// Handles project tree, file info, ZIP import, and NLP interface

(function () {

    if (!window.ProjectGraph) throw new Error("ProjectGraph not loaded");
    if (!window.AssetHandler) throw new Error("AssetHandler not loaded");
    if (!window.SceneComposer) throw new Error("SceneComposer not loaded");
    if (!window.ZipExporter) throw new Error("ZipExporter not loaded");
    if (!window.ProjectManager) throw new Error("ProjectManager not loaded");
    if (!window.NLP_PRO) throw new Error("NLP_PRO not loaded");

    // ------------------------------
    // Core Instances
    // ------------------------------
    const graph = new ProjectGraph();
    const assets = new AssetHandler();
    const composer = new SceneComposer(graph);
    const exporter = new ZipExporter(graph, composer, assets);
    const nlp = window.NLP_PRO;

    // ------------------------------
    // DOM References
    // ------------------------------
    const projectTreeEl = document.getElementById("project-tree");
    const fileInfoEl = document.getElementById("file-info");
    const filePreviewEl = document.getElementById("file-preview");
    const nlpLog = document.getElementById("nlp-log");
    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");

    // ------------------------------
    // Helpers
    // ------------------------------
    function escapeHTML(str) {
        return str.replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;");
    }

    // ------------------------------
    // Project Tree Rendering
    // ------------------------------
    function buildTree(folderPath = null, container = projectTreeEl) {
        container.innerHTML = "";
        let items;
        if (!folderPath) {
            // Root: show scenes and top-level folders
            items = [];
            Object.keys(graph.scenes).forEach(scene => items.push({ name: scene, type: "scene" }));
            Object.keys(graph.folders).forEach(folder => {
                if (!graph.folders[folder].parent) items.push({ name: folder, type: "folder" });
            });
        } else {
            const folderContents = graph.getFolderContents(folderPath);
            items = folderContents.subfolders.map(f => ({ name: f.name, path: f.name, type: "folder" }))
                  .concat(folderContents.files.map(f => ({ name: f.name, path: f.name, type: f.type || "file", extension: f.extension || "" })));
        }

        items.forEach(item => {
            const div = document.createElement("div");
            div.className = "tree-item";
            div.textContent = item.name + (item.extension ? `.${item.extension}` : "");
            div.dataset.type = item.type;
            div.dataset.name = item.name;
            div.dataset.path = item.path || item.name;

            div.addEventListener("click", () => {
                renderFileInfo(item);
            });

            container.appendChild(div);
        });
    }

    function renderFileInfo(item) {
        let html = `<strong>Name:</strong> ${escapeHTML(item.name)}<br>`;
        html += `<strong>Type:</strong> ${escapeHTML(item.type)}<br>`;
        if (item.type === "scene") {
            const scene = graph.getScene(item.name);
            const nodeCount = scene ? Object.keys(scene.nodes).length : 0;
            html += `<strong>Nodes:</strong> ${nodeCount}<br>`;
        }
        if (item.type === "folder") {
            const folder = graph.folders[item.path];
            if (folder) {
                html += `<strong>Files:</strong> ${folder.files.length}<br>`;
                html += `<strong>Subfolders:</strong> ${folder.subfolders.length}<br>`;
            }
        }
        fileInfoEl.innerHTML = html;

        // Preview placeholder
        if (item.type === "file" && item.extension.match(/(png|jpg|jpeg|gif)$/i)) {
            const asset = graph.getAsset(item.path);
            if (asset && asset.data) {
                const blob = new Blob([asset.data]);
                const url = URL.createObjectURL(blob);
                filePreviewEl.innerHTML = `<img src="${url}" style="max-width:100%; max-height:100%;">`;
            } else {
                filePreviewEl.innerHTML = `<em>Image preview not available</em>`;
            }
        } else {
            filePreviewEl.innerHTML = `<em>No preview</em>`;
        }
    }

    // ------------------------------
    // NLP Integration
    // ------------------------------
    async function sendNLPCommandGUI() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpLog.innerHTML += `> ${escapeHTML(cmd)}\n`;
        nlpInput.value = "";

        try {
            const result = await window.ProjectManager.process_nlp_command(cmd);
            nlpLog.innerHTML += `${escapeHTML(result)}\n`;
        } catch (err) {
            nlpLog.innerHTML += `Error: ${escapeHTML(err.message)}\n`;
        }

        nlpLog.scrollTop = nlpLog.scrollHeight;
        buildTree(); // Refresh tree after commands
    }

    nlpSend.addEventListener("click", sendNLPCommandGUI);
    nlpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendNLPCommandGUI();
    });

    // ------------------------------
    // ZIP Import
    // ------------------------------
    function addZipImportInput() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".zip";
        input.style.marginBottom = "0.5em";
        document.getElementById("top-left").insertBefore(input, projectTreeEl);

        input.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const JSZipScript = document.createElement("script");
            JSZipScript.src = "libs/jszip.min.js";
            JSZipScript.onload = async () => {
                const zip = await JSZip.loadAsync(file);
                await processZip(zip);
                buildTree();
            };
            document.body.appendChild(JSZipScript);
        });
    }

    async function processZip(zip, parentFolder = null) {
        for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
            const parts = relativePath.split("/");
            const name = parts.pop();
            const folderPath = parts.join("/");
            if (zipEntry.dir) {
                graph.addFolder(relativePath, parentFolder);
            } else {
                const data = await zipEntry.async("arraybuffer");
                const extension = name.split(".").pop();
                graph.addAsset(relativePath, "file", extension, folderPath || null, data);
                if (folderPath && !graph.folders[folderPath]) graph.addFolder(folderPath, parentFolder);
            }
        }
    }

    addZipImportInput();
    buildTree();

    console.log("Godot.js initialized with ZIP import and dynamic project tree.");

})();