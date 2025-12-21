// project_manager.gd
// Handles scenes, nodes, scripts, assets, and NLP commands with automatic project plan execution

const ProjectManager = {
  scenes: {},
  assets: {},

  // --- Scene Management ---
  add_scene: function(name){
    if(this.scenes[name]) return `Scene '${name}' already exists.`;
    this.scenes[name] = { nodes: [], scripts: {} };
    return `Scene '${name}' created.`;
  },

  add_node: function(sceneName, nodeName, nodeType, parent=""){
    const scene = this.scenes[sceneName];
    if(!scene) return `Scene '${sceneName}' does not exist.`;
    scene.nodes.push({ name: nodeName, type: nodeType, parent: parent });
    return `Node '${nodeName}' (${nodeType}) added to scene '${sceneName}'.`;
  },

  add_script: function(sceneName, scriptName, code){
    const scene = this.scenes[sceneName];
    if(!scene) return `Scene '${sceneName}' does not exist.`;
    scene.scripts[scriptName] = code;
    return `Script '${scriptName}' added to scene '${sceneName}'.`;
  },

  get_scenes: function(){
    return this.scenes;
  },

  get_scene_file: function(sceneName){
    const scene = this.scenes[sceneName];
    if(!scene) return "";
    let content = `[gd_scene load_steps=2 format=2]\n`;
    scene.nodes.forEach(node=>{
      content += `[node name="${node.name}" type="${node.type}" parent="${node.parent}"]\n`;
    });
    return content;
  },

  // --- Asset Management ---
  upload_asset: function(name, type, data){
    this.assets[name] = { type: type, data: data };
    return `Asset '${name}' uploaded as ${type}.`;
  },

  list_assets: function(){
    return this.assets;
  },

  get_asset: function(name){
    return this.assets[name];
  },

  // --- NLP Command Handling ---
  process_nlp_command: async function(command){
    appendNLP(`> ${command}`);

    if(typeof NLP_PRO === "undefined") return "NLP_PRO not loaded.";

    try {
      // 1. Get structured plan from NLP
      const plan = await NLP_PRO.process(command);
      if(!plan || plan.length === 0) return "Could not parse command.";

      let response = "";

      // 2. Execute each plan step
      for(let step of plan){
        switch(step.action){
          case "create_scene":
            response += this.add_scene(step.name) + "\n";
            break;
          case "add_node":
            response += this.add_node(step.scene, step.name, step.type, step.parent || "") + "\n";
            break;
          case "add_script":
            response += this.add_script(step.scene, step.name, step.code || "# Your code here\n") + "\n";
            break;
          case "upload_asset":
            response += "Use GUI to upload assets: " + step.name + "\n";
            break;
          case "generate_project":
            await this.generate_project_zip(step.projectName || "GodotProject");
            response += "Project ZIP generated.\n";
            break;
          case "add_intro_scene":
            response += this.create_intro_scene(step.text || "Made with GodotGameAssembler by CCVO") + "\n";
            break;
          default:
            response += `Unknown action: ${step.action}\n`;
        }
      }

      appendNLP(response);
      return response;

    } catch(e){
      console.error("NLP Error:", e);
      return "Error processing NLP command.";
    }
  },

  // --- Auto-generated Intro / Menu ---
  create_intro_scene: function(text){
    const sceneName = "IntroScene";
    this.add_scene(sceneName);
    this.add_node(sceneName, "IntroLabel", "Label");
    const scriptContent = `extends Label\n\nfunc _ready():\n    text = "${text}"`;
    this.add_script(sceneName, "IntroScript", scriptContent);
    return `Intro scene '${sceneName}' created with text: "${text}"`;
  },

  // --- Project Generation ---
  generate_project_zip: async function(projectName){
    const status = document.getElementById("export-status");
    status.innerText = "Generating project ZIP...";
    appendNLP(`Generating project '${projectName}'...`);

    const zip = new JSZip();

    // Add scenes and scripts
    const scenes = this.get_scenes();
    for(const sceneName in scenes){
      const scene = scenes[sceneName];
      const tscnContent = this.get_scene_file(sceneName);
      zip.file(`${projectName}/${sceneName}.tscn`, tscnContent);

      for(const scriptName in scene.scripts){
        const code = scene.scripts[scriptName];
        zip.file(`${projectName}/scripts/${scriptName}.gd`, code);
      }
    }

    // Add assets
    const assets = this.list_assets();
    for(const assetName in assets){
      const asset = assets[assetName];
      const buffer = new Uint8Array(asset.data);
      zip.file(`${projectName}/assets/${assetName}`, buffer);
    }

    // Generate ZIP and trigger download
    const content = await zip.generateAsync({ type:"blob" });
    saveAs(content, `${projectName}.zip`);

    status.innerText = `Project '${projectName}' ZIP ready for download.`;
    appendNLP(`Project '${projectName}' generated and ready for download.`);
  }
};