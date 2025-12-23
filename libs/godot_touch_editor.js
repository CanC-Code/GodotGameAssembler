// libs/godot_touch_editor.js
// Author: CCVO
// Purpose: Touch layout editor with live controller binding

let currentControllerFile = null; // stores the JSON name of the controller being edited
let currentControllerConfig = null; // live config

function openTouchEditor(controllerFile = null) {
    const editor = document.getElementById("touch-editor");
    const canvas = document.getElementById("editor-canvas");
    canvas.innerHTML = "";

    currentControllerFile = controllerFile;

    if (controllerFile && GodotState.controllers[controllerFile]) {
        currentControllerConfig = JSON.parse(JSON.stringify(GodotState.controllers[controllerFile]));
    } else {
        currentControllerConfig = { nodes: [] };
    }

    const nodes = currentControllerConfig.nodes || [];

    nodes.forEach(node => {
        const el = document.createElement("div");
        el.className = "touch-node";
        el.dataset.name = node.name;
        el.style.position = "absolute";
        el.style.width = "60px";
        el.style.height = "60px";
        el.style.background = node.type === "thumbstick" ? "rgba(0,150,255,0.5)" : "rgba(0,255,100,0.5)";
        el.style.borderRadius = node.type === "thumbstick" ? "50%" : "10%";
        el.style.cursor = "grab";

        const xPct = node.touchPosition?.x ?? 0.1;
        const yPct = node.touchPosition?.y ?? 0.8;
        el.style.left = `${xPct * canvas.clientWidth}px`;
        el.style.top = `${yPct * canvas.clientHeight}px`;

        canvas.appendChild(el);
        makeDraggable(el, canvas, node);
    });

    editor.style.display = "block";
}

// Live drag update
function makeDraggable(el, container, node) {
    let offsetX, offsetY, dragging = false;

    function pointerDown(e) {
        e.preventDefault();
        dragging = true;
        const rect = el.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    }

    function pointerMove(e) {
        if (!dragging) return;
        let x = e.clientX - container.getBoundingClientRect().left - offsetX;
        let y = e.clientY - container.getBoundingClientRect().top - offsetY;

        x = Math.max(0, Math.min(container.clientWidth - el.clientWidth, x));
        y = Math.max(0, Math.min(container.clientHeight - el.clientHeight, y));

        el.style.left = x + "px";
        el.style.top = y + "px";

        node.touchPosition = {
            x: x / container.clientWidth,
            y: y / container.clientHeight
        };

        // Save live
        saveControllerConfig();
    }

    function pointerUp() { dragging = false; }

    el.addEventListener("mousedown", pointerDown);
    document.addEventListener("mousemove", pointerMove);
    document.addEventListener("mouseup", pointerUp);

    el.addEventListener("touchstart", e => pointerDown(e.touches[0]));
    document.addEventListener("touchmove", e => pointerMove(e.touches[0]));
    document.addEventListener("touchend", pointerUp);
}

// Save current controller config
function saveControllerConfig() {
    if (!currentControllerFile) return;
    GodotState.controllers[currentControllerFile] = JSON.parse(JSON.stringify(currentControllerConfig));
    addMessage("system", `Controller "${currentControllerFile}" updated.`);
}

// Editor Buttons
document.getElementById("close-editor").addEventListener("click", () => {
    document.getElementById("touch-editor").style.display = "none";
});

document.getElementById("save-editor").addEventListener("click", () => {
    if (!currentControllerFile) {
        const newFile = `controller_custom_${Date.now()}`;
        currentControllerFile = newFile;
    }
    GodotState.controllers[currentControllerFile] = JSON.parse(JSON.stringify(currentControllerConfig));
    document.getElementById("touch-editor").style.display = "none";
    addMessage("system", `Controller "${currentControllerFile}" saved.`);
});

window.openTouchEditor = openTouchEditor;
