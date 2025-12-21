# asset_manager/asset_handler.gd
# Author: CCVO
# Purpose: Manage assets for GodotGameAssembler
# Tracks, validates, and organizes assets for export

extends Node

class_name AssetHandler

signal asset_added(asset_path)
signal asset_removed(asset_path)
signal asset_invalid(asset_path, reason)

var assets := {}  # Dictionary: key=asset_path, value=Dictionary {type, data, original_name}

# ------------------------------
# Public API
# ------------------------------

func add_asset(asset_path: String, asset_type: String, asset_data: PoolByteArray) -> bool:
    """
    Add an asset to the project.
    asset_path: relative path within the Godot project (e.g., "assets/sprites/player.png")
    asset_type: "texture", "gltf", "audio", "font", etc.
    asset_data: raw bytes of the asset
    """
    if assets.has(asset_path):
        push_warning("Asset '%s' already exists." % asset_path)
        return false

    if not _validate_asset(asset_type, asset_data):
        emit_signal("asset_invalid", asset_path, "Invalid data for type '%s'" % asset_type)
        return false

    assets[asset_path] = {
        "type": asset_type,
        "data": asset_data,
        "original_name": asset_path.get_file()
    }

    emit_signal("asset_added", asset_path)
    return true

func remove_asset(asset_path: String) -> bool:
    if not assets.has(asset_path):
        push_warning("Asset '%s' does not exist." % asset_path)
        return false
    assets.erase(asset_path)
    emit_signal("asset_removed", asset_path)
    return true

func get_asset(asset_path: String) -> Dictionary:
    if not assets.has(asset_path):
        push_warning("Asset '%s' does not exist." % asset_path)
        return {}
    return assets[asset_path]

func list_assets() -> Array:
    return assets.keys()

# ------------------------------
# Asset Export
# ------------------------------

func export_assets(output_dir: String) -> bool:
    """
    Copy all assets to the output directory, preserving folder structure.
    """
    var dir = Directory.new()
    if not dir.dir_exists(output_dir):
        dir.make_dir_recursive(output_dir)

    for asset_path in assets.keys():
        var asset_info = assets[asset_path]
        var full_path = "%s/%s" % [output_dir, asset_path]

        # Ensure folder exists
        var parent_dir = full_path.get_base_dir()
        if not dir.dir_exists(parent_dir):
            dir.make_dir_recursive(parent_dir)

        # Write file
        var file = File.new()
        var err = file.open(full_path, File.WRITE)
        if err != OK:
            push_error("Failed to write asset '%s' to '%s'" % [asset_path, full_path])
            continue
        file.store_buffer(asset_info["data"])
        file.close()

    return true

# ------------------------------
# Validation Helpers
# ------------------------------

func _validate_asset(asset_type: String, asset_data: PoolByteArray) -> bool:
    """
    Basic validation for common asset types.
    """
    match asset_type:
        "texture", "audio", "font":
            return asset_data.size() > 0
        "gltf":
            # Minimal check: must contain ASCII "glTF" somewhere
            var str_data = asset_data.get_string_from_ascii()
            return str_data.find("glTF") != -1
        _:
            push_warning("Unknown asset type '%s'. Accepting by default." % asset_type)
            return true