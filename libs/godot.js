// libs/godot.js
// Author: CCVO
// Purpose: Interactive GodotGameAssembler frontend logic with ZIP import/export

(function () {

    // ------------------------------
    // Core references
    // ------------------------------
    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");
    const nlpLog = document.getElementById("nlp-log");
    const projectTreeEl = document.getElementById("project-tree");
    const fileInfoEl = document.getElementById("file-info");
    const filePreviewEl = document.getElementById("file-preview");

    const PM = window.ProjectManager;

    if (!PM) throw new Error("ProjectManager not loaded");
    if (typeof JSZip === "undefined") console.warn("JSZip library not loaded. ZIP import/export will not work.");

    // ------------------------------
    // Utility
    // ------------------------------
    function escapeHTML(str) {
        return str.replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;");
    }

    // ------------------------------
    // Guided NLP Interpreter
    // ------------------------------
    async function interpretCommand(cmd) {
        cmd = cmd.trim();

        if (!PM.gameState) PM.gameState = { step: "askName" };

        if (PM.gameState.step === "askName") {
            PM.gameName = cmd;
            PM.gameState.step = "askConcept";
            return `Game named "${cmd}". Describe the concept of your game:`;
        }

        if (PM.gameState.step === "askConcept") {
            PM.gameConcept = cmd;
            PM.gameState.step = "ready";
            return `Concept set: "${cmd}". You can now create scenes, add nodes, buttons, thumbsticks, and scripts.\nType 'help' to see commands.`;
        }

        if (cmd.toLowerCase().startsWith("name game ")) {
            PM.gameName = cmd.substr(10).trim();
            return `Game named "${PM.gameName}".`;
        }

        if (cmd.toLowerCase().startsWith("set concept ")) {
            PM.gameConcept = cmd.substr(12).trim();
            return `Concept set: "${PM.gameConcept}".`;
        }

        if (cmd.toLowerCase() === "export project") {
            await exportProjectZip(PM.gameName || "GodotProject");
            return `Project exported as ZIP.`;
        }

        if (cmd.toLowerCase().startsWith("import project")) {
            nlpLog.innerHTML += "Use the file input below to select a ZIP.\n";
            return "Awaiting ZIP import...";
        }

        const result = await PM.process_nlp_command(cmd);
        return result;
    }

    // ------------------------------
    // ZIP Import/Export
    // ------------------------------
    async function importProjectZip(file) {
        if (!file) return;
        if (typeof JSZip === "undefined") return alert("JSZip not loaded");

        const zip = await JSZip.loadAsync(file);
        const filePromises = [];

        zip.forEach((relativePath, zipEntry) => {
            if (zipEntry.dir) return;
            filePromises.push(
                zipEntry.async("uint8array").then(data => {
                    const parts = relativePath.split("/");
                    const fileName = parts.pop();
                    const folderPath = parts.join("/") || null;
                    const ext = fileName.split(".").pop();
                    PM.graph.addAsset(relativePath, ext, ext, folderPath, data);

                    if (ext === "tscn") {
                        const textDecoder = new TextDecoder();
                        const content = textDecoder.decode(data);
                        const sceneName = fileName.replace(".tscn", "");
                        PM.add_scene(sceneName);
                        PM.add_script(sceneName, sceneName, content);
                    }

                    if (folderPath) PM.graph.addFolder(folderPath);
                })
            );
        });

        await Promise.all(filePromises);
        buildTree();
        nlpLog.innerHTML += `Project imported from ZIP.\n`;
    }

    async function exportProjectZip(projectName) {
        if (typeof JSZip === "undefined") return alert("JSZip not loaded");

        const zip = new JSZip();

        // Add folders and assets
        for (const folderPath in PM.graph.folders) {
            zip.folder(folderPath);
        }

        for (const assetPath in PM.graph.assets) {
            const asset = PM.graph.assets[assetPath];
            zip.file(assetPath, asset.data || new Uint8Array());
        }

        // Add scenes
        const scenes = PM.get_scenes();
        scenes.forEach(sceneName => {
            const sceneData = PM.get_scene_file(sceneName);
            const content = JSON.stringify(sceneData, null, 2);
            zip.file(`${sceneName}.tscn`, content);
        });

        const blob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${projectName}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    // ------------------------------
    // Tree / Browser UI
    // ------------------------------
    function buildTree() {
        projectTreeEl.innerHTML = "";

        // ---------- Folders ----------
        const folders = Object.keys(PM.graph.folders || {});
        folders.forEach(folderPath => {
            const folder = PM.graph.folders[folderPath];
            const folderEl = document.createElement("div");
            folderEl.className = "tree-item";
            folderEl.style.fontWeight = "bold";
            folderEl.textContent = folder.name + " [" + folder.files.length + " files, " + folder.subfolders.length + " subfolders]";
            folderEl.onclick = () => selectFolder(folderPath);
            projectTreeEl.appendChild(folderEl);

            folder.files.forEach(filePath => {
                const file = PM.graph.assets[filePath];
                const fileEl = document.createElement("div");
                fileEl.className = "tree-item";
                fileEl.style.paddingLeft = "15px";
                fileEl.textContent = file.name + " (" + file.extension + ")";
                fileEl.onclick = () => selectFile(filePath);
                projectTreeEl.appendChild(fileEl);
            });
        });

        // ---------- Scenes ----------
        const scenes = PM.get_scenes();
        if (scenes.length) {
            const scenesHeader = document.createElement("div");
            scenesHeader.className = "tree-item";
            scenesHeader.style.fontWeight = "bold";
            scenesHeader.textContent = "Scenes";
            projectTreeEl.appendChild(scenesHeader);

            scenes.forEach(sceneName => {
                const sceneNode = document.createElement("div");
                sceneNode.className = "tree-item";
                sceneNode.style.paddingLeft = "10px";
                sceneNode.textContent = sceneName;
                sceneNode.onclick = () => selectScene(sceneName);
                projectTreeEl.appendChild(sceneNode);

                const sceneData = PM.get_scene_file(sceneName);
                if (sceneData && sceneData.nodes) {
                    Object.keys(sceneData.nodes).forEach(nodeName => {
                        const nodeEl = document.createElement("div");
                        nodeEl.className = "tree-item";
                        nodeEl.style.paddingLeft = "25px";
                        nodeEl.textContent = nodeName + " (" + sceneData.nodes[nodeName].type + ")";
                        nodeEl.onclick = () => selectNode(sceneName, nodeName);
                        projectTreeEl.appendChild(nodeEl);
                    });
                }
            });
        }
    }

    // ------------------------------
    // Select Handlers
    // ------------------------------
    function selectFolder(folderPath) {
        const folder = PM.graph.folders[folderPath];
        fileInfoEl.innerHTML = `<strong>Folder:</strong> ${folder.name}<br>
            <strong>Files:</strong> ${folder.files.length}<br>
            <strong>Subfolders:</strong> ${folder.subfolders.length}`;
        filePreviewEl.innerHTML = `<em>Preview unavailable</em>`;
    }

    function selectFile(filePath) {
        const file = PM.graph.assets[filePath];
        fileInfoEl.innerHTML = `<strong>File:</strong> ${file.name}<br>
            <strong>Type:</strong> ${file.type}<br>
            <strong>Extension:</strong> ${file.extension}<br>
            <strong>Folder:</strong> ${file.folder || "root"}`;
        filePreviewEl.innerHTML = `<em>Preview placeholder for ${file.name}</em>`;
    }

    function selectScene(sceneName) {
        const sceneData = PM.get_scene_file(sceneName);
        fileInfoEl.innerHTML = `<strong>Scene:</strong> ${sceneName}<br>
            <strong>Nodes:</strong> ${Object.keys(sceneData.nodes).length}`;
        filePreviewEl.innerHTML = `<em>Preview unavailable</em>`;
    }

    function selectNode(sceneName, nodeName) {
        const node = PM.get_scene_file(sceneName).nodes[nodeName];
        fileInfoEl.innerHTML = `<strong>Scene:</strong> ${sceneName}<br>
            <strong>Node:</strong> ${nodeName}<br>
            <strong>Type:</strong> ${node.type}<br>
            <strong>Children:</strong> ${node.children.join(", ") || "none"}<br>
            <strong>Scripts:</strong> ${node.scripts.join(", ") || "none"}`;
        filePreviewEl.innerHTML = `<em>Preview unavailable</em>`;
    }

    // ------------------------------
    // NLP Input Handler
    // ------------------------------
    async function sendNLPCommandGUI() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpLog.innerHTML += `> ${escapeHTML(cmd)}\n`;
        nlpInput.value = "";

        try {
            const result = await interpretCommand(cmd);
            nlpLog.innerHTML += `${escapeHTML(result)}\n`;
        } catch (err) {
            nlpLog.innerHTML += `Error: ${escapeHTML(err.message)}\n`;
        }

        nlpLog.scrollTop = nlpLog.scrollHeight;
        buildTree();
    }

    nlpSend.addEventListener("click", sendNLPCommandGUI);
    nlpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendNLPCommandGUI();
    });

    // ------------------------------
    // Initialize console
    // ------------------------------
    nlpLog.innerHTML = "Welcome to Godot Game Assembler!\nWhat is the name of your game?\n";

    buildTree();

    console.log("Godot interactive frontend with ZIP import/export loaded.");
})();