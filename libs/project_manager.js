// export/project_manager.js
// Author: CCVO
// Purpose: Central project graph + NLP execution layer

const ProjectManager = {

    projectGraph: {
        scenes: {}
    },

    // ------------------------------
    // Scene & Node Management
    // ------------------------------
    add_scene(name) {
        if (!name) return "Invalid scene name.";
        if (this.projectGraph.scenes[name]) {
            return `Scene '${name}' already exists.`;
        }

        this.projectGraph.scenes[name] = {
            nodes: {},
            scripts: {}
        };

        return `Scene '${name}' created.`;
    },

    add_node(scene, name, type, parent = "") {
        const s = this.projectGraph.scenes[scene];
        if (!s) return `Scene '${scene}' not found.`;

        s.nodes[name] = {
            type,
            parent
        };

        return `Node '${name}' (${type}) added to scene '${scene}'.`;
    },

    add_script(scene, filename, code) {
        const s = this.projectGraph.scenes[scene];
        if (!s) return `Scene '${scene}' not found.`;

        s.scripts[filename] = code || "";
        return `Script '${filename}' added to scene '${scene}'.`;
    },

    // ------------------------------
    // NLP Entry Point (ASYNC)
    // ------------------------------
    async process_nlp_command(command) {
        if (!command) return "";

        const plan = await NLP_PRO.process(command);
        if (!plan || plan.length === 0) {
            return "No actionable intent detected.";
        }

        let output = "";

        for (const step of plan) {
            switch (step.action) {

                case "create_scene":
                    output += this.add_scene(step.name) + "\n";
                    break;

                case "add_node":
                    output += this.add_node(
                        step.scene,
                        step.name,
                        step.type,
                        step.parent || ""
                    ) + "\n";
                    break;

                case "add_script":
                    output += this.add_script(
                        step.scene,
                        step.name,
                        step.code
                    ) + "\n";
                    break;

                case "upload_asset":
                    output += "Asset upload requested (GUI required).\n";
                    break;

                case "enable_multiplayer":
                    output += `Multiplayer enabled for '${step.scene}' (${step.mode}).\n`;
                    break;

                default:
                    output += `Unknown action '${step.action}'.\n`;
            }
        }

        return output.trim();
    }
};

// Expose globally
window.ProjectManager = ProjectManager;
