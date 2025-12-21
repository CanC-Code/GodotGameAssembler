// libs/godot.js
// Author: CCVO
// Purpose: Dynamic UI binding for GodotGameAssembler with NLP auto-refresh

(function () {

    const projectTreeEl = document.getElementById("project-tree");
    const fileInfoEl = document.getElementById("file-info");
    const filePreviewEl = document.getElementById("file-preview");
    const nlpLogEl = document.getElementById("nlp-log");

    if (!window.ProjectManager) {
        console.error("ProjectManager not loaded.");
        return;
    }

    const pm = window.ProjectManager;

    // ----------------------------
    // Helper: Display selected info
    // ----------------------------
    function displaySelection(type, name) {
        fileInfoEl.innerHTML = "";
        filePreviewEl.innerHTML = "";

        if (type === "scene") {
            const scene = pm.graph.getScene(name);
            if (!scene) return;

            let info = `Scene: ${name}\nNodes: ${Object.keys(scene.nodes).length}`;
            for (const nodeName in scene.nodes) {
                const node = scene.nodes[nodeName];
                info += `\n- ${nodeName} (${node.type})`;
                if (node.scripts.length) info += ` [Scripts: ${node.scripts.join(", ")}]`;
            }
            fileInfoEl.textContent = info;
            filePreviewEl.innerHTML = "<em>3D viewport / scene preview placeholder</em>";

        } else if (type === "folder") {
            const folder = pm.graph.folders[name];
            if (!folder) return;
            const counts = `Files: ${folder.files.length}, Subfolders: ${folder.subfolders.length}`;
            fileInfoEl.textContent = `Folder: ${folder.name}\n${counts}`;
            filePreviewEl.innerHTML = "<em>Folder preview placeholder</em>";

        } else if (type === "asset") {
            const asset = pm.graph.assets[name];
            if (!asset) return;
            fileInfoEl.textContent = `Name: ${asset.name}\nType: ${asset.type}\nExtension: ${asset.extension}`;

            if (asset.type === "image") {
                const img = document.createElement("img");
                img.src = asset.data || "";
                img.style.maxWidth = "100%";
                img.style.maxHeight = "100%";
                filePreviewEl.appendChild(img);
            } else if (asset.type === "model") {
                filePreviewEl.innerHTML = "<em>3D model preview placeholder</em>";
            } else {
                filePreviewEl.innerHTML = "<em>Preview not available</em>";
            }
        }
    }

    // ----------------------------
    // Render project tree
    // ----------------------------
    function renderProjectTree() {
        projectTreeEl.innerHTML = "";

        // Scenes
        const scenes = pm.get_scenes();
        if (scenes.length) {
            const sceneHeader = document.createElement("div");
            sceneHeader.textContent = "Scenes:";
            sceneHeader.style.fontWeight = "bold";
            projectTreeEl.appendChild(sceneHeader);

            scenes.forEach(sceneName => {
                const item = document.createElement("div");
                item.classList.add("tree-item");
                item.textContent = sceneName + ".tcsn";
                item.dataset.type = "scene";
                item.dataset.name = sceneName;
                projectTreeEl.appendChild(item);
            });
        }

        // Folders
        const folders = Object.keys(pm.graph.folders || {});
        if (folders.length) {
            const folderHeader = document.createElement("div");
            folderHeader.textContent = "Folders:";
            folderHeader.style.fontWeight = "bold";
            projectTreeEl.appendChild(folderHeader);

            folders.forEach(folderPath => {
                const folder = pm.graph.folders[folderPath];
                const item = document.createElement("div");
                item.classList.add("tree-item");
                item.textContent = folder.name + "/";
                item.dataset.type = "folder";
                item.dataset.name = folderPath;
                projectTreeEl.appendChild(item);
            });
        }

        // Assets
        const assets = Object.keys(pm.graph.assets || {});
        if (assets.length) {
            const assetHeader = document.createElement("div");
            assetHeader.textContent = "Assets:";
            assetHeader.style.fontWeight = "bold";
            projectTreeEl.appendChild(assetHeader);

            assets.forEach(assetPath => {
                const asset = pm.graph.assets[assetPath];
                const item = document.createElement("div");
                item.classList.add("tree-item");
                item.textContent = asset.name;
                item.dataset.type = "asset";
                item.dataset.name = assetPath;
                projectTreeEl.appendChild(item);
            });
        }
    }

    // ----------------------------
    // Tree click handler
    // ----------------------------
    projectTreeEl.addEventListener("click", (e) => {
        const item = e.target.closest(".tree-item");
        if (!item) return;

        // Highlight
        projectTreeEl.querySelectorAll(".tree-item").forEach(i => i.classList.remove("selected"));
        item.classList.add("selected");

        displaySelection(item.dataset.type, item.dataset.name);
    });

    // ----------------------------
    // Override ProjectManager methods to auto-refresh
    // ----------------------------
    const refreshTree = () => {
        renderProjectTree();
    };

    const wrapWithRefresh = (fnName) => {
        const orig = pm[fnName];
        pm[fnName] = async function (...args) {
            const result = await orig.apply(pm, args);
            refreshTree();
            return result;
        };
    };

    ["add_scene", "add_node", "add_script", "attach_script", "upload_asset"].forEach(fn => wrapWithRefresh(fn));

    // ----------------------------
    // NLP auto-refresh
    // ----------------------------
    const nlpInput = document.getElementById("nlp-command");
    const nlpSend = document.getElementById("nlp-send");
    const nlpLog = document.getElementById("nlp-log");

    async function sendNLPCommand() {
        const cmd = nlpInput.value.trim();
        if (!cmd) return;
        nlpLog.innerHTML += `> ${cmd}\n`;
        nlpInput.value = "";

        if (pm) {
            const result = await pm.process_nlp_command(cmd);
            nlpLog.innerHTML += `${result}\n`;
            nlpLog.scrollTop = nlpLog.scrollHeight;

            // Attempt to auto-select newly created scene/node/asset
            const matchScene = cmd.match(/^create\s+scene\s+(\w+)/i);
            if (matchScene) {
                const sceneName = matchScene[1];
                renderProjectTree();
                const newItem = projectTreeEl.querySelector(`.tree-item[data-type="scene"][data-name="${sceneName}"]`);
                if (newItem) {
                    newItem.click();
                }
            }
        } else {
            nlpLog.innerHTML += "ProjectManager not loaded.\n";
        }
    }

    nlpSend.addEventListener("click", sendNLPCommand);
    nlpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendNLPCommand();
    });

    // ----------------------------
    // Initial render
    // ----------------------------
    renderProjectTree();

    window.refreshProjectTree = renderProjectTree;

})();