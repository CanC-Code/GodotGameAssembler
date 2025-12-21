// libs/project_manager.js
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

        // -------------------------
        // Project Lifecycle
        // -------------------------
        newProject(name = "Untitled") {
            this.gameName = name;
            graph.scenes = {};
            graph.assets = {};
            graph.folders = {};
            return `New project '${name}' created.`;
        },

        async importZip(file) {
            if (!file) return "No file selected.";
            if (typeof JSZip === "undefined") return "JSZip not loaded.";

            const zip = await JSZip.loadAsync(file);
            const addEntries = async (folder, path = "") => {
                for (const [key, val] of Object.entries(folder)) {
                    const fullPath = path + key;
                    if (val.dir) {
                        graph.addFolder(fullPath, path.slice(0, -1) || null);
                        await addEntries(val.files, fullPath + "/");
                    } else {
                        const data = await val.async("blob");
                        const ext = key.split(".").pop();
                        graph.addAsset(fullPath, "file", ext, path.slice(0, -1), data);
                    }
                }
            };
            await addEntries(zip.files);
            return `Imported ZIP '${file.name}'.`;
        },

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

        // --- UI / Controls ---
        addUIElement(scene, name, type, position = "default") {
            if (!graph.hasScene(scene)) return `Scene '${scene}' does not exist.`;
            graph.addNode(scene, name, type);
            return `${type} '${name}' added to '${scene}' at position '${position}'.`;
        },

        linkButtonToScene(buttonName, targetScene) {
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
        get_selected_node_info(scene, node) { return graph.getNode(scene, node); },
        get_folder_contents(folder) { return graph.getFolderContents(folder); },

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
    console.log("ProjectManager initialized with new project/import logic");

})();