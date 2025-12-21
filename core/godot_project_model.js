// core/godot_project_model.js
// Author: CCVO
// Purpose:
// Canonical in-memory representation of a Godot project.
// This model MUST be able to round-trip a real Godot project:
// Import -> Modify -> Export -> Open in Godot with no breakage.

class GodotProjectModel {
    constructor() {
        // ---- Project-level data ----
        this.projectName = "UnnamedProject";
        this.godotVersion = "4.x";

        // Raw project.godot config representation
        // Stored as sections -> keys -> values
        this.projectConfig = {
            application: {
                config: {
                    name: this.projectName
                }
            },
            input: {},
            autoload: {},
            rendering: {},
            physics: {}
        };

        // ---- Scenes ----
        // scenePath -> SceneModel
        this.scenes = {};

        // ---- Scripts ----
        // scriptPath -> ScriptModel
        this.scripts = {};

        // ---- Resources (.tres / .res) ----
        // resourcePath -> ResourceModel
        this.resources = {};

        // ---- Assets (images, audio, models, etc.) ----
        // assetPath -> AssetModel
        this.assets = {};

        // ---- Folder tree ----
        // folderPath -> FolderModel
        this.folders = {};
    }

    // =====================================================
    // Project Metadata
    // =====================================================

    setProjectName(name) {
        this.projectName = name;
        if (
            this.projectConfig.application &&
            this.projectConfig.application.config
        ) {
            this.projectConfig.application.config.name = name;
        }
    }

    getProjectName() {
        return this.projectName;
    }

    // =====================================================
    // Folder Management
    // =====================================================

    ensureFolder(path) {
        if (this.folders[path]) return;

        const parts = path.split("/").filter(Boolean);
        let currentPath = "";

        for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            if (!this.folders[currentPath]) {
                this.folders[currentPath] = {
                    path: currentPath,
                    name: part,
                    files: [],
                    subfolders: []
                };

                const parentPath = currentPath.includes("/")
                    ? currentPath.substring(0, currentPath.lastIndexOf("/"))
                    : null;

                if (parentPath && this.folders[parentPath]) {
                    this.folders[parentPath].subfolders.push(currentPath);
                }
            }
        }
    }

    // =====================================================
    // Scene Management
    // =====================================================

    createScene(scenePath) {
        if (this.scenes[scenePath]) return false;

        this.ensureFolder(scenePath.substring(0, scenePath.lastIndexOf("/")));

        this.scenes[scenePath] = {
            path: scenePath,
            nodes: {},        // nodeId -> NodeModel
            rootNodeId: null,
            connections: [],  // signal connections
            resources: []     // external/local resources
        };

        return true;
    }

    getScene(scenePath) {
        return this.scenes[scenePath] || null;
    }

    // =====================================================
    // Node Management (Scene Graph)
    // =====================================================

    createNode(scenePath, nodeId, type, parentId = null) {
        const scene = this.scenes[scenePath];
        if (!scene) return false;
        if (scene.nodes[nodeId]) return false;

        scene.nodes[nodeId] = {
            id: nodeId,
            type,
            parent: parentId,
            children: [],
            properties: {},
            script: null
        };

        if (parentId) {
            const parent = scene.nodes[parentId];
            if (parent) parent.children.push(nodeId);
        } else {
            // No parent means root
            scene.rootNodeId = nodeId;
        }

        return true;
    }

    setNodeProperty(scenePath, nodeId, propertyName, value) {
        const node = this._getNode(scenePath, nodeId);
        if (!node) return false;
        node.properties[propertyName] = value;
        return true;
    }

    attachScriptToNode(scenePath, nodeId, scriptPath) {
        const node = this._getNode(scenePath, nodeId);
        if (!node) return false;
        node.script = scriptPath;
        return true;
    }

    _getNode(scenePath, nodeId) {
        const scene = this.scenes[scenePath];
        if (!scene) return null;
        return scene.nodes[nodeId] || null;
    }

    // =====================================================
    // Script Management
    // =====================================================

    createScript(scriptPath, language = "gdscript", source = "") {
        if (this.scripts[scriptPath]) return false;

        this.ensureFolder(scriptPath.substring(0, scriptPath.lastIndexOf("/")));

        this.scripts[scriptPath] = {
            path: scriptPath,
            language,
            source
        };

        return true;
    }

    updateScriptSource(scriptPath, source) {
        const script = this.scripts[scriptPath];
        if (!script) return false;
        script.source = source;
        return true;
    }

    // =====================================================
    // Resource Management
    // =====================================================

    createResource(resourcePath, type, properties = {}) {
        if (this.resources[resourcePath]) return false;

        this.ensureFolder(resourcePath.substring(0, resourcePath.lastIndexOf("/")));

        this.resources[resourcePath] = {
            path: resourcePath,
            type,
            properties
        };

        return true;
    }

    // =====================================================
    // Asset Management
    // =====================================================

    addAsset(assetPath, assetType, data = null) {
        if (this.assets[assetPath]) return false;

        this.ensureFolder(assetPath.substring(0, assetPath.lastIndexOf("/")));

        this.assets[assetPath] = {
            path: assetPath,
            type: assetType,
            data
        };

        return true;
    }

    // =====================================================
    // Input Map
    // =====================================================

    defineInputAction(actionName, events = []) {
        this.projectConfig.input[actionName] = events;
    }

    // =====================================================
    // Validation (Critical)
    // =====================================================

    validate() {
        // Basic integrity checks
        for (const scenePath in this.scenes) {
            const scene = this.scenes[scenePath];
            if (!scene.rootNodeId) {
                console.warn(`Scene ${scenePath} has no root node.`);
            }
        }
        return true;
    }
}

// Expose globally
window.GodotProjectModel = GodotProjectModel;

console.log("GodotProjectModel loaded.");
