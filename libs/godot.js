// libs/godot.js
// Author: CCVO
// Purpose: Interactive Godot Game Assembler interface
// Fully guided workflow with NLP, scene scaffolding, asset management, and game creation

(function () {

    // ------------------------------
    // Dependency Guard
    // ------------------------------
    if (!window.ProjectGraph) throw new Error("ProjectGraph not loaded");
    if (!window.AssetHandler) throw new Error("AssetHandler not loaded");
    if (!window.SceneComposer) throw new Error("SceneComposer not loaded");
    if (!window.ZipExporter) throw new Error("ZipExporter not loaded");

    // ------------------------------
    // Core Instances
    // ------------------------------
    const graph = new ProjectGraph();
    const assets = new AssetHandler();
    const composer = new SceneComposer(graph);
    const exporter = new ZipExporter(graph, composer, assets);

    // ------------------------------
    // NLP (optional but expected)
    // ------------------------------
    const nlp = window.NLP_PRO || null;

    // ------------------------------
    // Project State
    // ------------------------------
    let gameName = null;
    let gameConcept = null;

    // ------------------------------
    // Utility Functions
    // ------------------------------
    function logMessage(msg) {
        const log = document.getElementById("nlp-log");
        log.innerHTML += `${msg}\n`;
        log.scrollTop = log.scrollHeight;
    }

    function sanitizeName(name) {
        return name.trim().replace(/[^a-zA-Z0-9_]/g, "_");
    }

    // ------------------------------
    // ProjectManager API
    // ------------------------------
    const ProjectManager = {

        // ---------- Game Metadata ----------
        nameGame(name) {
            if (!name) return "Invalid name.";
            gameName = sanitizeName(name);
            return `Game named '${gameName}'. You can now set its concept using: set concept "<Text>"`;
        },

        setConcept(text) {
            if (!gameName) return "Please name your game first.";
            gameConcept = text;
            return `Concept set: "${gameConcept}". You can now create your first scene using: create scene <Name>`;
        },

        // ---------- Scene Management ----------
        createScene(name) {
            if (!gameName) return "Please name your game first.";
            if (!name) return "Invalid scene name.";
            name = sanitizeName(name);

            if (!graph.addScene(name)) return `Scene '${name}' already exists.`;

            logMessage(`Scene '${name}' created.`);

            // Auto scaffold nodes based on scene type
            if (name.toLowerCase() === "intro") {
                graph.addNode(name, "Cutscene", "Node2D");
                graph.addNode(name, "StartButton", "Button");
                graph.attachScript(name, "StartButton", "IntroButtonScript");
            } else if (name.toLowerCase() === "menu") {
                graph.addNode(name, "Background", "Sprite");
                graph.addNode(name, "StartButton", "Button");
                graph.addNode(name, "OptionsButton", "Button");
                graph.addNode(name, "ExitButton", "Button");
                graph.attachScript(name, "StartButton", "MenuStartScript");
                graph.attachScript(name, "OptionsButton", "MenuOptionsScript");
                graph.attachScript(name, "ExitButton", "MenuExitScript");
            } else if (name.toLowerCase() === "gameplay") {
                graph.addNode(name, "Player", "KinematicBody2D");
                graph.addNode(name, "Camera", "Camera2D");
                graph.addNode(name, "HUD", "CanvasLayer");
                graph.addNode(name, "Thumbstick", "TouchScreenButton");
                graph.attachScript(name, "Player", "PlayerMovementScript");
            }

            return `Scene '${name}' created and scaffolded with default nodes.`;
        },

        addNode(scene, node, type = "Node2D", parent = null) {
            if (!scene) return "No scene specified.";
            const success = graph.addNode(scene, node, type, parent);
            return success ? `Node '${node}' added to '${scene}'.` : `Failed to add node '${node}'.`;
        },

        attachScript(scene, node, script) {
            const success = graph.attachScript(scene, node, script);
            return success ? `Script '${script}' attached to '${node}'.` : "Failed to attach script.";
        },

        addButton(scene, name, position = null) {
            const result = graph.addNode(scene, name, "Button");
            graph.attachScript(scene, name, "ButtonScript");
            return result ? `Button '${name}' added to '${scene}'.` : `Failed to add button '${name}'.`;
        },

        linkButton(button, sceneFrom, sceneTo) {
            // For simplicity, attach a script to the button linking to the target scene
            if (!graph.getNode(sceneFrom, button)) return `Button '${button}' not found in '${sceneFrom}'.`;
            graph.attachScript(sceneFrom, button, `LinkToScene_${sceneTo}`);
            return `Button '${button}' in '${sceneFrom}' now links to scene '${sceneTo}'.`;
        },

        addThumbstick(scene, name = "Thumbstick") {
            const result = graph.addNode(scene, name, "TouchScreenButton");
            return result ? `Thumbstick '${name}' added to '${scene}'.` : `Failed to add thumbstick '${name}'.`;
        },

        getScenes() {
            return graph.getScenes();
        },

        getSceneFile(sceneName) {
            return graph.getSceneFile(sceneName);
        },

        uploadAsset(path, type, extension, folder = null, data = null) {
            const success = graph.addAsset(path, type, extension, folder, data);
            return success ? `Asset '${path}' added.` : `Failed to add asset '${path}'.`;
        },

        listAssets() {
            return Object.values(graph.assets);
        },

        generateProject(name = "GodotProject") {
            return exporter.exportProject(name).then(() => true);
        },

        // ---------- NLP / Interactive ----------
        async process_nlp_command(command) {
            command = command.trim();
            if (!command) return "";

            // Pre-process commands
            const lower = command.toLowerCase();

            // Game naming
            if (lower.startsWith("name game ")) {
                const game = command.substring(10).trim();
                return this.nameGame(game);
            }

            if (lower.startsWith("set concept ")) {
                const concept = command.substring(12).trim().replace(/^"(.*)"$/, "$1");
                return this.setConcept(concept);
            }

            if (lower.startsWith("create scene ")) {
                const scene = command.substring(13).trim();
                return this.createScene(scene);
            }

            if (lower.startsWith("add node ")) {
                const parts = command.substring(9).split(" to ");
                if (parts.length !== 2) return "Invalid syntax: add node <Name> to <Scene>";
                const [nodePart, scenePart] = parts;
                const nodeInfo = nodePart.split(" ");
                const nodeName = nodeInfo[0];
                const nodeType = nodeInfo[1] || "Node2D";
                return this.addNode(scenePart.trim(), nodeName, nodeType);
            }

            if (lower.startsWith("attach script ")) {
                const m = command.match(/attach script (.+) to (.+) in (.+)/i);
                if (!m) return "Invalid syntax: attach script <Script> to <Node> in <Scene>";
                const [, script, node, scene] = m;
                return this.attachScript(scene, node, script);
            }

            if (lower.startsWith("add button ")) {
                const m = command.match(/add button (.+) to (.+)/i);
                if (!m) return "Invalid syntax: add button <Name> to <Scene>";
                const [, btn, scene] = m;
                return this.addButton(scene, btn);
            }

            if (lower.startsWith("link button ")) {
                const m = command.match(/link button (.+) to scene (.+)/i);
                if (!m) return "Invalid syntax: link button <Name> to scene <Scene>";
                const [, btn, sceneTo] = m;
                const sceneFrom = this.getScenes().find(s => graph.getNode(s, btn));
                if (!sceneFrom) return `Button '${btn}' not found in any scene.`;
                return this.linkButton(btn, sceneFrom, sceneTo);
            }

            if (lower.startsWith("add thumbstick ")) {
                const scene = command.substring(14).trim();
                return this.addThumbstick(scene);
            }

            if (lower === "list scenes") return `Scenes: ${this.getScenes().join(", ") || "None"}`;

            if (lower.startsWith("export project ")) {
                const projName = command.substring(15).trim();
                await this.generateProject(projName);
                return `Project '${projName}' exported successfully.`;
            }

            // NLP engine fallback
            if (nlp) {
                try {
                    const result = await nlp.process(command, this);
                    return result || "NLP processed.";
                } catch (err) {
                    console.error(err);
                    return `NLP error: ${err.message}`;
                }
            }

            // Interactive guidance
            if (!gameName) return "Hello! What would you like to do? Start by naming your game: name game \"<Name>\"";
            if (!gameConcept) return `You can now set the concept of your game: set concept "<Text>"`;
            if (this.getScenes().length === 0) return `You can now create your first scene using: create scene <Name>`;

            return "Unrecognized command. Type 'help'.";
        }
    };

    // ------------------------------
    // Global Export
    // ------------------------------
    window.ProjectManager = ProjectManager;

    console.log("ProjectManager (Interactive) initialized.");

})();