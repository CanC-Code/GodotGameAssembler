ProjectManager.process_nlp_command = async function(command){
    appendNLP(`> ${command}`); // Echo command in NLP panel

    // 1. Use nlp_pro.js to interpret the command
    let plan = await NLP_PRO.process(command); // assuming NLP_PRO exposes `process` returning structured plan

    if(!plan || plan.length === 0) return "Could not parse command.";

    let response = "";

    // 2. Execute plan
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
            default:
                response += `Unknown action: ${step.action}\n`;
        }
    }

    appendNLP(response);
    return response;
};