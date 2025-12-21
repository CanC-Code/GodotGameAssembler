# scene_composer/generator.gd
# Author: CCVO
# Purpose: Converts ProjectGraph data into actual .tscn scenes and .gd scripts
# Ready for export as a fully functional Godot project

extends Node

class_name SceneComposer

signal scene_file_generated(scene_name, file_path)
signal script_file_generated(script_name, file_path)

var project_graph := null  # Set this to the ProjectGraph instance

# ------------------------------
# Public API
# ------------------------------

func compose_all_scenes(output_dir: String) -> bool:
    if not project_graph:
        push_error("SceneComposer requires a ProjectGraph instance.")
        return false

    var dir = Directory.new()
    if not dir.dir_exists(output_dir):
        dir.make_dir_recursive(output_dir)

    for scene_name in project_graph.scenes.keys():
        var scene_data = project_graph.scenes[scene_name]
        var scene_file_path = "%s/%s.tscn" % [output_dir, scene_name]
        _generate_scene_file(scene_name, scene_data, scene_file_path)

        # Generate scripts for this scene
        for script_name in scene_data["scripts"].keys():
            var script_code = scene_data["scripts"][script_name]
            var script_file_path = "%s/%s.gd" % [output_dir, script_name]
            _generate_script_file(script_name, script_code, script_file_path)

    return true

# ------------------------------
# Scene Generation
# ------------------------------

func _generate_scene_file(scene_name: String, scene_data: Dictionary, file_path: String) -> void:
    var scene_text := "[gd_scene load_steps=2 format=2]\n"
    scene_text += "[node name=\"%s\" type=\"%s\"]\n" % [scene_name, scene_data.get("root_node_type", "Node2D")]

    for node_name in scene_data["nodes"].keys():
        var node = scene_data["nodes"][node_name]
        scene_text += "[node name=\"%s\" type=\"%s\" parent=\"%s\"]\n" % [node_name, node["type"], node["parent"]]

        # Properties
        for prop in node["properties"].keys():
            var value = node["properties"][prop]
            scene_text += "%s = %s\n" % [prop, _gd_value_to_string(value)]

        # Scripts
        for script_name in node["scripts"]:
            scene_text += "script = ExtResource( %s )\n" % script_name

    var file = File.new()
    file.open(file_path, File.WRITE)
    file.store_string(scene_text)
    file.close()
    emit_signal("scene_file_generated", scene_name, file_path)

# ------------------------------
# Script Generation
# ------------------------------

func _generate_script_file(script_name: String, script_code: String, file_path: String) -> void:
    var file = File.new()
    file.open(file_path, File.WRITE)
    file.store_string(script_code)
    file.close()
    emit_signal("script_file_generated", script_name, file_path)

# ------------------------------
# Utility
# ------------------------------

func _gd_value_to_string(value) -> String:
    if typeof(value) == TYPE_STRING:
        return "\"%s\"" % value
    elif typeof(value) == TYPE_VECTOR2:
        return "Vector2(%f, %f)" % [value.x, value.y]
    elif typeof(value) == TYPE_VECTOR3:
        return "Vector3(%f, %f, %f)" % [value.x, value.y, value.z]
    elif typeof(value) == TYPE_COLOR:
        return "Color(%f, %f, %f, %f)" % [value.r, value.g, value.b, value.a]
    elif typeof(value) == TYPE_BOOL:
        return str(value)
    else:
        return str(value)