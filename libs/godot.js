// libs/godot.js
// Author: CCVO
// Purpose: Connect ProjectManager + UI with dynamic top-right panel, NLP, and project tree

(function () {

  if (!window.ProjectManager) throw new Error("ProjectManager not loaded");

  const projectTree = document.getElementById("project-tree");
  const fileInfo = document.getElementById("file-info");
  const filePreview = document.getElementById("file-preview");

  let selectedItem = null;

  // -----------------------------
  // Utility: clear panel
  // -----------------------------
  function clearPanel() {
    fileInfo.innerHTML = "<em>No file selected</em>";
    filePreview.innerHTML = "<em>Preview will appear here</em>";
  }

  // -----------------------------
  // Render project tree
  // -----------------------------
  function renderTree() {
    projectTree.innerHTML = "";

    const scenes = ProjectManager.get_scenes();

    if (!scenes.length) {
      projectTree.innerHTML = "<em>No scenes</em>";
      return;
    }

    scenes.forEach(sceneName => {
      const sceneDiv = document.createElement("div");
      sceneDiv.textContent = sceneName;
      sceneDiv.classList.add("tree-item");
      sceneDiv.dataset.type = "scene";
      sceneDiv.dataset.name = sceneName;

      // Click handler
      sceneDiv.addEventListener("click", () => selectItem(sceneDiv));

      // Node children
      const sceneData = ProjectManager.get_scene_file(sceneName);
      if (sceneData && sceneData.nodes) {
        const nodesContainer = document.createElement("div");
        nodesContainer.style.paddingLeft = "16px";

        Object.keys(sceneData.nodes).forEach(nodeName => {
          const nodeDiv = document.createElement("div");
          nodeDiv.textContent = nodeName;
          nodeDiv.classList.add("tree-item");
          nodeDiv.dataset.type = "node";
          nodeDiv.dataset.scene = sceneName;
          nodeDiv.dataset.name = nodeName;

          nodeDiv.addEventListener("click", () => selectItem(nodeDiv));
          nodesContainer.appendChild(nodeDiv);
        });

        sceneDiv.appendChild(nodesContainer);
      }

      projectTree.appendChild(sceneDiv);
    });

    // TODO: Render folders/files from ProjectManager if needed
  }

  // -----------------------------
  // Select item handler
  // -----------------------------
  function selectItem(div) {
    if (selectedItem) selectedItem.classList.remove("selected");
    selectedItem = div;
    selectedItem.classList.add("selected");

    const type = div.dataset.type;

    if (type === "scene") {
      const scene = ProjectManager.get_scene_file(div.dataset.name);
      if (!scene) return clearPanel();

      let html = `<strong>Scene:</strong> ${div.dataset.name}<br>`;
      const nodes = Object.keys(scene.nodes || {});
      html += `<strong>Nodes:</strong> ${nodes.length}<br>`;
      html += nodes.length ? `<ul>${nodes.map(n => `<li>${n}</li>`).join("")}</ul>` : "";

      fileInfo.innerHTML = html;
      filePreview.innerHTML = "<em>Scene preview not available</em>";

    } else if (type === "node") {
      const sceneName = div.dataset.scene;
      const nodeName = div.dataset.name;
      const node = ProjectManager.get_scene_file(sceneName)?.nodes[nodeName];
      if (!node) return clearPanel();

      let html = `<strong>Node:</strong> ${nodeName}<br>`;
      html += `<strong>Type:</strong> ${node.type}<br>`;
      html += `<strong>Parent:</strong> ${node.parent || "None"}<br>`;
      html += `<strong>Children:</strong> ${node.children.length}<br>`;
      html += node.children.length ? `<ul>${node.children.map(c => `<li>${c}</li>`).join("")}</ul>` : "";
      html += `<strong>Scripts:</strong> ${node.scripts.length}<br>`;
      html += node.scripts.length ? `<ul>${node.scripts.map(s => `<li>${s}</li>`).join("")}</ul>` : "";

      fileInfo.innerHTML = html;
      filePreview.innerHTML = "<em>Node preview not available</em>";
    }

    // Future: folders/files preview handling
  }

  // -----------------------------
  // NLP Logging Helper
  // -----------------------------
  const nlpLog = document.getElementById("nlp-log");
  const nlpInput = document.getElementById("nlp-command");
  const nlpSend = document.getElementById("nlp-send");

  async function sendNLPCommandGUI() {
    const cmd = nlpInput.value.trim();
    if (!cmd) return;
    nlpLog.innerHTML += `<div class="chat-message user">&gt; ${cmd}</div>`;
    nlpInput.value = "";

    if (window.ProjectManager) {
      const result = await ProjectManager.process_nlp_command(cmd);
      nlpLog.innerHTML += `<div class="chat-message system">${result}</div>`;
      nlpLog.scrollTop = nlpLog.scrollHeight;

      // Refresh tree after potential changes
      renderTree();
    } else {
      nlpLog.innerHTML += `<div class="chat-message system">ProjectManager not loaded.</div>`;
    }
  }

  nlpSend.addEventListener("click", sendNLPCommandGUI);
  nlpInput.addEventListener("keydown", e => {
    if (e.key === "Enter") sendNLPCommandGUI();
  });

  // Initial render
  renderTree();
  clearPanel();

})();