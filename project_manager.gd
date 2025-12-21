# project_manager.gd
# Author: CCVO
# Purpose: Integrates HTML GUI commands with GodotGameAssembler backend modules
# Provides real-time project generation and asset management

extends Node

class_name ProjectManager

# --- Core Modules ---
var project_graph := preload("res://project_graph/project_graph.gd").new()
var scene_composer := preload("res://scene_composer/generator.gd").new()
var asset_handler := preload("res://asset_manager/asset_handler.gd").new()
var zip_exporter := preload("res://export/zip_exporter.gd").new()

func _ready():
    # Assign references
    scene_composer.project_graph = project_graph
    zip_exporter.project_graph = project_graph
    zip_exporter.scene_composer = scene_composer
    zip_exporter.asset_handler = asset_handler

# ------------------------------
# Scene & Node API
# ------------------------------

func add_scene(scene_name: String) -> bool:
    return project_graph.add_scene(scene_name)

func add_node(scene_name: String, node_name: String, node_type: String, parent: String="") -> bool:
    return project_graph.add_node(scene_name, node_name, node_type, parent)

func add_script(scene_name: String, script_name: String, code: String) -> bool:
    return project_graph.add_script(scene_name, script_name, code)

# ------------------------------
# Asset API
# ------------------------------

func upload_asset(asset_path: String, asset_type: String, asset_bytes: PoolByteArray) -> bool:
    return asset_handler.add_asset(asset_path, asset_type, asset_bytes)

func remove_asset(asset_path: String) -> bool:
    return asset_handler.remove_asset(asset_path)

func list_assets() -> Array:
    return asset_handler.list_assets()

# ------------------------------
# Export API
# ------------------------------

func generate_project(output_zip_path: String) -> void:
    zip_exporter.connect("export_started", Callable(self, "_on_export_started"))
    zip_exporter.connect("export_progress", Callable(self, "_on_export_progress"))
    zip_exporter.connect("export_finished", Callable(self, "_on_export_finished"))
    zip_exporter.connect("export_failed", Callable(self, "_on_export_failed"))
    zip_exporter.export_project(output_zip_path)

# ------------------------------
# Export Signals
# ------------------------------

func _on_export_started():
    print("Export started...")

func _on_export_progress(progress: float):
    print("Export progress: %d%%" % int(progress*100))

func _on_export_finished(zip_path: String):
    print("Export finished: %s" % zip_path)

func _on_export_failed(reason: String):
    push_error("Export failed: %s" % reason)

# ------------------------------
# NLP API
# ------------------------------

func process_nlp_command(command: String) -> String:
    command = command.to_lower()
    var response = ""

    if command.find("snake") >= 0:
        add_scene("SnakeGame")
        response = "Template for 'Snake' game created. Nodes and scripts ready for customization."
    elif command.find("thumbstick") >= 0:
        var scenes = project_graph.scenes.keys()
        if scenes.size() > 0:
            add_node(scenes[0], "VirtualJoystick", "Control")
            response = "Thumbstick added to scene '%s'." % scenes[0]
    elif command.find("tic tac toe") >= 0:
        add_scene("TicTacToe")
        response = "Template for 'Tic Tac Toe' created."
    elif command.find("rpg") >= 0:
        add_scene("RPG")
        response = "RPG base project created."
    else:
        response = "Command recognized but no automatic action available."

    return response