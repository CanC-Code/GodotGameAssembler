// core/scene_model.js
// Author: CCVO
// Purpose:
// Defines canonical scene structures for Godot Game Assembler.
// This is the semantic backbone that allows NLP-driven game creation
// to reason about scenes like a human designer would.

class SceneModel {
    constructor(sceneName, role = "gameplay") {
        this.name = sceneName;
        this.role = role;

        // Core properties
        this.rootType = this._inferRootType(role);
        this.nodes = {};
        this.metadata = {
            description: "",
            entryScene: false,
            transitionTarget: null
        };

        // Auto-bootstrap required systems
        this._bootstrap();
    }

    // =====================================================
    // Scene Roles
    // =====================================================

    _inferRootType(role) {
        switch (role) {
            case "menu":
            case "ui":
                return "Control";
            case "cutscene":
                return "Node";
            case "gameplay_3d":
                return "Node3D";
            case "gameplay":
            default:
                return "Node2D";
        }
    }

    // =====================================================
    // Bootstrap Defaults
    // =====================================================

    _bootstrap() {
        // Root
        this.nodes["Root"] = {
            type: this.rootType,
            parent: null,
            children: [],
            scripts: []
        };

        // Camera
        if (this.rootType === "Node2D") {
            this._addNode("Camera2D", "Camera2D", "Root");
        }

        if (this.rootType === "Node3D") {
            this._addNode("Camera3D", "Camera3D", "Root");
        }

        // UI Layer
        this._addNode("UI", "CanvasLayer", "Root");

        // Input abstraction
        this._addNode("Input", "Node", "Root");

        // Game logic anchor
        this._addNode("Game", "Node", "Root");
    }

    // =====================================================
    // Node Management
    // =====================================================

    _addNode(name, type, parent) {
        if (this.nodes[name]) return;

        this.nodes[name] = {
            type,
            parent,
            children: [],
            scripts: []
        };

        if (this.nodes[parent]) {
            this.nodes[parent].children.push(name);
        }
    }

    addNode(name, type, parent = "Root") {
        this._addNode(name, type, parent);
    }

    attachScript(nodeName, scriptName) {
        const node = this.nodes[nodeName];
        if (!node) return false;
        if (!node.scripts.includes(scriptName)) {
            node.scripts.push(scriptName);
        }
        return true;
    }

    // =====================================================
    // Scene Semantics
    // =====================================================

    setDescription(text) {
        this.metadata.description = text;
    }

    markAsEntryScene() {
        this.metadata.entryScene = true;
    }

    setTransitionTarget(sceneName) {
        this.metadata.transitionTarget = sceneName;
    }

    // =====================================================
    // Serialization Target
    // =====================================================

    toGraphFormat() {
        return {
            nodes: this.nodes,
            metadata: this.metadata,
            role: this.role,
            rootType: this.rootType
        };
    }
}

// =====================================================
// Scene Model Registry
// =====================================================

class SceneModelRegistry {
    constructor() {
        this.scenes = {};
    }

    createScene(name, role = "gameplay") {
        if (this.scenes[name]) return null;
        const model = new SceneModel(name, role);
        this.scenes[name] = model;
        return model;
    }

    getScene(name) {
        return this.scenes[name] || null;
    }

    listScenes() {
        return Object.keys(this.scenes);
    }
}

// Expose globally
window.SceneModel = SceneModel;
window.SceneModelRegistry = SceneModelRegistry;

console.log("SceneModel system loaded.");
