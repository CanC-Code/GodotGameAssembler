# export/zip_exporter.gd
# Author: CCVO
# Purpose: Package GodotGameAssembler projects into a downloadable ZIP
# Combines scenes, scripts, and assets

extends Node

class_name ZipExporter

signal export_started()
signal export_progress(progress: float)
signal export_finished(zip_path: String)
signal export_failed(reason: String)

var project_graph := null       # Reference to ProjectGraph instance
var scene_composer := null      # Reference to SceneComposer instance
var asset_handler := null       # Reference to AssetHandler instance

# ------------------------------
# Public API
# ------------------------------

func export_project(zip_output_path: String) -> void:
    if not project_graph or not scene_composer or not asset_handler:
        emit_signal("export_failed", "Dependencies not set (ProjectGraph, SceneComposer, AssetHandler required)")
        return

    emit_signal("export_started")

    # Temporary folder for assembling project files
    var temp_dir = "user://temp_project_export"
    var dir = Directory.new()
    if dir.dir_exists(temp_dir):
        dir.remove(temp_dir)
    dir.make_dir_recursive(temp_dir)

    # ------------------------------
    # Step 1: Export Scenes and Scripts
    # ------------------------------
    var success = scene_composer.compose_all_scenes(temp_dir)
    if not success:
        emit_signal("export_failed", "SceneComposer failed")
        return

    # ------------------------------
    # Step 2: Export Assets
    # ------------------------------
    success = asset_handler.export_assets(temp_dir)
    if not success:
        emit_signal("export_failed", "AssetHandler failed")
        return

    # ------------------------------
    # Step 3: Inject Made-by Slide
    # ------------------------------
    _inject_made_by_intro(temp_dir)

    # ------------------------------
    # Step 4: Create ZIP
    # ------------------------------
    # HTML5 context requires JS-based zip (pako.js / zip.js). Here we provide a placeholder
    var zip_created = _create_zip_placeholder(temp_dir, zip_output_path)

    if zip_created:
        emit_signal("export_finished", zip_output_path)
    else:
        emit_signal("export_failed", "ZIP creation failed")

# ------------------------------
# Internal Helpers
# ------------------------------

func _inject_made_by_intro(project_dir: String) -> void:
    # Iterate all scenes and prepend a simple intro scene
    for scene_name in project_graph.scenes.keys():
        var scene_file = "%s/%s.tscn" % [project_dir, scene_name]
        if not File.new().file_exists(scene_file):
            continue
        var file = File.new()
        file.open(scene_file, File.READ)
        var content = file.get_as_text()
        file.close()

        # Prepend a made-by comment or minimal node for intro
        var made_by_node = "[node name=\"MadeByIntro\" type=\"Label\" parent=\"\"]\ntext = \"Made with GodotGameAssembler by CCVO\"\n"
        content = made_by_node + content

        file.open(scene_file, File.WRITE)
        file.store_string(content)
        file.close()

func _create_zip_placeholder(input_dir: String, zip_output_path: String) -> bool:
    """
    Placeholder: Godot HTML5 cannot natively create ZIPs; this is handled in JS.
    In desktop Godot, use external libraries or OS.execute("zip ...")
    """
    print("ZIP creation requested: %s -> %s" % [input_dir, zip_output_path])
    # In HTML5, you would call a JS function to read 'input_dir' contents and produce a ZIP
    return true  # Assume success for now