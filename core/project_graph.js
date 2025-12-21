// core/project_graph.js
// Author: CCVO
// Purpose: Scene + node dependency graph for GodotGameAssembler
// Tracks scenes, nodes, hierarchy, and scripts in-memory

class ProjectGraph {
    constructor() {
        this.scenes = {}; 
        // structure:
        // scenes = {
        //   SceneName: {
        //     nodes: {
        //       NodeName: {
        //         type: "Node2D",
        //         parent: null | "OtherNode",
        //         children: [],
        //         scripts: []
        //       }
        //     }
        //   }
        // }
    }

    // -----------------------------
    // Scene Management
    // -----------------------------
    addScene(sceneName) {
        if (this.scenes[sceneName]) {
            return false;
        }

        this.scenes[sceneName] = { nodes: {} };
        return true;
    }

    getScenes() {
        return Object.keys(this.scenes);
    }

    hasScene(sceneName) {
        return !!this.scenes[sceneName];
    }

    // -----------------------------
    // Node Management
    // -----------------------------
    addNode(sceneName, nodeName, nodeType, parentName = null) {
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

    // -----------------------------
    // Script Management
    // -----------------------------
    attachScript(sceneName, nodeName, scriptName) {
        const node = this.getNode(sceneName, nodeName);
        if (!node) return false;

        if (!node.scripts.includes(scriptName)) {
            node.scripts.push(scriptName);
        }

        return true;
    }

    // -----------------------------
    // Export Helpers
    // -----------------------------
    getSceneGraph(sceneName) {
        return this.scenes[sceneName] || null;
    }
}

// Expose globally
window.ProjectGraph = ProjectGraph;

console.log("ProjectGraph loaded.");
