// export/zip_exporter.js
// Author: CCVO
// Purpose: Package GodotGameAssembler projects into a downloadable ZIP
// Fully aligned with ProjectManager.js style

class ZipExporter {
    constructor(projectGraph, sceneComposer, assetHandler) {
        if (!projectGraph || !sceneComposer || !assetHandler) {
            throw new Error("Dependencies not set: ProjectGraph, SceneComposer, AssetHandler required");
        }
        this.projectGraph = projectGraph;
        this.sceneComposer = sceneComposer;
        this.assetHandler = assetHandler;

        // Event callbacks
        this.onExportStarted = null;
        this.onExportProgress = null;
        this.onExportFinished = null;
        this.onExportFailed = null;
    }

    // ------------------------------
    // Public API
    // ------------------------------
    async exportProject(projectName = "GodotProject") {
        try {
            if (typeof this.onExportStarted === "function") this.onExportStarted();

            const zip = new JSZip();

            // --- Step 1: Scenes & Scripts ---
            this.sceneComposer.projectGraph = this.projectGraph;
            const scenesZip = this.sceneComposer.composeAllScenes(projectName);

            for (const filePath in scenesZip.files) {
                const fileData = await scenesZip.files[filePath].async("uint8array");
                zip.file(filePath, fileData);
            }

            // --- Step 2: Assets ---
            const assets = this.assetHandler.listAssets();
            for (const name in assets) {
                const asset = assets[name];
                const uint8 = new Uint8Array(asset.data);
                zip.file(`${projectName}/assets/${name}`, uint8);
            }

            // --- Step 3: Generate ZIP ---
            const blob = await zip.generateAsync({
                type: "blob",
                onUpdate: (metadata) => {
                    if (typeof this.onExportProgress === "function") {
                        this.onExportProgress(metadata.percent);
                    }
                }
            });

            saveAs(blob, `${projectName}.zip`);

            if (typeof this.onExportFinished === "function") this.onExportFinished(`${projectName}.zip`);
        } catch (err) {
            console.error("ZIP export failed", err);
            if (typeof this.onExportFailed === "function") this.onExportFailed(err.message);
        }
    }

    // ------------------------------
    // Event registration
    // ------------------------------
    setExportStartedCallback(cb) { if (typeof cb === "function") this.onExportStarted = cb; }
    setExportProgressCallback(cb) { if (typeof cb === "function") this.onExportProgress = cb; }
    setExportFinishedCallback(cb) { if (typeof cb === "function") this.onExportFinished = cb; }
    setExportFailedCallback(cb) { if (typeof cb === "function") this.onExportFailed = cb; }
}

// Expose globally
window.ZipExporter = ZipExporter;
