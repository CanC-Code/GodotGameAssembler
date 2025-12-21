// libs/nlp_pro.js
// Author: CCVO
// Purpose: Enhanced NLP command interpreter for chat-driven Godot project building

(function () {

    const NLP_PRO = {

        async process(input, pm) {
            if (!pm) throw new Error("ProjectManager not provided to NLP");

            const text = input.trim();

            // -----------------------------
            // HELP
            // -----------------------------
            if (/^help/i.test(text)) {
                return `Commands:
- name game "<Name>"
- set concept "<Text>"
- create scene <Name>
- add node <Name> <Type> to <Scene>
- attach script <Script> to <Node> in <Scene>
- add button <Name> to <Scene> [position]
- link button <Name> to scene <Scene>
- add thumbstick to <Scene>
- list scenes
- export project <Name>`;
            }

            // -----------------------------
            // NAME GAME
            // -----------------------------
            let m = text.match(/^name\s+game\s+"(.+)"$/i);
            if (m) {
                pm.gameName = m[1];
                return `Game named: ${pm.gameName}`;
            }

            // -----------------------------
            // SET CONCEPT
            // -----------------------------
            m = text.match(/^set\s+concept\s+"(.+)"$/i);
            if (m) {
                pm.gameConcept = m[1];
                return `Game concept set: ${pm.gameConcept}`;
            }

            // -----------------------------
            // CREATE SCENE
            // -----------------------------
            m = text.match(/^create\s+scene\s+(\w+)/i);
            if (m) {
                const name = m[1];
                const res = pm.add_scene(name);
                return res.includes("created") ? `Scene '${name}' created` : res;
            }

            // -----------------------------
            // ADD NODE
            // -----------------------------
            m = text.match(/^add\s+node\s+(\w+)\s+(\w+)\s+to\s+(\w+)/i);
            if (m) {
                const [, node, type, scene] = m;
                return pm.add_node(scene, node, type);
            }

            // -----------------------------
            // ATTACH SCRIPT
            // -----------------------------
            m = text.match(/^attach\s+script\s+(\w+)\s+to\s+(\w+)\s+in\s+(\w+)/i);
            if (m) {
                const [, script, node, scene] = m;
                return pm.attach_script(scene, node, script);
            }

            // -----------------------------
            // ADD BUTTON
            // -----------------------------
            m = text.match(/^add\s+button\s+"?(\w+)"?\s+to\s+(\w+)(?:\s+(\w+))?/i);
            if (m) {
                const [, name, scene, position] = m;
                return pm.addUIElement(scene, name, "Button", position);
            }

            // -----------------------------
            // LINK BUTTON TO SCENE
            // -----------------------------
            m = text.match(/^link\s+button\s+"?(\w+)"?\s+to\s+scene\s+(\w+)/i);
            if (m) {
                const [, btnName, targetScene] = m;
                return pm.linkButtonToScene(btnName, targetScene);
            }

            // -----------------------------
            // ADD THUMBSTICK
            // -----------------------------
            m = text.match(/^add\s+thumbstick\s+to\s+(\w+)/i);
            if (m) {
                const [, scene] = m;
                return pm.createThumbstick(scene);
            }

            // -----------------------------
            // LIST SCENES
            // -----------------------------
            if (/^list\s+scenes/i.test(text)) {
                const scenes = pm.get_scenes();
                return scenes.length ? "Scenes:\n- " + scenes.join("\n- ") : "No scenes created.";
            }

            // -----------------------------
            // EXPORT PROJECT
            // -----------------------------
            m = text.match(/^export\s+project(?:\s+(\w+))?/i);
            if (m) {
                const name = m[1] || "GodotProject";
                await pm.generate_project(name);
                return `Project '${name}' exported.`;
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