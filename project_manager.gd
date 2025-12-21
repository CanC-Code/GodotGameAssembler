// project_manager.gd
// Handles scenes, nodes, scripts, assets, and NLP commands with NLP_PRO integration

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
      // Get structured plan from NLP
      const plan = await NLP_PRO.process(command);

      if(!plan || plan.length === 0) return "Could not parse command.";

      let response = "";

      // Execute each plan step
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
            await generateProjectGUI();
            response += "Project ZIP generated.\n";
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
  }
};