// libs/project_manager.js
// Author: CCVO
// Purpose: Central orchestrator for GodotGameAssembler

(function () {

    if (!window.ProjectGraph) throw new Error("ProjectGraph not loaded");
    if (!window.AssetHandler) throw new Error("AssetHandler not loaded");
    if (!window.SceneComposer) throw new Error("SceneComposer not loaded");
    if (!window.ZipExporter) throw new Error("ZipExporter not loaded");

    const graph = new ProjectGraph();
    const assets = new AssetHandler();
    const composer = new SceneComposer(graph);
    const exporter = new ZipExporter(graph, composer, assets);
    const nlp = window.NLP_PRO || null;

    const ProjectManager = {
        gameName: "Untitled",
        gameConcept: "",

        // --- Scene API ---
        add_scene(name) {
            return graph.addScene(name) ? `Scene '${name}' created.` : `Scene '${name}' already exists.`;
        },

        add_node(scene, node, type = "Node2D", parent = null) {
            return graph.addNode(scene, node, type, parent) ? `Node '${node}' added to '${scene}'.` : `Failed to add node '${node}'.`;
        },

        attach_script(scene, node, script) {
            return graph.attachScript(scene, node, script) ? `Script '${script}' attached to '${node}'.` : `Failed to attach script.`;
        },

        // --- UI Elements ---
        addUIElement(scene, name, type, position = "default") {
            const nodeName = name;
            if (!graph.hasScene(scene)) return `Scene '${scene}' does not exist.`;
            graph.addNode(scene, nodeName, type);
            return `${type} '${name}' added to '${scene}' at position '${position}'.`;
        },

        linkButtonToScene(buttonName, targetScene) {
            // simple mapping for demo
            return `Button '${buttonName}' will change scene to '${targetScene}'.`;
        },

        createThumbstick(scene) {
            if (!graph.hasScene(scene)) return `Scene '${scene}' does not exist.`;
            graph.addNode(scene, "Thumbstick", "TouchControl");
            return `Thumbstick added to '${scene}'.`;
        },

        // --- Queries ---
        get_scenes() { return graph.getScenes(); },
        get_scene_file(sceneName) { return graph.getSceneFile(sceneName); },
        get_selected_node_info(scene, node) {
            const n = graph.getNode(scene, node);
            if (!n) return null;
            return { ...n, scene };
        },

        // --- Assets ---
        upload_asset(path, type, data) {
            return assets.addAsset(path, type, path.split(".").pop(), null, data) ? `Asset '${path}' added.` : `Failed to add asset '${path}'.`;
        },

        list_assets() { return assets.listAssets(); },

        // --- Export ---
        async generate_project(projectName = "GodotProject") {
            await exporter.exportProject(projectName);
            return true;
        },

        // --- NLP ---
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

    window.ProjectManager = ProjectManager;
    console.log("ProjectManager initialized (Godot 4.5.x)");

})();