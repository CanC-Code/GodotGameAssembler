// libs/project_manager_core.js
// Author: CCVO
// Purpose: Core ProjectManager definition for GodotGameAssembler
// Provides central project graph, NLP command interface, and basic game metadata

(function() {

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

        // ------------------------------
        // NLP Command Processing
        // ------------------------------
        async process_nlp_command(cmd) {
            const text = cmd.trim();

            // Basic commands
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

            if (/^name\s+game\s+"?([^"]+)"?/i.test(text)) {
                const name = text.match(/^name\s+game\s+"?([^"]+)"?/i)[1];
                this.projectName = name;
                return `Game named '${name}'`;
            }

            if (/^set\s+concept\s+"?([^"]+)"?/i.test(text)) {
                const concept = text.match(/^set\s+concept\s+"?([^"]+)"?/i)[1];
                this.projectConcept = concept;
                return `Concept set: "${concept}"`;
            }

            if (/^create\s+scene\s+(\w+)/i.test(text)) {
                const sceneName = text.match(/^create\s+scene\s+(\w+)/i)[1];
                const added = this.graph.addScene(sceneName);
                return added ? `Scene '${sceneName}' created.` : `Scene '${sceneName}' already exists.`;
            }

            if (/^list\s+scenes$/i.test(text)) {
                const scenes = this.graph.getScenes();
                return scenes.length ? scenes.join(", ") : "No scenes created yet.";
            }

            // Fallback: unknown command
            return `Unrecognized command. Type 'help' for available commands.`;
        }

        // ------------------------------
        // Scene Utilities
        // ------------------------------
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

    // Expose globally
    window.ProjectManager = new ProjectManagerClass();
    console.log("ProjectManager core initialized.");

})();
