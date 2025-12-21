// core/scene_serializer.js
// Author: CCVO
// Purpose:
// Serialize an in-memory SceneModel into a valid Godot 4.x .tscn file.
// Output MUST round-trip: load in Godot -> save -> reload unchanged.

class SceneSerializer {
    constructor(projectModel) {
        this.project = projectModel;
    }

    // =====================================================
    // Public API
    // =====================================================

    serializeScene(scenePath) {
        const scene = this.project.getScene(scenePath);
        if (!scene) {
            throw new Error(`Scene not found: ${scenePath}`);
        }

        const lines = [];

        // ---- Header ----
        lines.push('[gd_scene load_steps=1 format=3]');
        lines.push('');

        // ---- Nodes ----
        this._serializeNodeRecursive(
            scene,
            scene.rootNodeId,
            null,
            lines
        );

        return lines.join('\n');
    }

    // =====================================================
    // Internal Helpers
    // =====================================================

    _serializeNodeRecursive(scene, nodeId, parentPath, lines) {
        const node = scene.nodes[nodeId];
        if (!node) return;

        const nodePath = parentPath ? `${parentPath}/${node.id}` : node.id;

        // ---- Node header ----
        const nodeHeaderParts = [
            `[node name="${node.id}"`,
            `type="${node.type}"`
        ];

        if (parentPath) {
            nodeHeaderParts.push(`parent="${parentPath}"`);
        }

        lines.push(nodeHeaderParts.join(' ') + ']');

        // ---- Properties ----
        for (const prop in node.properties) {
            const value = this._serializeValue(node.properties[prop]);
            lines.push(`${prop} = ${value}`);
        }

        // ---- Script ----
        if (node.script) {
            lines.push(
                `script = ExtResource("${node.script}")`
            );
        }

        lines.push('');

        // ---- Children ----
        for (const childId of node.children) {
            this._serializeNodeRecursive(
                scene,
                childId,
                nodePath,
                lines
            );
        }
    }

    _serializeValue(value) {
        if (typeof value === 'string') {
            return `"${value}"`;
        }

        if (typeof value === 'number') {
            return value.toString();
        }

        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }

        if (Array.isArray(value)) {
            return `[${value.map(v => this._serializeValue(v)).join(', ')}]`;
        }

        if (typeof value === 'object' && value !== null) {
            // Godot dictionary
            const entries = Object.entries(value).map(
                ([k, v]) => `"${k}": ${this._serializeValue(v)}`
            );
            return `{ ${entries.join(', ')} }`;
        }

        return 'null';
    }
}

// Expose globally
window.SceneSerializer = SceneSerializer;

console.log("SceneSerializer loaded.");
