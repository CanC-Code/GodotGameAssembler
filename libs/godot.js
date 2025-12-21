// libs/godot.js
// Author: CCVO
// Purpose: Godot Game Assembler frontend logic (NLP chat + import/export)
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

    let gameName = null;
    let gameConcept = null;

    // ------------------------------
    // NLP Chat Assistant
    // ------------------------------
    async function sendNLPCommandGUI() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpLog.innerHTML += `> ${cmd}\n`;
        nlpInput.value = "";

        let response = "";

        // Interactive guidance
        if (!gameName) {
            if (cmd.toLowerCase().startsWith("name game ")) {
                gameName = cmd.substring(10).trim();
                response = `Game named '${gameName}'. Now you can set its concept: set concept "<text>"`;
            } else {
                response = "Welcome! Please start by naming your game: name game \"<Name>\"";
            }
        } else if (!gameConcept) {
            if (cmd.toLowerCase().startsWith("set concept ")) {
                gameConcept = cmd.substring(12).trim();
                response = `Concept set: "${gameConcept}". You can now create your first scene using: create scene <Name>`;
            } else {
                response = `Your game is named '${gameName}'. Set its concept first: set concept "<text>"`;
            }
        } else {
            // Process standard commands
            try {
                response = await pm.process_nlp_command(cmd);
                refreshProjectTree();
            } catch (err) {
                response = `Error: ${err.message}`;
            }
        }

        nlpLog.innerHTML += `${response}\n`;
        nlpLog.scrollTop = nlpLog.scrollHeight;
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

        fileInfo.innerHTML = `<strong>Scene:</strong> ${sceneName}<br>
                              <strong>Nodes:</strong> ${Object.keys(scene.nodes).length}`;

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
    // Import / Export Helpers
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

    async function exportGodotProject() {
        const zip = new JSZip();

        for (const folderPath in pm.graph.folders) {
            zip.folder(folderPath);
        }

        for (const assetPath in pm.graph.assets) {
            const asset = pm.graph.assets[assetPath];
            if (asset.data) zip.file(assetPath, asset.data);
        }

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
    nlpLog.innerHTML = "Hello! What would you like to do?\nStart by naming your game: name game \"<Name>\"\n";

    console.log("Godot frontend (chat-driven) loaded.");

})();