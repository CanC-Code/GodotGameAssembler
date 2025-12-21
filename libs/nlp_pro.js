// nlp_pro.js
// Author: CCVO
// Purpose: Advanced NLP processor for GodotGameAssembler
// Generates structured project plan based on user text commands

const NLP_PRO = {
    async process(command) {
        if (!command || typeof command !== "string") return [];

        command = command.trim().toLowerCase();
        const plan = [];

        // ------------------------------
        // RPG / 3D Scene
        // ------------------------------
        if (/rpg|3d/.test(command)) {
            plan.push({ action: "create_scene", name: "3DMultiplayerScene", rootType: "Node" });
            plan.push({
                action: "add_node",
                scene: "3DMultiplayerScene",
                name: "Player",
                type: "KinematicBody"
            });
            plan.push({
                action: "add_script",
                scene: "3DMultiplayerScene",
                name: "Player3D.gd",
                code: `extends KinematicBody
var speed=8
var anim_state=""
onready var anim=$AnimationPlayer
func _physics_process(delta):
    var dir=Vector3()
    dir.x=Input.get_action_strength("move_right")-Input.get_action_strength("move_left")
    dir.z=Input.get_action_strength("move_backward")-Input.get_action_strength("move_forward")
    dir=dir.normalized()
    move_and_slide(dir*speed)
    if dir.length()>0:
        anim.play("Run")
        anim_state="Run"
    else:
        anim.play("Idle")
        anim_state="Idle"
remote func sync_state(pos,rot,anim_s):
    translation=pos
    rotation=rot
    anim.play(anim_s)`
            });
            plan.push({ action: "add_node", scene: "3DMultiplayerScene", name: "Camera", type: "Camera", parent: "Player" });
            plan.push({ action: "add_node", scene: "3DMultiplayerScene", name: "UI", type: "CanvasLayer" });
            plan.push({ action: "procedural_generate", scene: "3DMultiplayerScene" });
        }

        // ------------------------------
        // Loot / Item
        // ------------------------------
        if (/loot|item/.test(command)) {
            plan.push({ action: "add_loot" });
        }

        // ------------------------------
        // Quest
        // ------------------------------
        if (/quest/.test(command)) {
            plan.push({ action: "add_quest" });
        }

        // ------------------------------
        // Multiplayer
        // ------------------------------
        if (/multiplayer/.test(command)) {
            plan.push({ action: "enable_multiplayer", scene: "3DMultiplayerScene", mode: "ENet" });
        }

        // ------------------------------
        // Endless Runner
        // ------------------------------
        if (/endless.*run/.test(command)) {
            plan.push({ action: "create_scene", name: "EndlessRunnerScene", rootType: "Node" });
            plan.push({
                action: "add_node",
                scene: "EndlessRunnerScene",
                name: "Player",
                type: "KinematicBody"
            });
            plan.push({ action: "procedural_generate", scene: "EndlessRunnerScene" });
        }

        return plan;
    }
};

// Expose globally
window.NLP_PRO = NLP_PRO;
