// scene_composer.js
// Author: CCVO
// Purpose: Converts ProjectGraph data into actual .tscn scenes and .gd scripts
// Fully compatible with ProjectManager / NLP setup

class SceneComposer {
    constructor(graph) {
        this.graph = graph || {}; // expects ProjectGraph instance
        this.onSceneFileGenerated = null; // callback(sceneName, filePath)
        this.onScriptFileGenerated = null; // callback(scriptName, filePath)
    }

    // ------------------------------
    // Public API
    // ------------------------------

    composeAllScenes(projectName = "GodotProject") {
        if (!this.graph || !this.graph.scenes) {
            console.error("SceneComposer requires a valid ProjectGraph instance.");
            return null;
        }

        const zip = new JSZip();

        for (const sceneName in this.graph.scenes) {
            const sceneData = this.graph.scenes[sceneName];

            // --- Generate Scene File ---
            const sceneText = this._generateSceneText(sceneName, sceneData);
            zip.file(`${projectName}/${sceneName}.tscn`, sceneText);
            if (typeof this.onSceneFileGenerated === "function") {
                this.onSceneFileGenerated(sceneName, `${projectName}/${sceneName}.tscn`);
            }

            // --- Export all scripts attached to nodes ---
            for (const nodeName in sceneData.nodes) {
                const node = sceneData.nodes[nodeName];
                for (const scriptName of node.scripts) {
                    const code = this.graph.scripts[scriptName] || "# missing script code";
                    zip.file(`${projectName}/scripts/${scriptName}.gd`, code);
                    if (typeof this.onScriptFileGenerated === "function") {
                        this.onScriptFileGenerated(scriptName, `${projectName}/scripts/${scriptName}.gd`);
                    }
                }
            }
        }

        // --- Add a Made-by intro scene ---
        const introScene = `[node name="MadeByIntro" type="Label" parent=""]\ntext = "Made with GodotGameAssembler by CCVO"\n`;
        zip.file(`${projectName}/MadeByIntro.tscn`, introScene);

        return zip;
    }

    async exportProjectZip(projectName = "GodotProject") {
        const zip = this.composeAllScenes(projectName);
        return await zip.generateAsync({ type: "blob" });
    }

    // ------------------------------
    // Scene Generation
    // ------------------------------

    _generateSceneText(sceneName, sceneData) {
        let text = `[gd_scene load_steps=2 format=2]\n`;
        text += `[node name="${sceneName}" type="${sceneData.rootType || "Node2D"}"]\n`;

        for (const nodeName in sceneData.nodes) {
            const node = sceneData.nodes[nodeName];
            text += `[node name="${nodeName}" type="${node.type}" parent="${node.parent || ""}"]\n`;

            // --- Node Properties ---
            for (const prop in node.properties) {
                text += `${prop} = ${this._valueToString(node.properties[prop])}\n`;
            }

            // --- Node Scripts ---
            for (const scriptName of node.scripts) {
                text += `script = "res://scripts/${scriptName}.gd"\n`;
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
            if ("x" in value && "y" in value && !("z" in value)) return `Vector2(${value.x}, ${value.y})`;
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
