// libs/godot_touch_editor.js
// Author: CCVO
// Purpose: Touch layout editor

function openTouchEditor() {
    if (!GodotState.currentScene) {
        addMessage("system", "No scene selected to edit touch layout.");
        return;
    }

    const editor = document.getElementById("touch-editor");
    const canvas = document.getElementById("editor-canvas");
    canvas.innerHTML = "";

    const nodes = GodotState.nodesInScene[GodotState.currentScene] || [];
    const touchNodes = nodes.filter(n => n.type === "thumbstick" || n.type === "button");

    touchNodes.forEach(node => {
        const el = document.createElement("div");
        el.className = "touch-node";
        el.dataset.name = node.name;
        el.style.position = "absolute";
        el.style.width = "60px";
        el.style.height = "60px";
        el.style.background = node.type === "thumbstick" ? "rgba(0,150,255,0.5)" : "rgba(0,255,100,0.5)";
        el.style.borderRadius = node.type === "thumbstick" ? "50%" : "10%";
        el.style.cursor = "grab";

        const xPct = node.touchPosition?.x || 0.1;
        const yPct = node.touchPosition?.y || 0.8;
        el.style.left = `${xPct * canvas.clientWidth}px`;
        el.style.top = `${yPct * canvas.clientHeight}px`;

        canvas.appendChild(el);
        makeDraggable(el, canvas, node);
    });

    editor.style.display = "block";
}

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
    }

    function pointerUp() { dragging = false; }

    el.addEventListener("mousedown", pointerDown);
    document.addEventListener("mousemove", pointerMove);
    document.addEventListener("mouseup", pointerUp);

    el.addEventListener("touchstart", e => pointerDown(e.touches[0]));
    document.addEventListener("touchmove", e => pointerMove(e.touches[0]));
    document.addEventListener("touchend", pointerUp);
}

// Editor Buttons
document.getElementById("close-editor").addEventListener("click", () => {
    document.getElementById("touch-editor").style.display = "none";
});
document.getElementById("save-editor").addEventListener("click", () => {
    document.getElementById("touch-editor").style.display = "none";
    addMessage("system", "Touch layout saved for this scene.");
});

window.openTouchEditor = openTouchEditor;
