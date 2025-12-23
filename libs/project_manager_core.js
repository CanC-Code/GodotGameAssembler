// libs/project_manager_core.js
// Author: CCVO
// Purpose: Core ProjectManager definition for GodotGameAssembler
// Provides central project graph, NLP command interface, and basic game metadata

(function () {
    if (window.ProjectManager) {
        console.warn("ProjectManager already defined. Skipping core initialization.");
        return;
    }

    class ProjectManagerClass {
        constructor() {
            // Core project structure
            this.graph = new ProjectGraph();
            this.projectName = "";
            this.projectConcept = "";

            // Track created nodes, buttons, scripts, etc.
            this.nodes = {};
            this.buttons = {};
            this.scripts = {};
            this.thumbsticks = {};
        }

        // --------------------------------------------------
        // 🔑 CANONICAL EXECUTION ENTRY POINT
        // --------------------------------------------------
        async execute(command) {
            if (typeof command !== "string") {
                console.error("ProjectManager.execute: invalid command", command);
                return;
            }

            console.log("PM.execute →", command);
            const result = await this.process_nlp_command(command);

            // Live update UI after any mutation
            renderProjectTree();
            updateInfoPanel();

            return result;
        }

        // --------------------------------------------------
        // NLP Command Processing
        // --------------------------------------------------
        async process_nlp_command(cmd) {
            const text = cmd.trim();
            if (!text) return "";

            // Help
            if (/^help$/i.test(text)) {
                return `Help Commands:
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

            // Name game
            if (/^name\s+game\s+"?([^"]+)"?/i.test(text)) {
                const name = text.match(/^name\s+game\s+"?([^"]+)"?/i)[1];
                this.projectName = name;
                return `Game named "${name}".`;
            }

            // Set concept
            if (/^set\s+concept\s+"?([^"]+)"?/i.test(text)) {
                const concept = text.match(/^set\s+concept\s+"?([^"]+)"?/i)[1];
                this.projectConcept = concept;
                return `Concept set: "${concept}".`;
            }

            // Create scene
            if (/^create\s+scene\s+(\w+)/i.test(text)) {
                const sceneName = text.match(/^create\s+scene\s+(\w+)/i)[1];
                const added = this.addScene(sceneName);
                return added ? `Scene "${sceneName}" created.` : `Scene "${sceneName}" already exists.`;
            }

            // List scenes
            if (/^list\s+scenes$/i.test(text)) {
                const scenes = this.graph.getScenes();
                return scenes.length ? scenes.join(", ") : "No scenes created yet.";
            }

            return `Unrecognized command. Type "help" for available commands.`;
        }

        // --------------------------------------------------
        // Live-mutation helpers
        // --------------------------------------------------
        addScene(sceneName) {
            const added = this.graph.addScene(sceneName);
            if (added) {
                renderProjectTree();
                updateInfoPanel();
            }
            return added;
        }

        addFolder(folderPath) {
            if (!this.graph.folders[folderPath]) {
                this.graph.folders[folderPath] = { name: folderPath, files: [], subfolders: [] };
                renderProjectTree();
                updateInfoPanel();
            }
        }

        addAsset(folderPath, asset) {
            const folder = this.graph.folders[folderPath] || { name: folderPath, files: [], subfolders: [] };
            if (!this.graph.folders[folderPath]) this.graph.folders[folderPath] = folder;
            folder.files.push(asset);
            renderProjectTree();
            updateInfoPanel();
        }

        // --------------------------------------------------
        // Scene Utilities
        // --------------------------------------------------
        getScenes() {
            return this.graph.getScenes();
        }

        getSceneFile(name) {
            return this.graph.getScene(name);
        }

        getScene(sceneName) {
            return this.graph.getScene(sceneName);
        }

        hasScene(sceneName) {
            return this.graph.hasScene(sceneName);
        }
    }

    // --------------------------------------------------
    // Global exposure
    // --------------------------------------------------
    window.ProjectManager = new ProjectManagerClass();

    window.executeProjectCommand = function (command) {
        if (!window.ProjectManager || typeof window.ProjectManager.execute !== "function") {
            console.error(
                "No executable command method found on ProjectManager,",
                window.ProjectManager
            );
            return;
        }
        return window.ProjectManager.execute(command);
    };

    console.log("ProjectManager core initialized.");
})();
