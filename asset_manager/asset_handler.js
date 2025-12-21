// asset_manager/asset_handler.js
// Author: CCVO
// Purpose: Manage assets for GodotGameAssembler
// Tracks, validates, and organizes assets for export

class AssetHandler {
    constructor() {
        // key = asset_path (e.g. "textures/player.png")
        // value = { type, data, original_name }
        this.assets = {};

        // Event callbacks
        this.onAssetAdded = null;
        this.onAssetRemoved = null;
        this.onAssetInvalid = null;

        console.log("AssetHandler initialized");
    }

    // ------------------------------
    // Public API
    // ------------------------------

    addAsset(assetPath, assetType, assetData) {
        if (!assetPath || !assetType || !assetData) {
            console.warn("addAsset called with invalid parameters");
            return false;
        }

        if (this.assets[assetPath]) {
            console.warn(`Asset '${assetPath}' already exists.`);
            return false;
        }

        if (!this._validateAsset(assetType, assetData)) {
            console.warn(`Asset '${assetPath}' failed validation for type '${assetType}'.`);
            if (typeof this.onAssetInvalid === "function") {
                this.onAssetInvalid(assetPath, `Invalid data for type '${assetType}'`);
            }
            return false;
        }

        this.assets[assetPath] = {
            type: assetType,
            data: assetData,
            original_name: assetPath.split("/").pop()
        };

        if (typeof this.onAssetAdded === "function") {
            this.onAssetAdded(assetPath);
        }

        return true;
    }

    removeAsset(assetPath) {
        if (!this.assets[assetPath]) {
            console.warn(`Asset '${assetPath}' does not exist.`);
            return false;
        }

        delete this.assets[assetPath];

        if (typeof this.onAssetRemoved === "function") {
            this.onAssetRemoved(assetPath);
        }

        return true;
    }

    getAsset(assetPath) {
        return this.assets[assetPath] || null;
    }

    /**
     * Returns the full asset map:
     * {
     *   "textures/player.png": { type, data, original_name },
     *   "audio/music.ogg": { ... }
     * }
     */
    listAssets() {
        return this.assets;
    }

    // ------------------------------
    // Export Support (used by ZipExporter)
    // ------------------------------

    exportAssets(outputDir, zipInstance) {
        if (!zipInstance) {
            console.error("exportAssets requires a JSZip instance");
            return false;
        }

        for (const assetPath in this.assets) {
            const assetInfo = this.assets[assetPath];
            zipInstance.file(`${outputDir}/${assetPath}`, assetInfo.data);
        }

        return true;
    }

    // ------------------------------
    // Validation Helpers
    // ------------------------------

    _validateAsset(assetType, assetData) {
        if (!assetData) return false;

        // Handle Uint8Array, ArrayBuffer, or similar
        const byteLength =
            assetData.byteLength ||
            assetData.length ||
            0;

        if (byteLength === 0) return false;

        switch (assetType) {
            case "texture":
            case "audio":
            case "font":
                return byteLength > 0;

            case "gltf":
                try {
                    const text = new TextDecoder().decode(assetData);
                    return text.includes("glTF") || text.includes("\"asset\"");
                } catch (e) {
                    console.warn("GLTF validation failed:", e);
                    return false;
                }

            default:
                console.warn(`Unknown asset type '${assetType}'. Accepting by default.`);
                return true;
        }
    }
}

// Expose globally
window.AssetHandler = AssetHandler;
