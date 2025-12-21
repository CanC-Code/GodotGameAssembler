// core/project_graph.js
// Author: CCVO
// Purpose: Scene + node + asset + folder graph for GodotGameAssembler
// Tracks scenes, nodes, assets, folders in-memory

class ProjectGraph {
    constructor() {
        this.scenes = {}; // SceneName -> { nodes: { NodeName -> {type,parent,children,scripts} } }
        this.assets = {}; // AssetPath -> {name, type, extension, folder, data}
        this.folders = {}; // FolderPath -> { name, parent, files: [], subfolders: [] }
    }

    // -----------------------------
    // Scene Management
    // -----------------------------
    addScene(sceneName) {
        if (this.scenes[sceneName]) return false;
        this.scenes[sceneName] = { nodes: {} };
        return true;
    }

    getScenes() {
        return Object.keys(this.scenes);
    }

    getScene(sceneName) {
        return this.scenes[sceneName] || null;
    }

    hasScene(sceneName) {
        return !!this.scenes[sceneName];
    }

    // -----------------------------
    // Node Management
    // -----------------------------
    addNode(sceneName, nodeName, nodeType = "Node2D", parentName = null) {
        const scene = this.scenes[sceneName];
        if (!scene) return false;
        if (scene.nodes[nodeName]) return false;

        scene.nodes[nodeName] = {
            type: nodeType,
            parent: parentName || null,
            children: [],
            scripts: []
        };

        if (parentName && scene.nodes[parentName]) {
            scene.nodes[parentName].children.push(nodeName);
        }

        return true;
    }

    getNode(sceneName, nodeName) {
        const scene = this.scenes[sceneName];
        if (!scene) return null;
        return scene.nodes[nodeName] || null;
    }

    attachScript(sceneName, nodeName, scriptName) {
        const node = this.getNode(sceneName, nodeName);
        if (!node) return false;
        if (!node.scripts.includes(scriptName)) node.scripts.push(scriptName);
        return true;
    }

    // -----------------------------
    // Asset / Folder Management
    // -----------------------------
    addFolder(path, parent = null) {
        if (this.folders[path]) return false;
        this.folders[path] = { name: path.split("/").pop(), parent: parent, files: [], subfolders: [] };
        if (parent && this.folders[parent]) {
            this.folders[parent].subfolders.push(path);
        }
        return true;
    }

    addAsset(path, type, extension, folder = null, data = null) {
        if (this.assets[path]) return false;
        this.assets[path] = { name: path.split("/").pop(), type, extension, folder, data };
        if (folder) {
            if (!this.folders[folder]) this.addFolder(folder);
            this.folders[folder].files.push(path);
        }
        return true;
    }

    getAsset(path) {
        return this.assets[path] || null;
    }

    getFolderContents(folderPath) {
        const folder = this.folders[folderPath];
        if (!folder) return { files: [], subfolders: [] };
        return {
            files: folder.files.map(f => this.assets[f]),
            subfolders: folder.subfolders.map(f => this.folders[f])
        };
    }

    // -----------------------------
    // Export Helpers
    // -----------------------------
    getSceneFile(sceneName) {
        return this.scenes[sceneName] || null;
    }
}

// Expose globally
window.ProjectGraph = ProjectGraph;

console.log("ProjectGraph loaded.");