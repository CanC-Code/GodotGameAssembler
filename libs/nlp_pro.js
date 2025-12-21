// export/nlp_pro.js
// Author: CCVO
// Purpose: Lightweight NLP → action planner for ProjectManager

const NLP_PRO = {

    async process(command) {
        if (!command || typeof command !== "string") return [];

        const text = command.toLowerCase().trim();
        const plan = [];

        // ---- Simple intent parsing (deterministic, expandable) ----

        if (text.includes("snake")) {
            plan.push({
                action: "create_scene",
                name: "SnakeGame"
            });

            plan.push({
                action: "add_node",
                scene: "SnakeGame",
                name: "Snake",
                type: "Node2D"
            });

            plan.push({
                action: "add_script",
                scene: "SnakeGame",
                name: "snake.gd",
                code: `extends Node2D

var direction = Vector2.RIGHT
var speed = 100

func _process(delta):
    position += direction * speed * delta
`
            });
        }

        if (text.includes("multiplayer")) {
            plan.push({
                action: "enable_multiplayer",
                scene: "Main",
                mode: "peer"
            });
        }

        if (text.includes("asset")) {
            plan.push({
                action: "upload_asset",
                name: "external"
            });
        }

        return plan;
    }
};

// Expose globally
window.NLP_PRO = NLP_PRO;
