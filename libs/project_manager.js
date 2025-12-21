// project_manager.js
// Author: CCVO
// Purpose: GodotGameAssembler Ultimate Android-ready 2D/3D ProjectManager
// Features: 2D/3D, UI, touch input, animations, physics, networking, multiplayer, NLP interactive game building

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
// SceneComposer
// ------------------------------
class SceneComposer {
    constructor(graph) { this.graph = graph; }

    composeScene(sceneName) {
        const scene = this.graph.getScene(sceneName);
        if (!scene) return "";
        let text = `[gd_scene load_steps=2 format=2]\n`;
        text += `[node name="${sceneName}" type="${scene.rootType}"]\n`;

        for (const nodeName in scene.nodes) {
            const node = scene.nodes[nodeName];
            text += `[node name="${nodeName}" type="${node.type}" parent="${node.parent}"]\n`;
            for (const prop in node.properties) {
                text += `${prop} = ${this._propToString(node.properties[prop])}\n`;
            }
            for (const scriptName of node.scripts) {
                text += `script = ExtResource( ${scriptName} )\n`;
            }
        }
        return text;
    }

    _propToString(value) {
        if (typeof value === "string") return `"${value}"`;
        if (Array.isArray(value)) {
            if (value.length === 2) return `Vector2(${value[0]},${value[1]})`;
            if (value.length === 3) return `Vector3(${value[0]},${value[1]},${value[2]})`;
        }
        if (typeof value === "boolean") return value ? "true" : "false";
        return value.toString();
    }
}

// ------------------------------
// AssetHandler
// ------------------------------
class AssetHandler {
    constructor(graph) { this.graph = graph; }
    addAsset(path, type, data) { return this.graph.addAsset(path, type, data); }
}

// ------------------------------
// ZipExporter
// ------------------------------
class ZipExporter {
    constructor(graph, composer, assetHandler) {
        this.graph = graph;
        this.composer = composer;
        this.assetHandler = assetHandler;
    }

    async generateZip(projectName) {
        const zip = new JSZip();

        // Scenes & scripts
        for (const sceneName in this.graph.scenes) {
            zip.file(`${projectName}/${sceneName}.tscn`, this.composer.composeScene(sceneName));
        }
        for (const scriptName in this.graph.scripts) {
            zip.file(`${projectName}/scripts/${scriptName}.gd`, this.graph.scripts[scriptName]);
        }

        // Assets
        for (const path in this.graph.assets) {
            zip.file(`${projectName}/assets/${path}`, this.graph.assets[path].data);
        }

        // Android Export placeholders
        zip.file(`${projectName}/export_presets.cfg`, `[preset]\nname="Android"\ntarget="Android"`);
        zip.file(`${projectName}/AndroidManifest.xml`, `<manifest package="org.godotgame.${projectName}"></manifest>`);

        return await zip.generateAsync({ type: "blob" });
    }
}

// ------------------------------
// NLP Engine with 2D/3D & Multiplayer
// ------------------------------
class NLP {
    constructor(graph) {
        this.graph = graph;
        this.history = [];
        this.context = {
            currentScene: null,
            pendingQuestions: [],
            answers: {},
            multiplayerEnabled: false
        };
    }

    async process(input) {
        const text = input.trim();
        this.history.push(text);

        if (this.context.pendingQuestions.length > 0) {
            const q = this.context.pendingQuestions.shift();
            this.context.answers[q.id] = text;
            await this._applyAnswer(q.id, text);
            if (this.context.pendingQuestions.length > 0)
                return this.context.pendingQuestions[0].question;
            return `Updated project based on your answer '${text}'.`;
        }

        const { plan, questions } = await this._generatePlan(text);
        this.context.pendingQuestions = questions;

        let response = "";
        for (const step of plan) {
            switch (step.action) {
                case "create_scene":
                    this.graph.addScene(step.name, step.rootType || "Node");
                    this.context.currentScene = step.name;
                    response += `Scene '${step.name}' created.\n`; break;
                case "add_node":
                    this.graph.addNode(step.scene, step.name, step.type, step.parent || "");
                    if (step.script) {
                        this.graph.addScript(step.script.name, step.script.code);
                        this.graph.attachScript(step.scene, step.name, step.script.name);
                    }
                    response += `Node '${step.name}' added to scene '${step.scene}'.\n`; break;
                case "add_animation":
                    await this._addAnimation(step.scene, step.node, step.animations);
                    response += `Animations added to '${step.node}'.\n`; break;
                case "enable_multiplayer":
                    this._setupMultiplayer(step.scene, step.mode);
                    response += `Multiplayer enabled for scene '${step.scene}'.\n`; break;
                case "add_asset":
                    this.graph.addAsset(step.name, step.type || "Texture", step.data || "placeholder");
                    response += `Asset '${step.name}' added.\n`; break;
                default:
                    response += `Unknown action: ${step.action}\n`;
            }
        }

        if (this.context.pendingQuestions.length > 0)
            return this.context.pendingQuestions[0].question;
        return response || "Plan executed.";
    }

    async _applyAnswer(id, answer) {
        const scene = this.context.currentScene;
        if (!scene) return;

        switch(id) {
            case "actionButtons":
                const n = parseInt(answer, 10) || 3;
                for (let i = 1; i <= n; i++) {
                    const btnName = `Button${i}`;
                    this.graph.addNode(scene, btnName, "TouchScreenButton", "UI");
                    this.graph.addScript(`${btnName}_script.gd`,
                        `extends TouchScreenButton\nfunc _pressed():\n    print("${btnName} pressed")`);
                    this.graph.attachScript(scene, btnName, `${btnName}_script.gd`);
                }
                break;
            case "animationType":
                await this._addAnimation(scene, "Player", [answer]);
                break;
            case "multiplayerType":
                this._setupMultiplayer(scene, answer);
                break;
        }
    }

    async _addAnimation(sceneName, nodeName, animTypes = ["move"]) {
        const animPlayerName = `${nodeName}_AnimationPlayer`;
        this.graph.addNode(sceneName, animPlayerName, "AnimationPlayer", nodeName);
        const scriptCode = `extends AnimationPlayer
func _ready():
    # Template animations: ${animTypes.join(", ")}
    pass`;
        const scriptName = `${animPlayerName}.gd`;
        this.graph.addScript(scriptName, scriptCode);
        this.graph.attachScript(sceneName, animPlayerName, scriptName);
    }

    _setupMultiplayer(sceneName, type = "ENet") {
        this.context.multiplayerEnabled = true;
        const mpNode = "Multiplayer";
        this.graph.addNode(sceneName, mpNode, "Node");
        const scriptCode = `extends Node
var peer
func _ready():
    peer = ${type}MultiplayerPeer.new()
    multiplayer.multiplayer_peer = peer
func rpc_move(id, pos, rot, anim_state):
    rpc_id(id, "sync_state", pos, rot, anim_state)`;
        const scriptName = "Multiplayer.gd";
        this.graph.addScript(scriptName, scriptCode);
        this.graph.attachScript(sceneName, mpNode, scriptName);
    }

    async _generatePlan(text) {
        const plan = [], questions = [];
        text = text.toLowerCase();

        if (/rpg|3d/.test(text)) {
            plan.push({ action: "create_scene", name: "3DMultiplayerScene", rootType: "Node" });
            plan.push({
                action: "add_node",
                scene: "3DMultiplayerScene",
                name: "Player",
                type: "KinematicBody",
                script: {
                    name: "Player3D.gd",
                    code: `extends KinematicBody
var speed = 8
var anim_state = ""
onready var anim = $AnimationPlayer

func _physics_process(delta):
    var dir = Vector3()
    dir.x = Input.get_action_strength("move_right") - Input.get_action_strength("move_left")
    dir.z = Input.get_action_strength("move_backward") - Input.get_action_strength("move_forward")
    dir = dir.normalized()
    move_and_slide(dir * speed)
    if dir.length() > 0:
        anim.play("Run")
        anim_state = "Run"
    else:
        anim.play("Idle")
        anim_state = "Idle"

remote func sync_state(pos, rot, anim_s):
    translation = pos
    rotation = rot
    anim.play(anim_s)`
                }
            });
            plan.push({ action: "add_node", scene: "3DMultiplayerScene", name: "Camera", type: "Camera", parent: "Player" });
            plan.push({ action: "add_node", scene: "3DMultiplayerScene", name: "UI", type: "CanvasLayer" });
            questions.push({ id: "actionButtons", question: "How many action buttons?" });
            questions.push({ id: "animationType", question: "Animation types for Player? (Idle,Run,Jump)" });
            questions.push({ id: "multiplayerType", question: "Enable multiplayer? (ENet/WebSocket)" });
        }

        return { plan, questions };
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
    process_nlp_command(cmd) { return this.nlp.process(cmd); },
    get_scenes() { return this.graph.scenes; },
    get_scene_file(name) { return this.composer.composeScene(name); }
};

ProjectManager.init();
window.ProjectManager = ProjectManager;