// project_manager.js
// Author: CCVO
// Purpose: Interactive NLP-driven GodotGameAssembler
// Builds games dynamically via conversation
// Date: 2025-12-21

// ------------------------------
// Core Classes (unchanged)
// ------------------------------
// ProjectGraph, SceneComposer, AssetHandler, ZipExporter
// Use your existing implementations for these classes

// ------------------------------
// Dynamic NLP Engine with Conversation
// ------------------------------
class NLP {
    constructor(projectGraph) {
        this.projectGraph = projectGraph;
        this.history = [];
        this.conversationContext = {
            currentScene: null,
            pendingQuestions: [],
            userAnswers: {}
        };
    }

    async process(input) {
        const text = input.trim();
        this.history.push(text);

        // If we have pending questions, answer them first
        if (this.conversationContext.pendingQuestions.length > 0) {
            const question = this.conversationContext.pendingQuestions.shift();
            this.conversationContext.userAnswers[question.id] = text;
            // Apply answer to project
            await this._applyAnswer(question.id, text);
            // Ask next question if any
            if (this.conversationContext.pendingQuestions.length > 0) {
                return this.conversationContext.pendingQuestions[0].question;
            }
            return `Updated project based on your answer '${text}'.`;
        }

        // No pending questions: generate initial plan from input
        const planAndQuestions = await this._generatePlanFromText(text);
        const plan = planAndQuestions.plan;
        const questions = planAndQuestions.questions;

        this.conversationContext.pendingQuestions = questions || [];

        // Execute plan
        let response = "";
        for (let step of plan) {
            switch (step.action) {
                case "create_scene":
                    response += this.projectGraph.addScene(step.name) ? `Scene '${step.name}' created.\n` : `Scene '${step.name}' already exists.\n`;
                    this.conversationContext.currentScene = step.name;
                    break;
                case "add_node":
                    response += this.projectGraph.addNode(step.scene, step.name, step.type, step.parent || "") ? `Node '${step.name}' added to scene '${step.scene}'.\n` : `Node '${step.name}' could not be added.\n`;
                    if (step.script) {
                        this.projectGraph.addScript(step.scene, step.script.name, step.script.code);
                        this.projectGraph.attachScriptToNode(step.scene, step.name, step.script.name);
                        response += `Script '${step.script.name}' attached to node '${step.name}'.\n`;
                    }
                    break;
                case "upload_asset":
                    this.projectGraph.addAsset(`assets/${step.name}`, step.type || "Texture", step.data || "placeholder");
                    response += `Asset '${step.name}' added as placeholder.\n`;
                    break;
                default:
                    response += `Unknown action: ${step.action}\n`;
            }
        }

        // Return first pending question if any
        if (this.conversationContext.pendingQuestions.length > 0) {
            return this.conversationContext.pendingQuestions[0].question;
        }

        return response || "Plan executed.";
    }

    // ------------------------------
    // Apply user's answer dynamically to project
    // ------------------------------
    async _applyAnswer(id, answer) {
        const scene = this.conversationContext.currentScene;
        switch(id) {
            case "viewType":
                // Example: adjust camera node or player orientation
                const playerNode = this.projectGraph.getScene(scene).nodes["Player"];
                if (playerNode) playerNode.properties.viewType = answer;
                break;
            case "actionButtons":
                const count = parseInt(answer, 10) || 3;
                for (let i=1; i<=count; i++) {
                    const btnName = `Button${i}`;
                    this.projectGraph.addNode(scene, btnName, "Button", "");
                    this.projectGraph.addScript(scene, `Button${i}_script.gd`, `extends Button\n# TODO: implement button ${i} behavior`);
                    this.projectGraph.attachScriptToNode(scene, btnName, `Button${i}_script.gd`);
                }
                break;
            case "jumpType":
                const player = this.projectGraph.getScene(scene).nodes["Player"];
                if (player) player.properties.jumpType = answer;
                break;
            case "menuStyle":
                const uiNode = this.projectGraph.getScene(scene).nodes["UI"] || null;
                if (uiNode) uiNode.properties.style = answer;
                break;
            default:
                console.warn("Unhandled answer id:", id);
        }
    }

    // ------------------------------
    // Generate dynamic plan + questions from free text
    // ------------------------------
    async _generatePlanFromText(text) {
        text = text.toLowerCase();
        const plan = [];
        const questions = [];

        if (/snake/i.test(text)) {
            plan.push({ action: "create_scene", name: "SnakeScene" });
            plan.push({ action: "add_node", scene: "SnakeScene", name: "SnakeHead", type: "Node2D", script: { name: "SnakeController.gd", code: this._snakeScript() } });
            plan.push({ action: "add_node", scene: "SnakeScene", name: "Food", type: "Node2D" });
            plan.push({ action: "upload_asset", name: "snake_head.png" });
            plan.push({ action: "upload_asset", name: "food.png" });
            questions.push({ id: "actionButtons", question: "How many action buttons do you want?" });
        } else if (/endless runner/i.test(text)) {
            plan.push({ action: "create_scene", name: "RunnerScene" });
            plan.push({ action: "add_node", scene: "RunnerScene", name: "Player", type: "KinematicBody2D", script: { name: "PlayerController.gd", code: this._runnerPlayerScript() } });
            plan.push({ action: "add_node", scene: "RunnerScene", name: "ObstacleSpawner", type: "Node2D", script: { name: "ObstacleSpawner.gd", code: this._runnerObstacleScript() } });
            plan.push({ action: "add_node", scene: "RunnerScene", name: "Ground", type: "TileMap" });
            plan.push({ action: "upload_asset", name: "player.png" });
            plan.push({ action: "upload_asset", name: "obstacle.png" });
            plan.push({ action: "upload_asset", name: "ground.png" });
            questions.push({ id: "jumpType", question: "Should the player have single jump or double jump?" });
        } else if (/rpg/i.test(text)) {
            plan.push({ action: "create_scene", name: "RPGScene" });
            plan.push({ action: "add_node", scene: "RPGScene", name: "Player", type: "KinematicBody2D", script: { name: "PlayerController.gd", code: this._rpgPlayerScript() } });
            plan.push({ action: "add_node", scene: "RPGScene", name: "NPCs", type: "Node2D" });
            plan.push({ action: "add_node", scene: "RPGScene", name: "Enemies", type: "Node2D" });
            plan.push({ action: "add_node", scene: "RPGScene", name: "WorldMap", type: "TileMap" });
            plan.push({ action: "upload_asset", name: "player.png" });
            plan.push({ action: "upload_asset", name: "npc.png" });
            plan.push({ action: "upload_asset", name: "enemy.png" });
            plan.push({ action: "upload_asset", name: "tiles.png" });
            questions.push({ id: "viewType", question: "Should your RPG be top-down or side-view?" });
            questions.push({ id: "actionButtons", question: "How many action buttons do you want?" });
            questions.push({ id: "menuStyle", question: "What style should your in-game menu have?" });
        } else {
            plan.push({ action: "create_scene", name: "MainScene" });
            plan.push({ action: "add_node", scene: "MainScene", name: "Player", type: "Node2D" });
        }

        return { plan, questions };
    }

    // ------------------------------
    // Example dynamic scripts
    // ------------------------------
    _snakeScript() {
        return `extends Node2D
var speed = 200
var direction = Vector2.RIGHT
func _process(delta):
    position += direction * speed * delta
`;
    }

    _runnerPlayerScript() {
        return `extends KinematicBody2D
var speed = 400
var velocity = Vector2()
var jump_count = 0
var max_jumps = 2
func _physics_process(delta):
    velocity.y += 1000 * delta
    if Input.is_action_just_pressed("ui_up") and jump_count < max_jumps:
        velocity.y = -600
        jump_count += 1
    if is_on_floor():
        jump_count = 0
    velocity = move_and_slide(velocity, Vector2.UP)
`;
    }

    _runnerObstacleScript() {
        return `extends Node2D
func _process(delta):
    position.x -= 200 * delta
    if position.x < -100: queue_free()
`;
    }

    _rpgPlayerScript() {
        return `extends KinematicBody2D
var speed = 200
func _physics_process(delta):
    var input_vector = Vector2()
    input_vector.x = Input.get_action_strength("ui_right") - Input.get_action_strength("ui_left")
    input_vector.y = Input.get_action_strength("ui_down") - Input.get_action_strength("ui_up")
    move_and_slide(input_vector.normalized() * speed)
`;
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