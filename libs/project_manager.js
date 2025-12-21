// project_manager.js
// Author: CCVO
// Purpose: Browser-side ProjectManager for GodotGameAssembler
// Combines ProjectGraph, SceneComposer, and AssetHandler

class ProjectGraph {
    constructor() {
        this.scenes = {}; // scene_name -> { nodes, scripts, root_node_type }
        this.assets = {}; // asset_path -> { type, data, original_name }
    }

    // ------------------------------
    // Scene Management
    // ------------------------------

    addScene(sceneName) {
        if (this.scenes[sceneName]) {
            console.warn(`Scene '${sceneName}' already exists.`);
            return false;
        }
        this.scenes[sceneName] = { nodes: {}, scripts: {}, root_node_type: "Node2D" };
        return true;
    }

    getScene(sceneName) {
        return this.scenes[sceneName] || null;
    }

    addNode(sceneName, nodeName, nodeType = "Node2D", parentName = "") {
        const scene = this.getScene(sceneName);
        if (!scene) return false;
        if (scene.nodes[nodeName]) {
            console.warn(`Node '${nodeName}' already exists in scene '${sceneName}'.`);
            return false;
        }
        scene.nodes[nodeName] = { type: nodeType, parent: parentName, properties: {}, scripts: [] };
        return true;
    }

    attachScriptToNode(sceneName, nodeName, scriptName) {
        const scene = this.getScene(sceneName);
        if (!scene || !scene.nodes[nodeName]) return false;
        scene.nodes[nodeName].scripts.push(scriptName);
        return true;
    }

    addScript(sceneName, scriptName, scriptCode) {
        const scene = this.getScene(sceneName);
        if (!scene) return false;
        scene.scripts[scriptName] = scriptCode;
        return true;
    }

    // ------------------------------
    // Asset Management
    // ------------------------------

    addAsset(assetPath, assetType, assetData) {
        if (this.assets[assetPath]) {
            console.warn(`Asset '${assetPath}' already exists.`);
            return false;
        }
        this.assets[assetPath] = { type: assetType, data: assetData, original_name: assetPath.split("/").pop() };
        return true;
    }

    getAsset(assetPath) {
        return this.assets[assetPath] || null;
    }

    listAssets() {
        return Object.keys(this.assets);
    }
}

class SceneComposer {
    constructor(projectGraph) {
        this.projectGraph = projectGraph;
    }

    composeAllScenes() {
        const output = {};
        for (const sceneName in this.projectGraph.scenes) {
            const sceneData = this.projectGraph.scenes[sceneName];
            output[sceneName] = this._generateSceneFile(sceneName, sceneData);
        }
        return output;
    }

    _generateSceneFile(sceneName, sceneData) {
        let text = `[gd_scene load_steps=2 format=2]\n`;
        text += `[node name="${sceneName}" type="${sceneData.root_node_type}"]\n`;

        for (const nodeName in sceneData.nodes) {
            const node = sceneData.nodes[nodeName];
            text += `[node name="${nodeName}" type="${node.type}" parent="${node.parent}"]\n`;
            for (const prop in node.properties) {
                text += `${prop} = ${this._valueToString(node.properties[prop])}\n`;
            }
            for (const scriptName of node.scripts) {
                text += `script = ExtResource( ${scriptName} )\n`;
            }
        }
        return text;
    }

    _valueToString(value) {
        if (typeof value === "string") return `"${value}"`;
        if (Array.isArray(value) && value.length === 2) return `Vector2(${value[0]}, ${value[1]})`;
        if (Array.isArray(value) && value.length === 3) return `Vector3(${value[0]}, ${value[1]}, ${value[2]})`;
        if (typeof value === "boolean") return value ? "true" : "false";
        return value.toString();
    }
}

class ZipExporter {
    constructor(projectGraph, sceneComposer, assetHandler) {
        this.projectGraph = projectGraph;
        this.sceneComposer = sceneComposer;
        this.assetHandler = assetHandler;
    }

    async generateZip(projectName) {
        const zip = new JSZip();

        // --- Scenes & Scripts ---
        const scenes = this.sceneComposer.composeAllScenes();
        for (const sceneName in scenes) {
            zip.file(`${projectName}/${sceneName}.tscn`, scenes[sceneName]);

            const sceneData = this.projectGraph.getScene(sceneName);
            for (const scriptName in sceneData.scripts) {
                zip.file(`${projectName}/scripts/${scriptName}.gd`, sceneData.scripts[scriptName]);
            }
        }

        // --- Assets ---
        this.assetHandler.exportAssets(`${projectName}/assets`, zip);

        // --- Made-by Slide ---
        const introScene = `[node name="MadeByIntro" type="Label" parent=""]\ntext = "Made with GodotGameAssembler by CCVO"\n`;
        zip.file(`${projectName}/MadeByIntro.tscn`, introScene);

        const content = await zip.generateAsync({ type: "blob" });
        return content;
    }
}

// ------------------------------
// Global Singleton
// ------------------------------

const ProjectManager = {
    projectGraph: new ProjectGraph(),
    assetHandler: new AssetHandler(),
    sceneComposer: null,
    zipExporter: null,

    init() {
        this.sceneComposer = new SceneComposer(this.projectGraph);
        this.zipExporter = new ZipExporter(this.projectGraph, this.sceneComposer, this.assetHandler);
    },

    // --- Scene API ---
    add_scene(name) { return this.projectGraph.addScene(name); },
    add_node(scene, node, type, parent) { return this.projectGraph.addNode(scene, node, type, parent); },
    add_script(scene, scriptName, code) { return this.projectGraph.addScript(scene, scriptName, code); },

    // --- Node API ---
    attach_script(scene, node, script) { return this.projectGraph.attachScriptToNode(scene, node, script); },

    // --- Asset API ---
    upload_asset(path, type, data) { return this.assetHandler.addAsset(path, type, data); },
    list_assets() { return this.projectGraph.listAssets(); },

    // --- Export API ---
    async generate_project(projectName) { return await this.zipExporter.generateZip(projectName); },

    // --- NLP placeholder ---
    process_nlp_command(cmd) {
        // Example: just echo for now
        return `Processed command: ${cmd}`;
    },

    get_scenes() { return this.projectGraph.scenes; },
    get_scene_file(name) { return this.sceneComposer._generateSceneFile(name, this.projectGraph.getScene(name)); }
};

// Initialize on load
ProjectManager.init();
window.ProjectManager = ProjectManager;
