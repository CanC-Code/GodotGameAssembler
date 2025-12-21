// godot.js
// Author: CCVO
// Purpose: Bridge HTML GUI commands to Godot WebAssembly singleton (ProjectManager)

var GodotRuntime = GodotRuntime || {};
GodotRuntime.ProjectManager = null;

function initGodotRuntime(godotInstance) {
    // Wait until Godot runtime is ready
    GodotRuntime.instance = godotInstance;
    GodotRuntime.ProjectManager = godotInstance.ProjectManager; // Autoload singleton
}

// --- GUI Integration Functions ---

function addScene(sceneName) {
    if (!GodotRuntime.ProjectManager) return console.error("Godot runtime not ready.");
    GodotRuntime.ProjectManager.add_scene(sceneName);
}

function addNode(sceneName, nodeName, nodeType, parent="") {
    if (!GodotRuntime.ProjectManager) return console.error("Godot runtime not ready.");
    GodotRuntime.ProjectManager.add_node(sceneName, nodeName, nodeType, parent);
}

function uploadAsset(assetPath, assetType, arrayBuffer) {
    if (!GodotRuntime.ProjectManager) return console.error("Godot runtime not ready.");
    // Convert ArrayBuffer to PoolByteArray for Godot
    const uint8 = new Uint8Array(arrayBuffer);
    const poolArray = GodotRuntime.instance.HEAPU8.subarray(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);
    GodotRuntime.ProjectManager.upload_asset(assetPath, assetType, poolArray);
}

function generateProject(zipName) {
    if (!GodotRuntime.ProjectManager) return console.error("Godot runtime not ready.");
    GodotRuntime.ProjectManager.generate_project(zipName);
}

function processNLPCommand(cmd) {
    if (!GodotRuntime.ProjectManager) return console.error("Godot runtime not ready.");
    const response = GodotRuntime.ProjectManager.process_nlp_command(cmd);
    return response;
}

// Optional: Connect Godot signals to JS callbacks
function connectExportSignals(onStarted, onProgress, onFinished, onFailed) {
    const pm = GodotRuntime.ProjectManager;
    if (!pm) return console.error("Godot runtime not ready.");

    pm.connect("export_started", onStarted);
    pm.connect("export_progress", onProgress);
    pm.connect("export_finished", onFinished);
    pm.connect("export_failed", onFailed);
}