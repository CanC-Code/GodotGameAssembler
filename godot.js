// godot.js
// UI bootstrap + project reflection

(function () {

    if (!window.ProjectManager) {
        throw new Error("ProjectManager not loaded");
    }

    const treeEl = document.getElementById("project-tree");

    function renderProjectTree() {
        const scenes = window.ProjectManager.get_scenes();
        treeEl.innerHTML = "";

        if (!scenes.length) {
            treeEl.innerHTML = "<em>No scenes</em>";
            return;
        }

        scenes.forEach(scene => {
            const div = document.createElement("div");
            div.className = "tree-item";
            div.textContent = scene;
            div.onclick = () => selectScene(scene, div);
            treeEl.appendChild(div);
        });
    }

    function selectScene(scene, el) {
        document.querySelectorAll(".tree-item")
            .forEach(n => n.classList.remove("selected"));
        el.classList.add("selected");

        document.getElementById("file-info").textContent =
            `Scene: ${scene}`;

        document.getElementById("file-preview").textContent =
            window.ProjectManager.get_scene_file(scene);
    }

    window.sendNLPCommandGUI = async function () {
        const input = document.getElementById("nlp-command");
        const log = document.getElementById("nlp-log");

        const command = input.value.trim();
        if (!command) return;

        log.textContent += `> ${command}\n`;
        input.value = "";

        const result =
            await window.ProjectManager.process_nlp_command(command);

        if (result) log.textContent += `${result}\n`;

        renderProjectTree();
        log.scrollTop = log.scrollHeight;
    };

    document.getElementById("nlp-send")
        .addEventListener("click", window.sendNLPCommandGUI);

    renderProjectTree();

    console.log("GUI initialized");

})();