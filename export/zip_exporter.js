// export/zip_exporter.js
// Author: CCVO
// Purpose: Package GodotGameAssembler projects into a downloadable ZIP
// Fully aligned with ProjectManager & SceneComposer

class ZipExporter {
    constructor(projectGraph, sceneComposer, assetHandler) {
        if (!projectGraph || !sceneComposer || !assetHandler) {
            throw new Error("Dependencies required: ProjectGraph, SceneComposer, AssetHandler");
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
            const scenesZip = this.sceneComposer.composeAllScenes(projectName);
            for (const filePath in scenesZip.files) {
                const content = await scenesZip.file(filePath).async("uint8array").catch(() => null);
                if (content) zip.file(filePath, content);
            }

            // --- Step 2: Assets ---
            const assets = this.assetHandler.listAssets();
            for (const name in assets) {
                const asset = assets[name];
                if (!asset.data) continue;

                // Convert string assets to Uint8Array if necessary
                const uint8 = asset.data instanceof Uint8Array
                    ? asset.data
                    : new TextEncoder().encode(asset.data.toString());

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

            // Trigger download
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${projectName}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);

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
