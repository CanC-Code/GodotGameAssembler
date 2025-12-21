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

        // -------------------
        // Scene API
        // -------------------
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
            return graph.attachScript(scene, name, code)
                ? `Script '${name}' added to '${scene}'.`
                : `Failed to add script '${name}'.`;
        },

        attach_script(scene, node, script) {
            return graph.attachScript(scene, node, script)
                ? `Script '${script}' attached to '${node}'.`
                : `Failed to attach script.`;
        },

        // -------------------
        // Asset API
        // -------------------
        upload_asset(path, type, extension, folder = null, data = null) {
            return graph.addAsset(path, type, extension, folder, data)
                ? `Asset '${path}' added.`
                : `Failed to add asset '${path}'.`;
        },

        list_assets() {
            return Object.values(graph.assets);
        },

        add_folder(path, parent = null) {
            return graph.addFolder(path, parent)
                ? `Folder '${path}' created.`
                : `Folder '${path}' already exists.`;
        },

        get_folder_contents(path) {
            return graph.getFolderContents(path);
        },

        // -------------------
        // Queries
        // -------------------
        get_scenes() {
            return graph.getScenes();
        },

        get_scene_file(sceneName) {
            return graph.getSceneFile(sceneName);
        },

        // -------------------
        // Export
        // -------------------
        async generate_project(projectName = "GodotProject") {
            await exporter.exportProject(projectName);
            return true;
        },

        // -------------------
        // NLP
        // -------------------
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
    console.log("ProjectManager initialized.");

})();