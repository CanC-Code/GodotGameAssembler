// scene_composer.js
// Author: CCVO
// Purpose: Converts ProjectGraph data into actual .tscn scenes and .gd scripts
// Ready for export as a fully functional Godot project

class SceneComposer {
    constructor(projectGraph) {
        this.projectGraph = projectGraph || {}; // Object with scenes, nodes, scripts
        this.onSceneFileGenerated = null; // callback(sceneName, filePath)
        this.onScriptFileGenerated = null; // callback(scriptName, filePath)
    }

    // ------------------------------
    // Public API
    // ------------------------------

    composeAllScenes(projectName = "GodotProject") {
        if (!this.projectGraph || !this.projectGraph.scenes) {
            console.error("SceneComposer requires a valid ProjectGraph instance.");
            return null;
        }

        const zip = new JSZip();

        for (const sceneName in this.projectGraph.scenes) {
            const sceneData = this.projectGraph.scenes[sceneName];

            // --- Generate Scene File ---
            const sceneText = this._generateSceneText(sceneName, sceneData);
            zip.file(`${projectName}/${sceneName}.tscn`, sceneText);
            if (typeof this.onSceneFileGenerated === "function") {
                this.onSceneFileGenerated(sceneName, `${projectName}/${sceneName}.tscn`);
            }

            // --- Scripts ---
            for (const scriptName in sceneData.scripts) {
                const code = sceneData.scripts[scriptName];
                zip.file(`${projectName}/scripts/${scriptName}.gd`, code);
                if (typeof this.onScriptFileGenerated === "function") {
                    this.onScriptFileGenerated(scriptName, `${projectName}/scripts/${scriptName}.gd`);
                }
            }
        }

        // --- Made-by Slide ---
        const introScene = `[node name="MadeByIntro" type="Label" parent=""]\ntext = "Made with GodotGameAssembler by CCVO"\n`;
        zip.file(`${projectName}/MadeByIntro.tscn`, introScene);

        return zip;
    }

    // ------------------------------
    // Scene Generation
    // ------------------------------

    _generateSceneText(sceneName, sceneData) {
        let text = `[gd_scene load_steps=2 format=2]\n`;
        text += `[node name="${sceneName}" type="${sceneData.root_node_type || "Node2D"}"]\n`;

        for (const nodeName in sceneData.nodes) {
            const node = sceneData.nodes[nodeName];
            text += `[node name="${nodeName}" type="${node.type}" parent="${node.parent || ""}"]\n`;

            // Properties
            for (const prop in node.properties) {
                text += `${prop} = ${this._valueToString(node.properties[prop])}\n`;
            }

            // Scripts
            for (const scriptName of node.scripts) {
                text += `script = ExtResource(${scriptName})\n`;
            }
        }

        return text;
    }

    // ------------------------------
    // Utility
    // ------------------------------

    _valueToString(value) {
        if (typeof value === "string") return `"${value}"`;
        if (typeof value === "boolean") return String(value);
        if (value && typeof value === "object") {
            if ("x" in value && "y" in value && !"z" in value) return `Vector2(${value.x}, ${value.y})`;
            if ("x" in value && "y" in value && "z" in value) return `Vector3(${value.x}, ${value.y}, ${value.z})`;
            if ("r" in value && "g" in value && "b" in value && "a" in value)
                return `Color(${value.r}, ${value.g}, ${value.b}, ${value.a})`;
        }
        return String(value);
    }

    // ------------------------------
    // Event Registration
    // ------------------------------

    setSceneFileGeneratedCallback(callback) {
        if (typeof callback === "function") this.onSceneFileGenerated = callback;
    }

    setScriptFileGeneratedCallback(callback) {
        if (typeof callback === "function") this.onScriptFileGenerated = callback;
    }
}

// Expose globally
window.SceneComposer = SceneComposer;