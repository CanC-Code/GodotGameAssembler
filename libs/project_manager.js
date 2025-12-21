// ProjectManager JS Replacement for project_manager.gd
const ProjectManager = {
  scenes: {},
  assets: {},

  // Add a new scene
  add_scene(name) {
    if (!name) return "Scene name required.";
    if (this.scenes[name]) return `Scene '${name}' already exists.`;
    this.scenes[name] = { nodes: {}, scripts: {} };
    return `Scene '${name}' added.`;
  },

  // Add a new node to a scene
  add_node(sceneName, nodeName, type, parent = "") {
    const scene = this.scenes[sceneName];
    if (!scene) return `Scene '${sceneName}' does not exist.`;
    if (!nodeName) return "Node name required.";
    if (scene.nodes[nodeName]) return `Node '${nodeName}' already exists in scene '${sceneName}'.`;
    scene.nodes[nodeName] = { type, parent, scripts: {} };
    return `Node '${nodeName}' of type '${type}' added to scene '${sceneName}'.`;
  },

  // Upload an asset (Uint8Array)
  upload_asset(name, type, data) {
    if (!name || !type || !data) return "Invalid asset upload.";
    this.assets[name] = { type, data };
    return `Asset '${name}' uploaded as ${type}.`;
  },

  // Return all scenes
  get_scenes() {
    return this.scenes;
  },

  // Return all assets
  list_assets() {
    return this.assets;
  },

  // Get a text version of a scene (simulate .tscn)
  get_scene_file(sceneName) {
    const scene = this.scenes[sceneName];
    if (!scene) return null;
    let content = `[scene name="${sceneName}"]\n`;
    for (const nodeName in scene.nodes) {
      const node = scene.nodes[nodeName];
      content += `[node name="${nodeName}" type="${node.type}" parent="${node.parent}"]\n`;
    }
    return content;
  },

  // Process NLP commands (placeholder)
  process_nlp_command(cmd) {
    // Very basic simulation for now
    appendNLP(`[NLP] You typed: ${cmd}`);
    return `[NLP] Processed command: ${cmd}`;
  },

  // Generate project ZIP
  async generate_project_zip(projectName) {
    const zip = new JSZip();
    projectName = projectName || "GodotProject";

    // Scenes & scripts
    for (const sceneName in this.scenes) {
      const scene = this.scenes[sceneName];
      const tscnContent = this.get_scene_file(sceneName);
      zip.file(`${projectName}/${sceneName}.tscn`, tscnContent);
      for (const scriptName in scene.scripts) {
        const code = scene.scripts[scriptName];
        zip.file(`${projectName}/scripts/${scriptName}.gd`, code);
      }
    }

    // Assets
    for (const assetName in this.assets) {
      const asset = this.assets[assetName];
      zip.file(`${projectName}/assets/${assetName}`, new Uint8Array(asset.data));
    }

    // Made-by slide
    const introScene = `[node name="MadeByIntro" type="Label" parent=""]\ntext = "Made with GodotGameAssembler by CCVO"\n`;
    zip.file(`${projectName}/MadeByIntro.tscn`, introScene);

    // Generate ZIP and trigger download
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${projectName}.zip`);
    appendNLP(`Project '${projectName}' ZIP generated and ready for download.`);
  }
};