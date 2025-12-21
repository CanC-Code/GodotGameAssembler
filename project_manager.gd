// project_manager.gd
// Handles scenes, nodes, scripts, assets, and NLP commands

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
  process_nlp_command: function(command){
    command = command.toLowerCase();

    // Example: create a new scene
    if(command.startsWith("create scene ")){
      const name = command.replace("create scene ","").trim();
      return this.add_scene(name);
    }

    // Example: add node
    if(command.startsWith("add node ")){
      // Format: add node <name> as <type> to <scene>
      const regex = /add node (\S+) as (\S+) to (\S+)/;
      const match = command.match(regex);
      if(match){
        const [, nodeName, nodeType, sceneName] = match;
        return this.add_node(sceneName, nodeName, nodeType);
      }
      return "Invalid add node syntax. Use: add node <name> as <type> to <scene>";
    }

    // Example: add script
    if(command.startsWith("add script ")){
      // Format: add script <scriptName> to <scene>
      const regex = /add script (\S+) to (\S+)/;
      const match = command.match(regex);
      if(match){
        const [, scriptName, sceneName] = match;
        return this.add_script(sceneName, scriptName, "# Your code here\n");
      }
      return "Invalid add script syntax. Use: add script <name> to <scene>";
    }

    // Example: upload asset (stub)
    if(command.startsWith("upload asset ")){
      return "Use GUI to upload assets in browser.";
    }

    // Example: generate project
    if(command.startsWith("generate project")){
      generateProjectGUI(); // Calls the HTML function
      return "Generating project ZIP...";
    }

    return "Unknown command. Try: 'create scene <name>', 'add node <name> as <type> to <scene>', 'add script <name> to <scene>'";
  }
};