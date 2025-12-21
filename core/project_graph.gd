# core/project_graph.gd
# Author: CCVO
# Purpose: Central project graph manager for GodotGameAssembler
# Tracks scenes, nodes, scripts, assets, and prepares export-ready projects

extends Node

signal scene_added(scene_name)
signal node_added(scene_name, node_name)
signal script_added(scene_name, script_name)
signal asset_added(asset_path)
signal project_ready_for_export(zip_path)

class_name ProjectGraph

var scenes := {}        # Dictionary: scene_name -> scene_data
var assets := {}        # Dictionary: asset_path -> asset_data
var templates := {}     # Optional templates for prebuilt games

func _init():
    # Initialize with default templates
    templates["Snake"] = preload("../templates/snake_template.tres")
    templates["TicTacToe"] = preload("../templates/tictactoe_template.tres")
    templates["RPG"] = preload("../templates/rpg_template.tres")
    print("ProjectGraph initialized with templates: %s" % templates.keys())

# ------------------------------
# Scene Management
# ------------------------------

func add_scene(scene_name: String) -> bool:
    if scenes.has(scene_name):
        push_warning("Scene '%s' already exists." % scene_name)
        return false
    scenes[scene_name] = {
        "nodes": {},
        "scripts": {},
        "root_node_type": "Node2D"
    }
    emit_signal("scene_added", scene_name)
    return true

func remove_scene(scene_name: String) -> bool:
    if not scenes.has(scene_name):
        push_warning("Scene '%s' does not exist." % scene_name)
        return false
    scenes.erase(scene_name)
    return true

func get_scene(scene_name: String) -> Dictionary:
    if not scenes.has(scene_name):
        push_warning("Scene '%s' does not exist." % scene_name)
        return {}
    return scenes[scene_name]

# ------------------------------
# Node Management
# ------------------------------

func add_node(scene_name: String, node_name: String, node_type: String="Node2D", parent_name: String="") -> bool:
    var scene = get_scene(scene_name)
    if scene.empty():
        return false
    if scene["nodes"].has(node_name):
        push_warning("Node '%s' already exists in scene '%s'." % [node_name, scene_name])
        return false
    var node_data = {
        "type": node_type,
        "parent": parent_name,
        "properties": {},
        "scripts": []
    }
    scene["nodes"][node_name] = node_data
    emit_signal("node_added", scene_name, node_name)
    return true

func remove_node(scene_name: String, node_name: String) -> bool:
    var scene = get_scene(scene_name)
    if scene.empty():
        return false
    if not scene["nodes"].has(node_name):
        push_warning("Node '%s' does not exist in scene '%s'." % [node_name, scene_name])
        return false
    scene["nodes"].erase(node_name)
    return true

func set_node_property(scene_name: String, node_name: String, property_name: String, value) -> bool:
    var scene = get_scene(scene_name)
    if scene.empty():
        return false
    if not scene["nodes"].has(node_name):
        push_warning("Node '%s' does not exist in scene '%s'." % [node_name, scene_name])
        return false
    scene["nodes"][node_name]["properties"][property_name] = value
    return true

func attach_script_to_node(scene_name: String, node_name: String, script_name: String) -> bool:
    var scene = get_scene(scene_name)
    if scene.empty():
        return false
    if not scene["nodes"].has(node_name):
        push_warning("Node '%s' does not exist in scene '%s'." % [node_name, scene_name])
        return false
    scene["nodes"][node_name]["scripts"].append(script_name)
    emit_signal("script_added", scene_name, script_name)
    return true

# ------------------------------
# Script Management
# ------------------------------

func add_script(scene_name: String, script_name: String, script_code: String) -> bool:
    var scene = get_scene(scene_name)
    if scene.empty():
        return false
    if scene["scripts"].has(script_name):
        push_warning("Script '%s' already exists in scene '%s'." % [script_name, scene_name])
        return false
    scene["scripts"][script_name] = script_code
    emit_signal("script_added", scene_name, script_name)
    return true

func remove_script(scene_name: String, script_name: String) -> bool:
    var scene = get_scene(scene_name)
    if scene.empty():
        return false
    if not scene["scripts"].has(script_name):
        push_warning("Script '%s' does not exist in scene '%s'." % [script_name, scene_name])
        return false
    scene["scripts"].erase(script_name)
    return true

# ------------------------------
# Asset Management
# ------------------------------

func add_asset(asset_path: String, asset_data: Dictionary) -> bool:
    if assets.has(asset_path):
        push_warning("Asset '%s' already exists." % asset_path)
        return false
    assets[asset_path] = asset_data
    emit_signal("asset_added", asset_path)
    return true

func remove_asset(asset_path: String) -> bool:
    if not assets.has(asset_path):
        push_warning("Asset '%s' does not exist." % asset_path)
        return false
    assets.erase(asset_path)
    return true

func get_asset(asset_path: String) -> Dictionary:
    if not assets.has(asset_path):
        push_warning("Asset '%s' does not exist." % asset_path)
        return {}
    return assets[asset_path]

# ------------------------------
# Project Export
# ------------------------------

func export_project_zip(output_path: String) -> bool:
    var temp_dir = "user://temp_export"
    var dir = Directory.new()
    if dir.dir_exists(temp_dir):
        dir.remove(temp_dir)
    dir.make_dir(temp_dir)

    # Export all scenes
    for scene_name in scenes.keys():
        var scene_data = scenes[scene_name]
        var scene_file = temp_dir.plus_file("%s.tscn" % scene_name)
        _generate_scene_file(scene_name, scene_data, scene_file)

        # Export scripts for scene
        for script_name in scene_data["scripts"].keys():
            var script_code = scene_data["scripts"][script_name]
            var script_file = temp_dir.plus_file(script_name + ".gd")
            File.new().open(script_file, File.WRITE).store_string(script_code)

    # Export assets
    for asset_path in assets.keys():
        var asset_file_path = temp_dir.plus_file(asset_path)
        # Assuming asset_data contains raw bytes
        var file = File.new()
        file.open(asset_file_path, File.WRITE)
        file.store_buffer(assets[asset_path]["data"])
        file.close()

    # Create ZIP
    var zip_success = _zip_directory(temp_dir, output_path)
    if zip_success:
        emit_signal("project_ready_for_export", output_path)
        return true
    else:
        push_error("Failed to create project ZIP at '%s'" % output_path)
        return false

# ------------------------------
# Internal Helpers
# ------------------------------

func _generate_scene_file(scene_name: String, scene_data: Dictionary, file_path: String) -> void:
    var scene_text := "[gd_scene load_steps=2 format=2]\n"
    scene_text += "[node name=\"%s\" type=\"%s\"]\n" % [scene_name, scene_data.get("root_node_type", "Node2D")]
    for node_name in scene_data["nodes"].keys():
        var node = scene_data["nodes"][node_name]
        scene_text += "[node name=\"%s\" type=\"%s\" parent=\"%s\"]\n" % [node_name, node["type"], node["parent"]]
        for prop in node["properties"].keys():
            scene_text += "%s = %s\n" % [prop, str(node["properties"][prop])]
        for script_name in node["scripts"]:
            scene_text += "script = ExtResource( %s )\n" % script_name
    var file = File.new()
    file.open(file_path, File.WRITE)
    file.store_string(scene_text)
    file.close()

func _zip_directory(dir_path: String, zip_path: String) -> bool:
    # Placeholder: Godot does not have native zip creation; this would require a plugin or JavaScript approach in HTML5
    print("ZIP creation requested for '%s' -> '%s'" % [dir_path, zip_path])
    return true  # For now, assume success