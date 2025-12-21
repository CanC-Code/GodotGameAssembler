// core/graph_bridge.js
// Author: CCVO
// Purpose:
// Bridges SceneModel semantic scenes with ProjectGraph storage.
// Ensures NLP-driven commands produce a fully connected scene graph.

(function () {

    if (!window.ProjectGraph) throw new Error("ProjectGraph not loaded");
    if (!window.SceneModelRegistry) throw new Error("SceneModelRegistry not loaded");

    class GraphBridge {
        constructor(graph) {
            this.graph = graph;
            this.registry = new SceneModelRegistry();
        }

        // -----------------------------
        // Scene Creation
        // -----------------------------
        createScene(name, role = "gameplay") {
            if (!name) return { success: false, message: "Scene name required" };

            // Create the semantic scene
            const model = this.registry.createScene(name, role);
            if (!model) return { success: false, message: `Scene '${name}' already exists` };

            // Push into ProjectGraph
            this.graph.addScene(name);
            for (const nodeName in model.nodes) {
                const node = model.nodes[nodeName];
                this.graph.addNode(name, nodeName, node.type, node.parent);
                node.scripts.forEach(script => this.graph.attachScript(name, nodeName, script));
            }

            return { success: true, message: `Scene '${name}' created` };
        }

        getSceneModel(name) {
            return this.registry.getScene(name);
        }

        listScenes() {
            return this.registry.listScenes();
        }

        // -----------------------------
        // Node Management
        // -----------------------------
        addNode(sceneName, nodeName, type, parent = "Root") {
            const model = this.getSceneModel(sceneName);
            if (!model) return { success: false, message: "Scene not found" };

            model.addNode(nodeName, type, parent);
            this.graph.addNode(sceneName, nodeName, type, parent);

            return { success: true, message: `Node '${nodeName}' added to '${sceneName}'` };
        }

        attachScript(sceneName, nodeName, scriptName) {
            const model = this.getSceneModel(sceneName);
            if (!model) return { success: false, message: "Scene not found" };

            const success = model.attachScript(nodeName, scriptName);
            if (!success) return { success: false, message: `Node '${nodeName}' not found in scene` };

            this.graph.attachScript(sceneName, nodeName, scriptName);

            return { success: true, message: `Script '${scriptName}' attached to '${nodeName}'` };
        }

        // -----------------------------
        // Metadata
        // -----------------------------
        setSceneDescription(sceneName, description) {
            const model = this.getSceneModel(sceneName);
            if (!model) return { success: false, message: "Scene not found" };
            model.setDescription(description);
            return { success: true, message: "Description set" };
        }

        markEntryScene(sceneName) {
            const model = this.getSceneModel(sceneName);
            if (!model) return { success: false, message: "Scene not found" };
            model.markAsEntryScene();
            return { success: true, message: "Scene marked as entry scene" };
        }

        setTransition(sceneName, targetScene) {
            const model = this.getSceneModel(sceneName);
            if (!model) return { success: false, message: "Scene not found" };
            model.setTransitionTarget(targetScene);
            return { success: true, message: `Transition set to '${targetScene}'` };
        }

        // -----------------------------
        // Export Helpers
        // -----------------------------
        getSceneFile(sceneName) {
            const model = this.getSceneModel(sceneName);
            if (!model) return null;
            return model.toGraphFormat();
        }

    }

    // Expose globally
    window.GraphBridge = GraphBridge;

    console.log("GraphBridge loaded.");

})();
