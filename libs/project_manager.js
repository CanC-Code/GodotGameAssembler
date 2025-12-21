// project_manager.js
// Author: CCVO
// Purpose: Browser-side ProjectManager for GodotGameAssembler with NLP conversation
// Combines ProjectGraph, SceneComposer, AssetHandler, ZipExporter, and conversational NLP

// ------------------------------
// ProjectGraph
// ------------------------------
class ProjectGraph {
    constructor() {
        this.scenes = {}; // scene_name -> { nodes, scripts, root_node_type }
        this.assets = {}; // asset_path -> { type, data, original_name }
        this.tasks = [];  // For NLP task planning
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

    // ------------------------------
    // Task Planning for NLP
    // ------------------------------
    addTask(taskDescription) {
        this.tasks.push({ description: taskDescription, done: false });
        return true;
    }

    listTasks() {
        return this.tasks.map((t, i) => `${i + 1}. [${t.done ? "x" : " "}] ${t.description}`);
    }

    completeTask(index) {
        if (index < 0 || index >= this.tasks.length) return false;
        this.tasks[index].done = true;
        return true;
    }
}

// ------------------------------
// SceneComposer
// ------------------------------
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

// ------------------------------
// AssetHandler
// ------------------------------
class AssetHandler {
    constructor(projectGraph) {
        this.projectGraph = projectGraph;
    }

    addAsset(path, type, data) {
        return this.projectGraph.addAsset(path, type, data);
    }

    listAssets() {
        return this.projectGraph.listAssets();
    }

    exportAssets(basePath, zipInstance) {
        for (const assetPath of this.listAssets()) {
            const asset = this.projectGraph.getAsset(assetPath);
            zipInstance.file(`${basePath}/${assetPath}`, asset.data);
        }
    }
}

// ------------------------------
// ZipExporter
// ------------------------------
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

        return await zip.generateAsync({ type: "blob" });
    }
}

// ------------------------------
// NLP Engine
// ------------------------------
class NLP {
    constructor(projectGraph) {
        this.projectGraph = projectGraph;
        this.history = [];
    }

    process(input) {
        const text = input.trim();
        this.history.push(text);

        // Simple command-based interpretation
        if (/^hello$/i.test(text)) return "Hello! How’s our project going?";
        if (/project status/i.test(text)) return this._projectStatus();
        if (/tasks/i.test(text)) return this.projectGraph.listTasks().join("\n") || "No tasks defined.";
        if (/plan task (.+)/i.test(text)) {
            const task = text.match(/plan task (.+)/i)[1];
            this.projectGraph.addTask(task);
            return `Task added: ${task}`;
        }
        if (/complete task (\d+)/i.test(text)) {
            const idx = parseInt(text.match(/complete task (\d+)/i)[1], 10) - 1;
            const success = this.projectGraph.completeTask(idx);
            return success ? `Task ${idx+1} marked as done.` : `Task index invalid.`;
        }

        return `Sorry, I didn't understand that.`;
    }

    _projectStatus() {
        const scenes = Object.keys(this.projectGraph.scenes).length;
        const nodes = Object.values(this.projectGraph.scenes).reduce((acc, s) => acc + Object.keys(s.nodes).length, 0);
        const assets = Object.keys(this.projectGraph.assets).length;
        return `Project has ${scenes} scene(s), ${nodes} node(s), and ${assets} asset(s).`;
    }
}

// ------------------------------
// Global ProjectManager
// ------------------------------
const ProjectManager = {
    projectGraph: new ProjectGraph(),
    sceneComposer: null,
    assetHandler: null,
    zipExporter: null,
    nlp: null,

    init() {
        this.sceneComposer = new SceneComposer(this.projectGraph);
        this.assetHandler = new AssetHandler(this.projectGraph);
        this.zipExporter = new ZipExporter(this.projectGraph, this.sceneComposer, this.assetHandler);
        this.nlp = new NLP(this.projectGraph);
    },

    // Scene API
    add_scene(name) { return this.projectGraph.addScene(name); },
    add_node(scene, node, type, parent) { return this.projectGraph.addNode(scene, node, type, parent); },
    add_script(scene, scriptName, code) { return this.projectGraph.addScript(scene, scriptName, code); },
    attach_script(scene, node, script) { return this.projectGraph.attachScriptToNode(scene, node, script); },

    // Asset API
    upload_asset(path, type, data) { return this.assetHandler.addAsset(path, type, data); },
    list_assets() { return this.assetHandler.listAssets(); },

    // Export API
    async generate_project(name) { return await this.zipExporter.generateZip(name); },

    // NLP
    process_nlp_command(cmd) { return this.nlp.process(cmd); },

    get_scenes() { return this.projectGraph.scenes; },
    get_scene_file(name) { return this.sceneComposer._generateSceneFile(name, this.projectGraph.getScene(name)); }
};

// Initialize and expose globally
ProjectManager.init();
window.ProjectManager = ProjectManager;
