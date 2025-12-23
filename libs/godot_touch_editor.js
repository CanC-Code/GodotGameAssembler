// libs/godot_touch_editor.js
// Author: CCVO
// Purpose: Touch controller editor + finalization hook

function openTouchEditor() {
    if (!GodotState.currentScene) {
        addMessage("system", "No active scene to attach touch controls.");
        return;
    }

    const editor = document.getElementById("touch-editor");
    const canvas = document.getElementById("editor-canvas");
    canvas.innerHTML = "";

    editor.style.display = "block";

    GodotState._touchDraft = [];
}

function createTouchNode(type, name) {
    const canvas = document.getElementById("editor-canvas");

    const el = document.createElement("div");
    el.className = "touch-node";
    el.dataset.type = type;
    el.dataset.name = name;

    el.style.position = "absolute";
    el.style.width = "64px";
    el.style.height = "64px";
    el.style.left = "20px";
    el.style.top = "20px";
    el.style.cursor = "grab";
    el.style.background =
        type === "thumbstick"
            ? "rgba(0,140,255,0.5)"
            : "rgba(0,255,120,0.5)";
    el.style.borderRadius = type === "thumbstick" ? "50%" : "8px";

    canvas.appendChild(el);
    makeDraggable(el, canvas);

    GodotState._touchDraft.push({
        name,
        type,
        element: el
    });
}

function makeDraggable(el, container) {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    el.addEventListener("mousedown", e => {
        dragging = true;
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
    });

    document.addEventListener("mousemove", e => {
        if (!dragging) return;
        el.style.left = Math.max(0, Math.min(container.clientWidth - el.clientWidth, e.clientX - offsetX)) + "px";
        el.style.top = Math.max(0, Math.min(container.clientHeight - el.clientHeight, e.clientY - offsetY)) + "px";
    });

    document.addEventListener("mouseup", () => dragging = false);
}

// ------------------------------
// Save Touch Controller
// ------------------------------
document.getElementById("save-editor").addEventListener("click", () => {
    const action = GodotState.pendingAction;
    if (!action || action.type !== "create_player") {
        document.getElementById("touch-editor").style.display = "none";
        return;
    }

    const controllerName = `${action.playerName}_touch`;

    const controls = GodotState._touchDraft.map(n => ({
        name: n.name,
        type: n.type,
        x: n.element.offsetLeft / document.getElementById("editor-canvas").clientWidth,
        y: n.element.offsetTop / document.getElementById("editor-canvas").clientHeight
    }));

    executeProjectCommand(
        `create touch controller ${controllerName}`
    );

    controls.forEach(c => {
        executeProjectCommand(
            `add ${c.type} ${c.name} to controller ${controllerName} at ${c.x} ${c.y}`
        );
    });

    executeProjectCommand(
        `add player ${action.playerName} with controller ${controllerName}`
    );

    GodotState.nodesInScene[GodotState.currentScene].push({
        name: action.playerName,
        type: "Player",
        controller: controllerName
    });

    GodotState.pendingAction = null;
    GodotState._touchDraft = [];

    document.getElementById("touch-editor").style.display = "none";
    addMessage("system", `Player "${action.playerName}" created with custom touch controller.`);
});

// ------------------------------
document.getElementById("close-editor").addEventListener("click", () => {
    document.getElementById("touch-editor").style.display = "none";
});

// ------------------------------
window.openTouchEditor = openTouchEditor;
window.createTouchNode = createTouchNode;
