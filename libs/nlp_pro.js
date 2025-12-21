ProjectManager.process_nlp_command = async function(command) {
    appendNLP(`> ${command}`); // Echo command in NLP panel

    try {
        // 1. Get structured plan from NLP_PRO
        const result = await NLP_PRO.process(command); 
        // Expect result = { plan: [...], questions: [...] }
        if (!result || (!result.plan && !result.questions)) return "Could not parse command.";

        const plan = result.plan || [];
        const questions = result.questions || [];
        let response = "";

        // 2. Handle follow-up questions first
        if (questions.length > 0) {
            for (const q of questions) {
                this.nlp.context.pendingQuestions.push(q);
                response += `Question: ${q.question}\n`;
            }
            appendNLP(response);
            return response;
        }

        // 3. Execute plan steps
        for (const step of plan) {
            switch (step.action) {
                case "create_scene":
                    response += this.add_scene(step.name)
                        ? `Scene '${step.name}' created.\n`
                        : `Scene '${step.name}' already exists.\n`;
                    this.nlp.context.currentScene = step.name;
                    break;

                case "add_node":
                    response += this.add_node(step.scene, step.name, step.type, step.parent || "")
                        ? `Node '${step.name}' added to scene '${step.scene}'.\n`
                        : `Node '${step.name}' already exists in scene '${step.scene}'.\n`;
                    if (step.script) {
                        response += this.add_script(step.script.name, step.script.code)
                            ? `Script '${step.script.name}' added.\n`
                            : `Script '${step.script.name}' already exists.\n`;
                        response += this.attach_script(step.scene, step.name, step.script.name)
                            ? `Script '${step.script.name}' attached to '${step.name}'.\n`
                            : `Script '${step.script.name}' already attached to '${step.name}'.\n`;
                    }
                    break;

                case "add_script":
                    response += this.add_script(step.name, step.code || "# Your code here\n")
                        ? `Script '${step.name}' created.\n`
                        : `Script '${step.name}' already exists.\n`;
                    if (step.attachTo) {
                        response += this.attach_script(step.attachTo.scene, step.attachTo.node, step.name)
                            ? `Script '${step.name}' attached to '${step.attachTo.node}'.\n`
                            : `Script '${step.name}' already attached.\n`;
                    }
                    break;

                case "upload_asset":
                    response += `Use GUI to upload asset: '${step.name}'.\n`;
                    break;

                case "procedural_generate":
                    if (step.scene && step.worldType) {
                        this.nlp._generateTerrain(step.scene, step.worldType);
                        response += `Procedurally generated '${step.worldType}' in scene '${step.scene}'.\n`;
                    }
                    break;

                case "enable_multiplayer":
                    this.nlp._setupMultiplayer(step.scene, step.mode || "ENet");
                    response += `Multiplayer enabled for scene '${step.scene}'.\n`;
                    break;

                case "add_loot":
                    if (step.enemy && step.item) {
                        this.nlp.LootManager.addLoot(step.enemy, step.item, step.chance || 0.5);
                        this.nlp.LootManager.assignLootToEnemies();
                        response += `Loot '${step.item}' assigned to enemy '${step.enemy}'.\n`;
                    }
                    break;

                case "add_quest":
                    if (step.npc && step.objective && step.reward) {
                        this.nlp.LootManager.addQuest(step.npc, step.objective, step.reward);
                        this.nlp.LootManager.assignQuestsToNPCs();
                        response += `Quest '${step.objective}' for NPC '${step.npc}' with reward '${step.reward}' added.\n`;
                    }
                    break;

                default:
                    response += `Unknown action: ${step.action}\n`;
            }
        }

        // 4. Ask pending questions if any
        if (this.nlp.context.pendingQuestions.length > 0) {
            const nextQ = this.nlp.context.pendingQuestions[0];
            response += `Next question: ${nextQ.question}\n`;
        }

        appendNLP(response);
        return response;

    } catch (err) {
        const errMsg = `Error: ${err}`;
        appendNLP(errMsg);
        console.error(err);
        return errMsg;
    }
};