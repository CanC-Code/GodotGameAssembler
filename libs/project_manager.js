// core/project_manager.js
// Author: CCVO
// Purpose: Central orchestration layer for GodotGameAssembler
// Coordinates ProjectGraph, AssetHandler, NLP, SceneComposer, and Export

(function () {

    // ------------------------------
    // Dependencies (must be loaded first)
    // ------------------------------
    if (!window.ProjectGraph || !window.AssetHandler) {
        throw new Error("ProjectManager requires ProjectGraph and AssetHandler");
    }

    // ------------------------------
    // Core Instances
    // ------------------------------
    const projectGraph = new ProjectGraph();
    const assetHandler = new AssetHandler();

    let sceneComposer = null;
    let zipExporter = null;

    // ------------------------------
    // Internal Helpers
    // ------------------------------
    function log(msg) {
        console.log("[ProjectManager]", msg);
    }

    function safeAppendNLP(msg) {
        if (typeof window.appendNLP === "function") {
            window.appendNLP(msg);
        }
    }

    // ------------------------------
    // ProjectManager API
    // ------------------------------
    const ProjectManager = {

        // ------------------------------
        // Scene API
        // ------------------------------
        add_scene(sceneName) {
            if (!sceneName) return "Invalid scene name.";
            const ok = projectGraph.addScene(sceneName);
            return ok
                ? `Scene '${sceneName}' created.`
                : `Scene '${sceneName}' already exists.`;
        },

        get_scenes() {
            return projectGraph.getScenes();
        },

        add_node(sceneName, nodeName, nodeType, parent = "") {
            if (!sceneName || !nodeName) return "Invalid node parameters.";
            const ok = projectGraph.addNode(sceneName, nodeName, nodeType, parent);
            return ok
                ? `Node '${nodeName}' added to scene '${sceneName}'.`
                : `Failed to add node '${nodeName}'.`;
        },

        add_script(sceneName, scriptName, code) {
            if (!sceneName || !scriptName) return "Invalid script parameters.";
            const ok = projectGraph.addScript(sceneName, scriptName, code || "");
            return ok
                ? `Script '${scriptName}' added to scene '${sceneName}'.`
                : `Failed to add script '${scriptName}'.`;
        },

        // ------------------------------
        // Asset API
        // ------------------------------
        upload_asset(name, type, data) {
            if (!name || !type || !data) return "Invalid asset parameters.";
            const ok = assetHandler.addAsset(name, type, data);
            return ok
                ? `Asset '${name}' uploaded as ${type}.`
                : `Failed to upload asset '${name}'.`;
        },

        list_assets() {
            return assetHandler.listAssets();
        },

        // ------------------------------
        // NLP Processing (SAFE + SYNC UI)
        // ------------------------------
        process_nlp_command(command) {
            if (!command) return "No command provided.";

            // Echo immediately (sync)
            safeAppendNLP(`> ${command}`);

            // Fire-and-forget async NLP
            this._process_nlp_async(command);

            // UI-safe immediate return
            return "Processing...";
        },

        async _process_nlp_async(command) {
            try {
                if (!window.NLP_PRO || !NLP_PRO.process) {
                    safeAppendNLP("NLP engine not available.");
                    return;
                }

                const plan = await NLP_PRO.process(command);

                if (!plan || plan.length === 0) {
                    safeAppendNLP("I couldn’t extract a concrete plan yet.");
                    return;
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
                                step.type || "Node2D",
                                step.parent || ""
                            ) + "\n";
                            break;

                        case "add_script":
                            output += this.add_script(
                                step.scene,
                                step.name,
                                step.code || ""
                            ) + "\n";
                            break;

                        case "upload_asset":
                            output += `Awaiting asset upload: ${step.name}\n`;
                            break;

                        default:
                            output += `Unknown action: ${step.action}\n`;
                    }
                }

                safeAppendNLP(output.trim());

            } catch (err) {
                console.error(err);
                safeAppendNLP("NLP processing failed.");
            }
        },

        // ------------------------------
        // Export
        // ------------------------------
        async generate_project(projectName = "GodotProject") {

            if (!window.SceneComposer || !window.ZipExporter) {
                throw new Error("Export system not available");
            }

            sceneComposer = new SceneComposer(projectGraph);
            zipExporter = new ZipExporter(projectGraph, sceneComposer, assetHandler);

            return new Promise((resolve, reject) => {
                zipExporter.setExportFinishedCallback(() => {
                    log("Export finished");
                });

                zipExporter.setExportFailedCallback(err => {
                    reject(err);
                });

                zipExporter.exportProject(projectName).then(() => {
                    resolve(); // zipExporter handles download
                });
            });
        }
    };

    // ------------------------------
    // Global Exposure
    // ------------------------------
    window.ProjectManager = ProjectManager;

    log("Initialized");

})();
