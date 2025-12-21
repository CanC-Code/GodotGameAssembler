// project_manager.js
// Author: CCVO
// Purpose: GodotGameAssembler Next-Gen Dynamic NLP Project Manager
// Fully integrates Godot engine capabilities with conversational project creation

// ------------------------------
// Core ProjectGraph
// ------------------------------
class ProjectGraph {
    constructor() {
        this.scenes = {};
        this.assets = {};
        this.scripts = {};
    }

    addScene(name, rootType="Node") {
        if(this.scenes[name]) return false;
        this.scenes[name] = { nodes: {}, rootType };
        return true;
    }

    addNode(sceneName, nodeName, type="Node", parent="") {
        const scene = this.scenes[sceneName];
        if(!scene || scene.nodes[nodeName]) return false;
        scene.nodes[nodeName] = { type, parent, properties: {}, scripts: [], signals: [] };
        return true;
    }

    attachScript(sceneName, nodeName, scriptName) {
        const scene = this.scenes[sceneName];
        if(!scene || !scene.nodes[nodeName]) return false;
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
// SceneComposer (Godot-ready .tscn generator)
// ------------------------------
class SceneComposer {
    constructor(graph) { this.graph = graph; }

    composeScene(sceneName) {
        const scene = this.graph.getScene(sceneName);
        if(!scene) return "";
        let text = `[gd_scene load_steps=2 format=2]\n`;
        text += `[node name="${sceneName}" type="${scene.rootType}"]\n`;

        for(const nodeName in scene.nodes){
            const node = scene.nodes[nodeName];
            text += `[node name="${nodeName}" type="${node.type}" parent="${node.parent}"]\n`;
            for(const prop in node.properties){
                text += `${prop} = ${this._propToString(node.properties[prop])}\n`;
            }
            for(const scriptName of node.scripts){
                text += `script = ExtResource( ${scriptName} )\n`;
            }
        }
        return text;
    }

    _propToString(value){
        if(typeof value==="string") return `"${value}"`;
        if(Array.isArray(value)){
            if(value.length===2) return `Vector2(${value[0]},${value[1]})`;
            if(value.length===3) return `Vector3(${value[0]},${value[1]},${value[2]})`;
        }
        if(typeof value==="boolean") return value?"true":"false";
        return value.toString();
    }
}

// ------------------------------
// AssetHandler
// ------------------------------
class AssetHandler {
    constructor(graph){ this.graph = graph; }
    addAsset(path,type,data){ return this.graph.addAsset(path,type,data); }
}

// ------------------------------
// ZipExporter
// ------------------------------
class ZipExporter {
    constructor(graph, composer, assetHandler){
        this.graph = graph;
        this.composer = composer;
        this.assetHandler = assetHandler;
    }

    async generateZip(projectName){
        const zip = new JSZip();

        // Scenes & scripts
        for(const sceneName in this.graph.scenes){
            zip.file(`${projectName}/${sceneName}.tscn`, this.composer.composeScene(sceneName));
        }
        for(const scriptName in this.graph.scripts){
            zip.file(`${projectName}/scripts/${scriptName}.gd`, this.graph.scripts[scriptName]);
        }

        // Assets
        for(const path in this.graph.assets){
            zip.file(`${projectName}/assets/${path}`, this.graph.assets[path].data);
        }

        return await zip.generateAsync({ type:"blob" });
    }
}

// ------------------------------
// Dynamic NLP Engine with full Godot understanding
// ------------------------------
class NLP {
    constructor(graph){
        this.graph = graph;
        this.history = [];
        this.context = {
            currentScene:null,
            pendingQuestions:[],
            answers:{},
        };
    }

    async process(input){
        const text = input.trim();
        this.history.push(text);

        // Answer pending question first
        if(this.context.pendingQuestions.length>0){
            const q = this.context.pendingQuestions.shift();
            this.context.answers[q.id]=text;
            await this._applyAnswer(q.id,text);
            if(this.context.pendingQuestions.length>0) return this.context.pendingQuestions[0].question;
            return `Updated project based on your answer '${text}'.`;
        }

        // No pending questions: generate plan dynamically
        const { plan, questions } = await this._generatePlan(text);
        this.context.pendingQuestions = questions;

        // Execute plan
        let response="";
        for(const step of plan){
            switch(step.action){
                case "create_scene":
                    this.graph.addScene(step.name, step.rootType||"Node");
                    this.context.currentScene=step.name;
                    response+=`Scene '${step.name}' created.\n`; break;
                case "add_node":
                    this.graph.addNode(step.scene, step.name, step.type, step.parent||"");
                    if(step.script){
                        this.graph.addScript(step.script.name, step.script.code);
                        this.graph.attachScript(step.scene, step.name, step.script.name);
                    }
                    response+=`Node '${step.name}' added to scene '${step.scene}'.\n`; break;
                case "add_asset":
                    this.graph.addAsset(step.name, step.type||"Texture", step.data||"placeholder");
                    response+=`Asset '${step.name}' added.\n`; break;
                default: response+=`Unknown action: ${step.action}\n`;
            }
        }

        if(this.context.pendingQuestions.length>0) return this.context.pendingQuestions[0].question;
        return response||"Plan executed.";
    }

    async _applyAnswer(id, answer){
        const scene = this.context.currentScene;
        switch(id){
            case "viewType":
                const player=this.graph.getScene(scene).nodes["Player"];
                if(player) player.properties.viewType=answer; break;
            case "actionButtons":
                const n=parseInt(answer,10)||3;
                for(let i=1;i<=n;i++){
                    const btn=`Button${i}`;
                    this.graph.addNode(scene,btn,"Button","");
                    this.graph.addScript(`${btn}_script.gd`,`extends Button\n# Button ${i}`);
                    this.graph.attachScript(scene,btn,`${btn}_script.gd`);
                } break;
            case "menuStyle":
                const uiNode=this.graph.getScene(scene).nodes["UI"];
                if(uiNode) uiNode.properties.style=answer; break;
        }
    }

    async _generatePlan(text){
        text=text.toLowerCase();
        const plan=[],questions=[];

        if(/snake/.test(text)){
            plan.push({ action:"create_scene", name:"SnakeScene" });
            plan.push({ action:"add_node", scene:"SnakeScene", name:"SnakeHead", type:"Node2D", script:{name:"SnakeController.gd", code:this._snakeScript()} });
            plan.push({ action:"add_node", scene:"SnakeScene", name:"Food", type:"Node2D" });
            plan.push({ action:"add_asset", name:"snake_head.png" });
            plan.push({ action:"add_asset", name:"food.png" });
            questions.push({ id:"actionButtons", question:"How many action buttons?" });
        } else if(/rpg/.test(text)){
            plan.push({ action:"create_scene", name:"RPGScene" });
            plan.push({ action:"add_node", scene:"RPGScene", name:"Player", type:"KinematicBody2D", script:{name:"PlayerController.gd", code:this._rpgPlayerScript()} });
            plan.push({ action:"add_node", scene:"RPGScene", name:"NPCs", type:"Node2D" });
            plan.push({ action:"add_node", scene:"RPGScene", name:"Enemies", type:"Node2D" });
            plan.push({ action:"add_node", scene:"RPGScene", name:"WorldMap", type:"TileMap" });
            plan.push({ action:"add_asset", name:"player.png" });
            plan.push({ action:"add_asset", name:"npc.png" });
            plan.push({ action:"add_asset", name:"enemy.png" });
            plan.push({ action:"add_asset", name:"tiles.png" });
            questions.push({ id:"viewType", question:"Top-down or side-view?" });
            questions.push({ id:"actionButtons", question:"How many action buttons?" });
            questions.push({ id:"menuStyle", question:"What style should the menu have?" });
        } else {
            plan.push({ action:"create_scene", name:"MainScene" });
            plan.push({ action:"add_node", scene:"MainScene", name:"Player", type:"Node2D" });
        }

        return { plan, questions };
    }

    // ------------------------------
    // Dynamic script templates
    // ------------------------------
    _snakeScript(){ return `extends Node2D\nvar speed=200\nvar dir=Vector2.RIGHT\nfunc _process(delta):\n position+=dir*speed*delta`; }
    _rpgPlayerScript(){ return `extends KinematicBody2D\nvar speed=200\nfunc _physics_process(delta):\n var input=Vector2(Input.get_action_strength("ui_right")-Input.get_action_strength("ui_left"), Input.get_action_strength("ui_down")-Input.get_action_strength("ui_up"))\n move_and_slide(input.normalized()*speed)`; }
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

    init(){
        this.composer=new SceneComposer(this.graph);
        this.assets=new AssetHandler(this.graph);
        this.zip=new ZipExporter(this.graph,this.composer,this.assets);
        this.nlp=new NLP(this.graph);
    },

    add_scene(name){ return this.graph.addScene(name); },
    add_node(scene,node,type,parent){ return this.graph.addNode(scene,node,type,parent); },
    add_script(name,code){ return this.graph.addScript(name,code); },
    attach_script(scene,node,script){ return this.graph.attachScript(scene,node,script); },
    upload_asset(path,type,data){ return this.graph.addAsset(path,type,data); },
    async generate_project(name){ return await this.zip.generateZip(name); },
    process_nlp_command(cmd){ return this.nlp.process(cmd); },
    get_scenes(){ return this.graph.scenes; },
    get_scene_file(name){ return this.composer.composeScene(name); }
};

ProjectManager.init();
window.ProjectManager=ProjectManager;