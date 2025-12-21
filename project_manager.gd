// project_manager.gd
// GodotGameAssembler Project Manager

const ProjectManager = (function(){

  const scenes = {};   // sceneName => { nodes: [], scripts: {} }
  const assets = {};   // assetName => { type, data }

  // --- Scene Management ---
  function add_scene(name){
    if(!name || scenes[name]) return;
    scenes[name] = { nodes: [], scripts: {} };
  }

  function add_node(sceneName,nodeName,nodeType,parent=""){
    if(!scenes[sceneName]) add_scene(sceneName);
    scenes[sceneName].nodes.push({ name: nodeName, type: nodeType, parent: parent, scripts: [] });
  }

  function add_script(sceneName,scriptName,code){
    if(!scenes[sceneName]) return;
    scenes[sceneName].scripts[scriptName] = code;

    // Attach script to node if exists
    const node = scenes[sceneName].nodes.find(n=>n.name === scriptName.split(".")[0]);
    if(node) node.scripts.push(scriptName);
  }

  function get_scenes(){ return JSON.parse(JSON.stringify(scenes)); }

  function get_scene_file(sceneName){
    if(!scenes[sceneName]) return "";
    let content = `[gd_scene load_steps=2 format=2]\n`;
    scenes[sceneName].nodes.forEach(node=>{
      content += `[node name="${node.name}" type="${node.type}" parent="${node.parent}"]\n`;
      if(node.scripts.length > 0){
        node.scripts.forEach(s=>content += `script = "res://scripts/${s}"\n`);
      }
    });
    return content;
  }

  // --- Asset Management ---
  function upload_asset(name,type,data){
    assets[name] = { type, data };
  }

  function list_assets(){ return JSON.parse(JSON.stringify(assets)); }

  // --- NLP Command Interface ---
  function process_nlp_command(cmd){
    if(typeof NLP !== "undefined"){
      const plan = NLP.interpret(cmd);
      plan.scenes.forEach(scene => add_scene(scene));
      for(let sceneName in plan.nodes){
        plan.nodes[sceneName].forEach(node=>{
          add_node(sceneName,node.name,node.type,"");
          if(node.scripts){
            node.scripts.forEach(script=>{
              add_script(sceneName,script.name,script.code);
            });
          }
        });
      }
      return `Project plan applied: ${plan.scenes.length} scene(s) added.`;
    } else {
      return "NLP module not loaded.";
    }
  }

  return {
    add_scene,
    add_node,
    add_script,
    get_scenes,
    get_scene_file,
    upload_asset,
    list_assets,
    process_nlp_command
  };
})();