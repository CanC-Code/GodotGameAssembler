// core/project_graph.js
// Author: CCVO
// Purpose: Central project graph manager for GodotGameAssembler
// Tracks scenes, nodes, scripts, assets, and prepares export-ready projects

class ProjectGraph {
    constructor() {
        this.scenes = {};   // scene_name -> scene_data
        this.assets = {};   // asset_path -> asset_data
        this.templates = {
            Snake: null, // can later load templates if desired
            TicTacToe: null,
            RPG: null
        };

        // Event callbacks
        this.onSceneAdded = null;
        this.onNodeAdded = null;
        this.onScriptAdded = null;
        this.onAssetAdded = null;
        this.onProjectReadyForExport = null;

        console.log("ProjectGraph initialized with templates:", Object.keys(this.templates));
    }

    // ------------------------------
    // Scene Management
    // ------------------------------
    addScene(sceneName) {
        if (this.scenes[sceneName]) {
            console.warn(`Scene '${sceneName}' already exists.`);
            return false;
        }
        this.scenes[sceneName] = {
            nodes: {},
            scripts: {},
            root_node_type: "Node2D"
        };
        if (typeof this.onSceneAdded === "function") this.onSceneAdded(sceneName);
        return true;
    }

    removeScene(sceneName) {
        if (!this.scenes[sceneName]) {
            console.warn(`Scene '${sceneName}' does not exist.`);
            return false;
        }
        delete this.scenes[sceneName];
        return true;
    }

    getScene(sceneName) {
        return this.scenes[sceneName] || null;
    }

    // ------------------------------
    // Node Management
    // ------------------------------
    addNode(sceneName, nodeName, nodeType="Node2D", parentName="") {
        const scene = this.getScene(sceneName);
        if (!scene) return false;
        if (scene.nodes[nodeName]) {
            console.warn(`Node '${nodeName}' already exists in scene '${sceneName}'.`);
            return false;
        }
        scene.nodes[nodeName] = {
            type: nodeType,
            parent: parentName,
            properties: {},
            scripts: []
        };
        if (typeof this.onNodeAdded === "function") this.onNodeAdded(sceneName, nodeName);
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

    attachScriptToNode(sceneName, nodeName, scriptName) {
        const scene = this.getScene(sceneName);
        if (!scene || !scene.nodes[nodeName]) return false;
        scene.nodes[nodeName].scripts.push(scriptName);
        if (typeof this.onScriptAdded === "function") this.onScriptAdded(sceneName, scriptName);
        return true;
    }

    // ------------------------------
    // Script Management
    // ------------------------------
    addScript(sceneName, scriptName, scriptCode) {
        const scene = this.getScene(sceneName);
        if (!scene) return false;
        if (scene.scripts[scriptName]) {
            console.warn(`Script '${scriptName}' already exists in scene '${sceneName}'.`);
            return false;
        }
        scene.scripts[scriptName] = scriptCode;
        if (typeof this.onScriptAdded === "function") this.onScriptAdded(sceneName, scriptName);
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
    addAsset(assetPath, assetData) {
        if (this.assets[assetPath]) {
            console.warn(`Asset '${assetPath}' already exists.`);
            return false;
        }
        this.assets[assetPath] = assetData;
        if (typeof this.onAssetAdded === "function") this.onAssetAdded(assetPath);
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

    getScenes() {
        return this.scenes;
    }

    // ------------------------------
    // Export Placeholder
    // ------------------------------
    exportProjectZip(outputPath) {
        console.log(`Export requested to '${outputPath}'`);
        if (typeof this.onProjectReadyForExport === "function") this.onProjectReadyForExport(outputPath);
        return true;
    }

    // ------------------------------
    // Scene file generation (tscn)
    // ------------------------------
    generateSceneFile(sceneName) {
        const scene = this.getScene(sceneName);
        if (!scene) return null;
        let sceneText = `[gd_scene load_steps=2 format=2]\n`;
        sceneText += `[node name="${sceneName}" type="${scene.root_node_type}"]\n`;
        for (const nodeName in scene.nodes) {
            const node = scene.nodes[nodeName];
            sceneText += `[node name="${nodeName}" type="${node.type}" parent="${node.parent}"]\n`;
            for (const prop in node.properties) {
                sceneText += `${prop} = ${JSON.stringify(node.properties[prop])}\n`;
            }
            for (const scriptName of node.scripts) {
                sceneText += `script = ExtResource( ${scriptName} )\n`;
            }
        }
        return sceneText;
    }
}

// Expose globally
window.ProjectGraph = ProjectGraph;