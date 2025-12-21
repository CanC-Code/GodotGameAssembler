// libs/godot.js
// Author: CCVO
// Purpose: Dynamic UI binding for GodotGameAssembler

(function () {

    const projectTreeEl = document.getElementById("project-tree");
    const fileInfoEl = document.getElementById("file-info");
    const filePreviewEl = document.getElementById("file-preview");

    if (!window.ProjectManager) {
        console.error("ProjectManager not loaded.");
        return;
    }

    const pm = window.ProjectManager;

    // ----------------------------
    // Helper: Render project tree
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
    // Helper: Display file/folder info
    // ----------------------------
    function displaySelection(type, name) {
        fileInfoEl.innerHTML = "";
        filePreviewEl.innerHTML = "";

        if (type === "scene") {
            const content = pm.graph.generateSceneFile(name);
            fileInfoEl.textContent = content || "Scene empty.";
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
            let info = `Name: ${asset.name}\nType: ${asset.type}\nExtension: ${asset.extension}`;
            fileInfoEl.textContent = info;

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
    // Event delegation for tree clicks
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
    // Initial render
    // ----------------------------
    renderProjectTree();

    // ----------------------------
    // Expose re-render function for updates
    // ----------------------------
    window.refreshProjectTree = renderProjectTree;

})();