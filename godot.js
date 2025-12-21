// export/godot.js
// Author: CCVO
// Purpose: UI → ProjectManager bridge

function appendNLP(text) {
    const log = document.getElementById("nlp-log");
    if (!log) return;
    log.textContent += text + "\n";
    log.scrollTop = log.scrollHeight;
}

async function sendNLPCommandGUI() {
    const input = document.getElementById("nlp-command");
    if (!input) return;

    const command = input.value.trim();
    if (!command) return;

    appendNLP("> " + command);
    input.value = "";

    const response = await ProjectManager.process_nlp_command(command);
    appendNLP(response);
}

// Expose for HTML
window.sendNLPCommandGUI = sendNLPCommandGUI;
