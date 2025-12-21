// project_manager.js
// Author: CCVO
// Purpose: GodotGameAssembler Ultimate Android-ready ProjectManager
// Features: 2D/3D, UI, touch input, animations, physics, networking, multiplayer, NLP interactive game building, procedural generation, loot, quests

// ------------------------------
// Core ProjectGraph
// ------------------------------
class ProjectGraph {
    constructor() {
        this.scenes = {};
        this.assets = {};
        this.scripts = {};
    }

    addScene(name, rootType = "Node") {
        if (this.scenes[name]) return false;
        this.scenes[name] = { nodes: {}, rootType };
        return true;
    }

    addNode(sceneName, nodeName, type = "Node", parent = "") {
        const scene = this.scenes[sceneName];
        if (!scene || scene.nodes[nodeName]) return false;
        scene.nodes[nodeName] = { type, parent, properties: {}, scripts: [], signals: [] };
        return true;
    }

    attachScript(sceneName, nodeName, scriptName) {
        const scene = this.scenes[sceneName];
        if (!scene || !scene.nodes[nodeName]) return false;
        scene.nodes[nodeName].scripts.push(scriptName);
        return true;
    }

    addScript(scriptName, code) {
        this.scripts[scriptName] = code;
        return true;
    }

    addAsset(path, type, data) {
        this.assets[path] = { type, data };
        return true;
    }

    getScene(sceneName) { return this.scenes[sceneName] || null; }
}

// ------------------------------
// ProjectManager Global
// ------------------------------
const ProjectManager = {
    graph: new ProjectGraph(),
    composer: null,
    assets: null,
    zip: null,
    nlp: null,

    init() {
        this.composer = new SceneComposer(this.graph);
        this.assets = new AssetHandler(this.graph);
        this.zip = new ZipExporter(this.graph, this.composer, this.assets);
        this.nlp = new NLP(this.graph);
    },

    add_scene(name) { return this.graph.addScene(name); },
    add_node(scene, node, type, parent) { return this.graph.addNode(scene, node, type, parent); },
    add_script(name, code) { return this.graph.addScript(name, code); },
    attach_script(scene, node, script) { return this.graph.attachScript(scene, node, script); },
    upload_asset(path, type, data) { return this.graph.addAsset(path, type, data); },
    async generate_project(name) { return await this.zip.generateZip(name); },
    get_scenes() { return this.graph.scenes; },
    get_scene_file(name) { return this.composer.composeScene(name); },

    // ------------------------------
    // NLP wrapper: auto-resolve & return string response
    // ------------------------------
    process_nlp: async function(command) {
        appendNLP(`> ${command}`);
        try {
            const response = await this.nlp.process(command);
            appendNLP(response);
            return response;  // always returns string
        } catch (err) {
            const errMsg = `Error: ${err}`;
            appendNLP(errMsg);
            console.error(err);
            return errMsg;
        }
    },

    // ------------------------------
    // Legacy support for nlp_pro.js integration
    // Ensures direct function call, returns string, not Promise
    // ------------------------------
    process_nlp_command: async function(command) {
        appendNLP(`> ${command}`); // Echo command in NLP panel
        try {
            if (typeof NLP_PRO === "undefined" || !NLP_PRO.process) {
                throw new Error("NLP_PRO not loaded or invalid");
            }

            const plan = await NLP_PRO.process(command); // returns structured plan
            if (!plan || plan.length === 0) return "Could not parse command.";

            let response = "";

            for (let step of plan) {
                switch (step.action) {
                    case "create_scene":
                        response += this.add_scene(step.name) + "\n";
                        break;
                    case "add_node":
                        response += this.add_node(step.scene, step.name, step.type, step.parent || "") + "\n";
                        break;
                    case "add_script":
                        response += this.add_script(step.name, step.code || "# Your code here\n") + "\n";
                        this.attach_script(step.scene, step.name, step.name);
                        break;
                    case "upload_asset":
                        response += "Use GUI to upload assets: " + step.name + "\n";
                        break;
                    default:
                        response += `Unknown action: ${step.action}\n`;
                }
            }

            appendNLP(response);
            return response;
        } catch (err) {
            const errMsg = `Error: ${err}`;
            appendNLP(errMsg);
            console.error(err);
            return errMsg;
        }
    }
};

ProjectManager.init();
window.ProjectManager = ProjectManager;
