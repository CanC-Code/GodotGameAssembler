// core/project_graph.js
// Author: CCVO
// Purpose: Central project graph manager for GodotGameAssembler
// Tracks scenes, nodes, scripts, assets, and prepares export-ready projects

class ProjectGraph {
    constructor() {
        this.scenes = {};   // sceneName -> sceneData
        this.assets = {};   // assetPath -> { data, type }

        this.templates = {
            Snake: null,
            TicTacToe: null,
            RPG: null
        };

        // Event callbacks
        this.onSceneAdded = null;
        this.onNodeAdded = null;
        this.onScriptAdded = null;
        this.onAssetAdded = null;
        this.onProjectReadyForExport = null;

        console.log(
            "ProjectGraph initialized. Templates:",
            Object.keys(this.templates)
        );
    }

    // ------------------------------
    // Scene Management
    // ------------------------------
    addScene(sceneName) {
        if (!sceneName || this.scenes[sceneName]) {
            console.warn(`Scene '${sceneName}' already exists or invalid.`);
            return false;
        }

        this.scenes[sceneName] = {
            root_node_type: "Node2D",
            nodes: {},
            scripts: {}
        };

        if (typeof this.onSceneAdded === "function") {
            this.onSceneAdded(sceneName);
        }
        return true;
    }

    removeScene(sceneName) {
        if (!this.scenes[sceneName]) return false;
        delete this.scenes[sceneName];
        return true;
    }

    getScene(sceneName) {
        return this.scenes[sceneName] || null;
    }

    getScenes() {
        return this.scenes;
    }

    // ------------------------------
    // Node Management
    // ------------------------------
    addNode(sceneName, nodeName, nodeType = "Node2D", parentName = "") {
        const scene = this.getScene(sceneName);
        if (!scene) return false;

        if (scene.nodes[nodeName]) {
            console.warn(
                `Node '${nodeName}' already exists in scene '${sceneName}'.`
            );
            return false;
        }

        scene.nodes[nodeName] = {
            type: nodeType,
            parent: parentName,
            properties: {},
            scripts: [] // script filenames
        };

        if (typeof this.onNodeAdded === "function") {
            this.onNodeAdded(sceneName, nodeName);
        }

        return true;
    }

    removeNode(sceneName, nodeName) {
        const scene = this.getScene(sceneName);
        if (!scene || !scene.nodes[nodeName]) return false;
        delete scene.nodes[nodeName];
        return true;
    }

    setNodeProperty(sceneName, nodeName, propertyName, value) {
        const scene = this.getScene(sceneName);
        if (!scene || !scene.nodes[nodeName]) return false;

        scene.nodes[nodeName].properties[propertyName] = value;
        return true;
    }

    attachScriptToNode(sceneName, nodeName, scriptFileName) {
        const scene = this.getScene(sceneName);
        if (!scene || !scene.nodes[nodeName]) return false;

        if (!scene.scripts[scriptFileName]) {
            console.warn(
                `Script '${scriptFileName}' does not exist in scene '${sceneName}'.`
            );
            return false;
        }

        scene.nodes[nodeName].scripts.push(scriptFileName);

        if (typeof this.onScriptAdded === "function") {
            this.onScriptAdded(sceneName, scriptFileName);
        }

        return true;
    }

    // ------------------------------
    // Script Management
    // ------------------------------
    addScript(sceneName, scriptName, scriptCode = "") {
        const scene = this.getScene(sceneName);
        if (!scene) return false;

        if (scene.scripts[scriptName]) {
            console.warn(
                `Script '${scriptName}' already exists in scene '${sceneName}'.`
            );
            return false;
        }

        scene.scripts[scriptName] = scriptCode;

        if (typeof this.onScriptAdded === "function") {
            this.onScriptAdded(sceneName, scriptName);
        }

        return true;
    }

    removeScript(sceneName, scriptName) {
        const scene = this.getScene(sceneName);
        if (!scene || !scene.scripts[scriptName]) return false;
        delete scene.scripts[scriptName];
        return true;
    }

    // ------------------------------
    // Asset Management
    // ------------------------------
    addAsset(assetPath, assetData, assetType = "binary") {
        if (this.assets[assetPath]) {
            console.warn(`Asset '${assetPath}' already exists.`);
            return false;
        }

        this.assets[assetPath] = {
            data: assetData,
            type: assetType
        };

        if (typeof this.onAssetAdded === "function") {
            this.onAssetAdded(assetPath);
        }

        return true;
    }

    removeAsset(assetPath) {
        if (!this.assets[assetPath]) return false;
        delete this.assets[assetPath];
        return true;
    }

    getAsset(assetPath) {
        return this.assets[assetPath] || null;
    }

    listAssets() {
        return this.assets;
    }

    // ------------------------------
    // Export Hook
    // ------------------------------
    exportProjectZip(outputPath) {
        console.log(`Export requested → ${outputPath}`);
        if (typeof this.onProjectReadyForExport === "function") {
            this.onProjectReadyForExport(outputPath);
        }
        return true;
    }
}

// Expose globally
window.ProjectGraph = ProjectGraph;
