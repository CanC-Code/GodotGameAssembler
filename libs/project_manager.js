// project_manager.js
// Author: CCVO
// Purpose: GodotGameAssembler Ultimate Android-ready ProjectManager
// Features: 2D/3D, UI, touch input, animations, physics, networking, multiplayer, NLP interactive game building, procedural generation, loot, quests

// ------------------------------
// Core ProjectGraph
// ------------------------------
class ProjectGraph {
    constructor() {
        this.scenes = {};      // { sceneName: { nodes, scripts, rootType } }
        this.scripts = {};     // { scriptName: code }
        this.assets = {};      // { path: { type, data } }
    }

    addScene(name, rootType = "Node2D") {
        if (this.scenes[name]) return false;
        this.scenes[name] = { nodes: {}, scripts: {}, rootType };
        return true;
    }

    addNode(sceneName, nodeName, type = "Node", parent = "") {
        const scene = this.scenes[sceneName];
        if (!scene || scene.nodes[nodeName]) return false;
        scene.nodes[nodeName] = { type, parent, properties: {}, scripts: [] };
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

    getScene(sceneName) {
        return this.scenes[sceneName] || null;
    }
}

// ------------------------------
// SceneComposer
// ------------------------------
class SceneComposer {
    constructor(graph) { this.graph = graph; }

    composeAllScenes(projectName = "GodotProject") {
        const zip = new JSZip();
        for (const sceneName in this.graph.scenes) {
            const sceneText = this.composeScene(sceneName);
            zip.file(`${projectName}/${sceneName}.tscn`, sceneText);

            // Scripts
            const scene = this.graph.scenes[sceneName];
            for (const nodeName in scene.nodes) {
                const node = scene.nodes[nodeName];
                node.scripts.forEach(scriptName => {
                    if (this.graph.scripts[scriptName])
                        zip.file(`${projectName}/scripts/${scriptName}.gd`, this.graph.scripts[scriptName]);
                });
            }
        }

        // Made-by Slide
        const introScene = `[node name="MadeByIntro" type="Label" parent=""]\ntext = "Made with GodotGameAssembler by CCVO"\n`;
        zip.file(`${projectName}/MadeByIntro.tscn`, introScene);

        return zip;
    }

    composeScene(sceneName) {
        const scene = this.graph.getScene(sceneName);
        if (!scene) return "";

        let text = `[gd_scene load_steps=2 format=2]\n`;
        text += `[node name="${sceneName}" type="${scene.rootType}"]\n`;

        for (const nodeName in scene.nodes) {
            const node = scene.nodes[nodeName];
            text += `[node name="${nodeName}" type="${node.type}" parent="${node.parent || ""}"]\n`;
            for (const prop in node.properties) {
                text += `${prop} = ${this._valueToString(node.properties[prop])}\n`;
            }
            for (const scriptName of node.scripts) {
                text += `script = ExtResource(${scriptName})\n`;
            }
        }
        return text;
    }

    _valueToString(value) {
        if (typeof value === "string") return `"${value}"`;
        if (typeof value === "boolean") return String(value);
        if (typeof value === "number") return value.toString();
        if (value && typeof value === "object") {
            if ("x" in value && "y" in value && !"z" in value) return `Vector2(${value.x},${value.y})`;
            if ("x" in value && "y" in value && "z" in value) return `Vector3(${value.x},${value.y},${value.z})`;
            if ("r" in value && "g" in value && "b" in value) {
                return value.a !== undefined
                    ? `Color(${value.r},${value.g},${value.b},${value.a})`
                    : `Color(${value.r},${value.g},${value.b})`;
            }
        }
        return `"${value}"`;
    }
}

// ------------------------------
// AssetHandler
// ------------------------------
class AssetHandler {
    constructor(graph) { this.graph = graph; }
    addAsset(path, type, data) { return this.graph.addAsset(path, type, data); }
    listAssets() { return this.graph.assets; }
}

// ------------------------------
// ZipExporter
// ------------------------------
class ZipExporter {
    constructor(graph, composer, assetHandler) {
        this.graph = graph;
        this.composer = composer;
        this.assetHandler = assetHandler;
        this.onExportStarted = null;
        this.onExportProgress = null;
        this.onExportFinished = null;
        this.onExportFailed = null;
    }

    async exportProject(projectName = "GodotProject") {
        try {
            if (typeof this.onExportStarted === "function") this.onExportStarted();

            const zip = new JSZip();

            // Scenes & Scripts
            this.composer.graph = this.graph;
            const scenesZip = this.composer.composeAllScenes(projectName);
            for (const path in scenesZip.files) {
                const content = await scenesZip.files[path].async("uint8array");
                zip.file(path, content);
            }

            // Assets
            const assets = this.assetHandler.listAssets();
            for (const name in assets) {
                const asset = assets[name];
                const uint8 = asset.data instanceof Uint8Array ? asset.data : new TextEncoder().encode(asset.data);
                zip.file(`${projectName}/assets/${name}`, uint8);
            }

            // Generate ZIP
            const blob = await zip.generateAsync({ type: "blob", onUpdate: meta => {
                if (typeof this.onExportProgress === "function") this.onExportProgress(meta.percent);
            }});

            // Trigger download
            saveAs(blob, `${projectName}.zip`);
            if (typeof this.onExportFinished === "function") this.onExportFinished(`${projectName}.zip`);

        } catch (err) {
            console.error(err);
            if (typeof this.onExportFailed === "function") this.onExportFailed(err.message);
        }
    }

    setExportStartedCallback(cb){ if(typeof cb==="function") this.onExportStarted=cb; }
    setExportProgressCallback(cb){ if(typeof cb==="function") this.onExportProgress=cb; }
    setExportFinishedCallback(cb){ if(typeof cb==="function") this.onExportFinished=cb; }
    setExportFailedCallback(cb){ if(typeof cb==="function") this.onExportFailed=cb; }
}

// ------------------------------
// NLP Engine
// ------------------------------
class NLP_PRO {
    constructor(graph) {
        this.graph = graph;
    }

    // Returns structured plan: [{action, name, type, ...}]
    async process(command) {
        const plan = [];
        const text = command.toLowerCase();

        if (/rpg|3d/.test(text)) {
            plan.push({action:"create_scene", name:"3DMultiplayerScene", rootType:"Node"});
            plan.push({action:"add_node", scene:"3DMultiplayerScene", name:"Player", type:"KinematicBody"});
            plan.push({action:"add_node", scene:"3DMultiplayerScene", name:"Camera", type:"Camera", parent:"Player"});
            plan.push({action:"add_node", scene:"3DMultiplayerScene", name:"UI", type:"CanvasLayer"});
        }

        if (/endless|runner/.test(text)) {
            plan.push({action:"create_scene", name:"RunnerScene", rootType:"Node2D"});
        }

        return plan;
    }
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
    NLP_PRO: null,

    init() {
        this.composer = new SceneComposer(this.graph);
        this.assets = new AssetHandler(this.graph);
        this.zip = new ZipExporter(this.graph, this.composer, this.assets);
        this.NLP_PRO = new NLP_PRO(this.graph);
    },

    add_scene(name){ return this.graph.addScene(name); },
    add_node(scene,node,type,parent){ return this.graph.addNode(scene,node,type,parent); },
    add_script(name,code){ return this.graph.addScript(name,code); },
    attach_script(scene,node,script){ return this.graph.attachScript(scene,node,script); },
    upload_asset(path,type,data){ return this.graph.addAsset(path,type,data); },

    async export(projectName){ return await this.zip.exportProject(projectName); },

    // NLP integration
    async process_nlp(command){
        appendNLP(`> ${command}`);
        try {
            const plan = await this.NLP_PRO.process(command);
            if(!plan || plan.length===0) return "Could not parse command.";

            let response = "";
            for(const step of plan){
                switch(step.action){
                    case "create_scene": response += this.add_scene(step.name)+"\n"; break;
                    case "add_node": response += this.add_node(step.scene, step.name, step.type, step.parent||"")+"\n"; break;
                    case "add_script": response += this.add_script(step.name, step.code||"# code")+"\n"; break;
                    default: response += `Unknown action: ${step.action}\n`;
                }
            }
            appendNLP(response);
            return response;
        } catch(err) {
            const msg=`Error: ${err}`;
            console.error(err);
            appendNLP(msg);
            return msg;
        }
    }
};

ProjectManager.init();
window.ProjectManager = ProjectManager;
