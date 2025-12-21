// godot.js
// Application bootstrap + UI glue

(function () {

    if (!window.ProjectManager) {
        throw new Error("ProjectManager not loaded");
    }

    if (!window.NLP_PRO) {
        console.warn("NLP_PRO not loaded");
    }

    window.sendNLPCommandGUI = async function () {
        const input = document.getElementById("nlp-command");
        const log = document.getElementById("nlp-log");

        if (!input || !log) {
            console.error("NLP UI elements missing");
            return;
        }

        const command = input.value.trim();
        if (!command) return;

        log.textContent += `> ${command}\n`;
        input.value = "";

        try {
            const result =
                await window.ProjectManager.process_nlp_command(command);

            if (result) {
                log.textContent += `${result}\n`;
            }
        } catch (err) {
            log.textContent += `Error: ${err.message}\n`;
            console.error(err);
        }

        log.scrollTop = log.scrollHeight;
    };

    console.log("Godot Game Assembler initialized");

})();