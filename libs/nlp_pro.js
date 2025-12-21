// libs/nlp_pro.js
// Author: CCVO
// Purpose: Lightweight NLP command interpreter for ProjectManager
// Not an LLM — deterministic, inspectable, safe

(function () {

    const NLP_PRO = {

        async process(input, pm) {
            if (!pm) throw new Error("ProjectManager not provided to NLP");

            const text = input.trim();

            // -----------------------------
            // CREATE SCENE
            // -----------------------------
            // "create scene Main"
            let m = text.match(/^create\s+scene\s+(\w+)/i);
            if (m) {
                return pm.add_scene(m[1]);
            }

            // -----------------------------
            // ADD NODE
            // -----------------------------
            // "add node Player Node2D to Main"
            m = text.match(
                /^add\s+node\s+(\w+)\s+(\w+)\s+to\s+(\w+)(?:\s+under\s+(\w+))?/i
            );
            if (m) {
                const [, node, type, scene, parent] = m;
                return pm.add_node(scene, node, type, parent || "");
            }

            // -----------------------------
            // ADD SCRIPT
            // -----------------------------
            // "add script Move to Main"
            m = text.match(/^add\s+script\s+(\w+)\s+to\s+(\w+)/i);
            if (m) {
                const code =
`extends Node

func _ready():
    print("Script ready")`;
                return pm.add_script(m[2], m[1], code);
            }

            // -----------------------------
            // ATTACH SCRIPT
            // -----------------------------
            // "attach script Move to Player in Main"
            m = text.match(
                /^attach\s+script\s+(\w+)\s+to\s+(\w+)\s+in\s+(\w+)/i
            );
            if (m) {
                const [, script, node, scene] = m;
                return pm.attach_script(scene, node, script);
            }

            // -----------------------------
            // LIST SCENES
            // -----------------------------
            if (/^list\s+scenes/i.test(text)) {
                const scenes = pm.get_scenes();
                return scenes.length
                    ? "Scenes:\n- " + scenes.join("\n- ")
                    : "No scenes created.";
            }

            // -----------------------------
            // EXPORT PROJECT
            // -----------------------------
            // "export project"
            m = text.match(/^export\s+project(?:\s+(\w+))?/i);
            if (m) {
                const name = m[1] || "GodotProject";
                await pm.generate_project(name);
                return `Project '${name}' exported.`;
            }

            // -----------------------------
            // HELP
            // -----------------------------
            if (/^help/i.test(text)) {
                return (
`Commands:
- create scene <Name>
- add node <Name> <Type> to <Scene>
- add script <Name> to <Scene>
- attach script <Script> to <Node> in <Scene>
- list scenes
- export project <Name>`
                );
            }

            // -----------------------------
            // FALLBACK
            // -----------------------------
            return "Unrecognized command. Type 'help'.";

        }
    };

    window.NLP_PRO = NLP_PRO;

    console.log("NLP_PRO loaded.");

})();
