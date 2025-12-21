// asset_manager/asset_handler.js
// Author: CCVO
// Purpose: Manage assets for GodotGameAssembler
// Tracks, validates, and organizes assets for export

class AssetHandler {
    constructor() {
        this.assets = {}; // key = asset_path, value = { type, data, original_name }

        // Event callbacks
        this.onAssetAdded = null;
        this.onAssetRemoved = null;
        this.onAssetInvalid = null;
    }

    // ------------------------------
    // Public API
    // ------------------------------

    addAsset(assetPath, assetType, assetData) {
        if (this.assets[assetPath]) {
            console.warn(`Asset '${assetPath}' already exists.`);
            return false;
        }

        if (!this._validateAsset(assetType, assetData)) {
            if (typeof this.onAssetInvalid === "function")
                this.onAssetInvalid(assetPath, `Invalid data for type '${assetType}'`);
            return false;
        }

        this.assets[assetPath] = {
            type: assetType,
            data: assetData,
            original_name: assetPath.split("/").pop()
        };

        if (typeof this.onAssetAdded === "function") this.onAssetAdded(assetPath);
        return true;
    }

    removeAsset(assetPath) {
        if (!this.assets[assetPath]) {
            console.warn(`Asset '${assetPath}' does not exist.`);
            return false;
        }
        delete this.assets[assetPath];
        if (typeof this.onAssetRemoved === "function") this.onAssetRemoved(assetPath);
        return true;
    }

    getAsset(assetPath) {
        return this.assets[assetPath] || null;
    }

    listAssets() {
        return Object.keys(this.assets);
    }

    // ------------------------------
    // Export Assets
    // ------------------------------

    exportAssets(outputDir, zipInstance) {
        // outputDir is a virtual path prefix inside JSZip
        // zipInstance is an instance of JSZip
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
        if (!assetData || assetData.byteLength === 0) return false;

        switch (assetType) {
            case "texture":
            case "audio":
            case "font":
                return assetData.byteLength > 0;
            case "gltf":
                const text = new TextDecoder().decode(assetData);
                return text.includes("glTF");
            default:
                console.warn(`Unknown asset type '${assetType}'. Accepting by default.`);
                return true;
        }
    }
}

// Expose globally
window.AssetHandler = AssetHandler;
