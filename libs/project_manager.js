// libs/project_manager.js
// Author: CCVO
// Purpose: Central orchestrator for GodotGameAssembler
// Godot 4.5.x Android aligned

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
    // ProjectManager API
    // ------------------------------
    const ProjectManager = {

        // --- Scene API ---
        add_scene(name) {
            return graph.addScene(name)
                ? `Scene '${name}' created.`
                : `Scene '${name}' already exists.`;
        },

        add_node(scene, node, type = "Node2D", parent = "") {
            return graph.addNode(scene, node, type, parent)
                ? `Node '${node}' added to '${scene}'.`
                : `Failed to add node '${node}'.`;
        },

        add_script(scene, name, code) {
            return graph.addScript(scene, name, code)
                ? `Script '${name}' added to '${scene}'.`
                : `Failed to add script '${name}'.`;
        },

        attach_script(scene, node, script) {
            return graph.attachScriptToNode(scene, node, script)
                ? `Script '${script}' attached to '${node}'.`
                : `Failed to attach script.`;
        },

        // --- Assets ---
        upload_asset(path, type, data) {
            return assets.addAsset(path, type, data)
                ? `Asset '${path}' added.`
                : `Failed to add asset '${path}'.`;
        },

        list_assets() {
            return assets.listAssets();
        },

        // --- Queries ---
        get_scenes() {
            return graph.getScenes();
        },

        get_scene_file(sceneName) {
            return graph.generateSceneFile(sceneName);
        },

        // --- Export ---
        async generate_project(projectName = "GodotProject") {
            await exporter.exportProject(projectName);
            return true;
        },

        // ------------------------------
        // NLP ENTRY POINT (SAFE)
        // ------------------------------
        async process_nlp_command(command) {
            if (!nlp) return "NLP engine not loaded.";

            try {
                const result = await nlp.process(command, this);
                return result || "NLP processed.";
            } catch (err) {
                console.error(err);
                return `NLP error: ${err.message}`;
            }
        }
    };

    // ------------------------------
    // Global Export
    // ------------------------------
    window.ProjectManager = ProjectManager;

    console.log("ProjectManager initialized (Godot 4.5.x)");

})();
