// GodotGameAssembler Backend Integration
// Handles scenes, nodes, assets, and NLP commands

const ProjectManager = (function() {
    // Internal state
    const scenes = {};       // { sceneName: { nodes: {}, scripts: {} } }
    const assets = {};       // { assetName: { type, data } }

    return {
        // --- Scenes ---
        add_scene: function(name){
            if(scenes[name]) return `Scene '${name}' already exists.`;
            scenes[name] = { nodes:{}, scripts:{} };
            updateFileBrowser();
            return `Scene '${name}' created.`;
        },
        get_scenes: function(){
            return scenes;
        },
        get_scene_file: function(name){
            if(!scenes[name]) return '';
            // Minimal TSCN placeholder
            return `[gd_scene load_steps=1 format=2]\n[node name="${name}" type="Node"]\n`;
        },

        // --- Nodes ---
        add_node: function(sceneName, nodeName, type, parent){
            if(!scenes[sceneName]) return `Scene '${sceneName}' does not exist.`;
            scenes[sceneName].nodes[nodeName] = { type, parent, scripts:{} };
            updateFileBrowser();
            return `Node '${nodeName}' added to scene '${sceneName}'.`;
        },

        // --- Scripts ---
        add_script: function(sceneName, scriptName, code){
            if(!scenes[sceneName]) return `Scene '${sceneName}' does not exist.`;
            scenes[sceneName].scripts[scriptName] = code;
            updateFileBrowser();
            return `Script '${scriptName}' added to scene '${sceneName}'.`;
        },

        // --- Assets ---
        upload_asset: function(name, type, data){
            assets[name] = { type, data };
            updateAssetBrowser();
            return `Asset '${name}' uploaded as ${type}.`;
        },
        list_assets: function(){ return assets; },

        // --- NLP Command Processing ---
        process_nlp_command: function(cmd){
            // Very basic demo: only adds scene if command starts with 'add scene '
            if(cmd.toLowerCase().startsWith('add scene ')){
                const name = cmd.substring(10).trim();
                return this.add_scene(name);
            }
            return `Command not recognized: "${cmd}"`;
        }
    };

})();

// --- UI Updates ---
function updateFileBrowser(){
    const fileContent = document.getElementById('files-content');
    if(!fileContent) return;
    const scenes = ProjectManager.get_scenes();
    let html = '';
    for(let sceneName in scenes){
        html += `<div class="collapsible">${sceneName}</div>`;
        html += `<div class="content">`;
        const scene = scenes[sceneName];
        html += `<strong>Nodes:</strong><br>`;
        for(let nodeName in scene.nodes){
            const node = scene.nodes[nodeName];
            html += `<div>${nodeName} (${node.type})</div>`;
        }
        html += `<strong>Scripts:</strong><br>`;
        for(let scriptName in scene.scripts){
            html += `<div>${scriptName}</div>`;
        }
        html += `</div>`;
    }
    fileContent.innerHTML = html;

    // Reattach collapsible behavior
    document.querySelectorAll('.collapsible').forEach(c => {
        c.addEventListener('click', function(){
            this.nextElementSibling.style.display = this.nextElementSibling.style.display==='block'?'none':'block';
        });
    });
}

function updateAssetBrowser(){
    const assetContent = document.getElementById('assets-content');
    if(!assetContent) return;
    const assets = ProjectManager.list_assets();
    let html = '';
    for(let name in assets){
        const asset = assets[name];
        html += `<div onclick="previewAsset('${name}')">${name} (${asset.type})</div>`;
    }
    assetContent.innerHTML = html;
}

function previewAsset(name){
    const asset = ProjectManager.list_assets()[name];
    if(!asset) return;
    const preview = document.getElementById('preview-content');
    if(asset.type === 'texture'){
        const blob = new Blob([asset.data]);
        const url = URL.createObjectURL(blob);
        preview.innerHTML = `<img src="${url}" style="max-width:100%; max-height:100%;">`;
    } else if(asset.type === 'gltf'){
        preview.innerHTML = `<div style="color:#aaa;">[GLTF Model: ${name} preview placeholder]</div>`;
        // TODO: Integrate Three.js GLTF viewer
    } else if(asset.type === 'audio'){
        const blob = new Blob([asset.data]);
        const url = URL.createObjectURL(blob);
        preview.innerHTML = `<audio controls src="${url}"></audio>`;
    } else {
        preview.innerHTML = `<div style="color:#aaa;">No preview available for ${asset.type}</div>`;
    }
}

// --- NLP integration ---
document.getElementById('nlp-send').addEventListener('click', () => {
    const cmd = document.getElementById('nlp-command').value.trim();
    if(!cmd) return;
    appendNLP(`> ${cmd}`);
    document.getElementById('nlp-command').value='';
    const response = ProjectManager.process_nlp_command(cmd);
    appendNLP(response);
});

function appendNLP(msg){
    const panel = document.getElementById('nlp-messages');
    panel.innerHTML += `<div>${msg}</div>`;
    panel.scrollTop = panel.scrollHeight;
}

// Initialize preview panels
updateFileBrowser();
updateAssetBrowser();