// libs/godot_file_tree.js
// Author: CCVO
// Purpose: Dynamic interactive file tree for Godot Game Assembler

(function () {
    const treeContainer = document.getElementById("project-tree");

    if (!treeContainer) {
        console.error("Project tree container (#project-tree) not found!");
        return;
    }

    function renderProjectTree() {
        treeContainer.innerHTML = "";

        const scenes = GodotState.nodesInScene;
        const sceneNames = Object.keys(scenes);

        if (sceneNames.length === 0) {
            const em = document.createElement("em");
            em.innerText = "No scenes";
            treeContainer.appendChild(em);
            return;
        }

        sceneNames.forEach(sceneName => {
            const sceneDiv = document.createElement("div");
            sceneDiv.className = "tree-item scene-item";
            sceneDiv.innerText = sceneName;
            sceneDiv.dataset.type = "scene";
            sceneDiv.dataset.name = sceneName;

            // Click scene → select it in GodotState.currentScene
            sceneDiv.addEventListener("click", () => {
                GodotState.currentScene = sceneName;
                updateInfoPanel();
                updateSuggestions();
                highlightSelectedTreeItem();
            });

            // List nodes under scene
            const nodes = scenes[sceneName];
            if (nodes.length > 0) {
                const nodeList = document.createElement("div");
                nodeList.style.marginLeft = "12px";

                nodes.forEach(node => {
                    const nodeDiv = document.createElement("div");
                    nodeDiv.className = "tree-item node-item";
                    nodeDiv.innerText = `${node.name} (${node.type}${node.controller ? ", ctrl: " + node.controller : ""})`;
                    nodeDiv.dataset.type = "node";
                    nodeDiv.dataset.scene = sceneName;
                    nodeDiv.dataset.name = node.name;

                    // Click node → open touch editor if controller exists
                    nodeDiv.addEventListener("click", () => {
                        if (node.controller) {
                            GodotState.activeController = node.controller;
                            openTouchEditor();
                        } else {
                            addMessage("system", `Node "${node.name}" has no controller assigned.`);
                        }
                    });

                    nodeList.appendChild(nodeDiv);
                });

                sceneDiv.appendChild(nodeList);
            }

            treeContainer.appendChild(sceneDiv);
        });

        highlightSelectedTreeItem();
    }

    function highlightSelectedTreeItem() {
        const items = treeContainer.querySelectorAll(".tree-item");
        items.forEach(item => item.classList.remove("selected"));

        if (GodotState.currentScene) {
            const sceneItem = treeContainer.querySelector(`.scene-item[data-name="${GodotState.currentScene}"]`);
            if (sceneItem) sceneItem.classList.add("selected");
        }
    }

    // Expose globally
    window.renderProjectTree = renderProjectTree;

})();
