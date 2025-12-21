// libs/godot.js
// Author: CCVO
// Purpose: Godot Game Assembler frontend logic (NLP + import/export)
// Requires: ProjectManager, JSZip

(function () {

    const pm = window.ProjectManager;
    if (!pm) throw new Error("ProjectManager not loaded.");

    const projectTree = document.getElementById("project-tree");
    const fileInfo = document.getElementById("file-info");
    const filePreview = document.getElementById("file-preview");

    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");
    const nlpLog = document.getElementById("nlp-log");

    // ------------------------------
    // NLP Command Handler
    // ------------------------------
    async function sendNLPCommandGUI() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpLog.innerHTML += `> ${cmd}\n`;
        nlpInput.value = "";

        try {
            const result = await pm.process_nlp_command(cmd);
            nlpLog.innerHTML += `${result}\n`;
            nlpLog.scrollTop = nlpLog.scrollHeight;
            refreshProjectTree();
        } catch (err) {
            nlpLog.innerHTML += `Error: ${err.message}\n`;
        }
    }

    nlpSend.addEventListener("click", sendNLPCommandGUI);
    nlpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendNLPCommandGUI();
    });

    // ------------------------------
    // Project Tree Refresh
    // ------------------------------
    function refreshProjectTree() {
        const scenes = pm.get_scenes();
        if (!scenes.length) {
            projectTree.innerHTML = "<em>No scenes</em>";
            return;
        }

        projectTree.innerHTML = "";
        scenes.forEach(sceneName => {
            const div = document.createElement("div");
            div.className = "tree-item";
            div.textContent = sceneName;
            div.addEventListener("click", () => selectScene(sceneName));
            projectTree.appendChild(div);
        });
    }

    function selectScene(sceneName) {
        const scene = pm.get_scene_file(sceneName);
        if (!scene) return;

        // Display info
        fileInfo.innerHTML = `<strong>Scene:</strong> ${sceneName}<br>
                              <strong>Nodes:</strong> ${Object.keys(scene.nodes).length}`;

        // Display node list as preview
        const previewLines = [];
        Object.entries(scene.nodes).forEach(([nodeName, node]) => {
            previewLines.push(`${nodeName} (${node.type})`);
        });
        filePreview.textContent = previewLines.join("\n");
    }

    // ------------------------------
    // Import / Export Buttons
    // ------------------------------
    function createImportExportButtons() {
        const topRightPanel = document.getElementById("top-right");
        const container = document.createElement("div");
        container.style.margin = "0.5em 0";
        container.style.display = "flex";
        container.style.gap = "0.5em";

        const importBtn = document.createElement("button");
        importBtn.textContent = "Import ZIP";
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".zip";
        fileInput.style.display = "none";

        importBtn.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", async (e) => {
            if (!e.target.files.length) return;
            const file = e.target.files[0];
            const zip = await JSZip.loadAsync(file);
            await importGodotProject(zip);
            nlpLog.innerHTML += `Project '${file.name}' imported.\n`;
            refreshProjectTree();
        });

        const exportBtn = document.createElement("button");
        exportBtn.textContent = "Export ZIP";
        exportBtn.addEventListener("click", async () => {
            const zip = await exportGodotProject();
            zip.generateAsync({ type: "blob" }).then((blob) => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "GodotProject.zip";
                a.click();
            });
        });

        container.appendChild(importBtn);
        container.appendChild(exportBtn);
        container.appendChild(fileInput);
        topRightPanel.insertBefore(container, topRightPanel.firstChild);
    }

    // ------------------------------
    // Import Godot Project ZIP
    // ------------------------------
    async function importGodotProject(zip) {
        for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
            if (zipEntry.dir) {
                pm.graph.addFolder(relativePath);
            } else {
                const data = await zipEntry.async("uint8array");
                const ext = relativePath.split(".").pop();
                const folder = relativePath.includes("/") ? relativePath.split("/").slice(0, -1).join("/") : null;
                pm.graph.addAsset(relativePath, "file", ext, folder, data);
            }
        }
    }

    // ------------------------------
    // Export Godot Project ZIP
    // ------------------------------
    async function exportGodotProject() {
        const zip = new JSZip();

        // Export folders
        for (const folderPath in pm.graph.folders) {
            zip.folder(folderPath);
        }

        // Export assets
        for (const assetPath in pm.graph.assets) {
            const asset = pm.graph.assets[assetPath];
            if (asset.data) zip.file(assetPath, asset.data);
        }

        // Export scenes as .tscn files
        const scenes = pm.get_scenes();
        for (const sceneName of scenes) {
            const sceneData = pm.get_scene_file(sceneName);
            zip.file(`${sceneName}.tscn`, JSON.stringify(sceneData, null, 2));
        }

        return zip;
    }

    // ------------------------------
    // Initialize
    // ------------------------------
    createImportExportButtons();
    refreshProjectTree();

    console.log("Godot frontend loaded.");

})();