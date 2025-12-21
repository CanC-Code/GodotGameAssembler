# project_manager.gd
# Singleton / Autoload
extends Node

# --- Data Structures ---
var scenes = {} # {scene_name: {nodes: [], scripts: {script_name: code}}}
var assets = {} # {filename: {type: "texture/gltf/audio", data: PoolByteArray}}

# --- Scene Management ---
func add_scene(scene_name: String) -> void:
	if scenes.has(scene_name):
		return
	scenes[scene_name] = {"nodes": [], "scripts": {}}

func add_node(scene_name: String, node_name: String, node_type: String, parent_name: String="") -> void:
	if not scenes.has(scene_name):
		return
	var node_data = {
		"name": node_name,
		"type": node_type,
		"parent": parent_name
	}
	scenes[scene_name]["nodes"].append(node_data)

func add_script(scene_name: String, script_name: String, code: String) -> void:
	if not scenes.has(scene_name):
		return
	scenes[scene_name]["scripts"][script_name] = code

# --- Asset Management ---
func upload_asset(filename: String, asset_type: String, data: PoolByteArray) -> void:
	assets[filename] = {"type": asset_type, "data": data}

func list_assets() -> Dictionary:
	return assets

# --- NLP Command Processing ---
func process_nlp_command(command: String) -> String:
	# Example: interpret commands like "Add a sprite node"
	var cmd = command.strip_edges().to_lower()
	if cmd.begins_with("add scene "):
		var scene_name = command.substr(10)
		add_scene(scene_name)
		return "Scene '%s' added via NLP." % scene_name
	elif cmd.begins_with("add node "):
		# Example: "add node Player of type Sprite to Scene1"
		# Simple parser; in practice expand
		return "Node added via NLP (parsing not implemented)."
	else:
		return "Command not recognized."

# --- Project Export Methods for JS ZIP ---
func get_scenes() -> Dictionary:
	# Returns a copy of the scenes dictionary
	return scenes.duplicate(true)

func get_scene_file(scene_name: String) -> String:
	if not scenes.has(scene_name):
		return ""
	var tscn_text = "[gd_scene load_steps=2 format=2]\n\n"
	var scene = scenes[scene_name]
	# Add nodes
	for node in scene["nodes"]:
		tscn_text += '[node name="%s" type="%s" parent="%s"]\n' % [
			node["name"], node["type"], node["parent"]
		]
	tscn_text += "\n"
	# Add scripts
	for script_name in scene["scripts"]:
		tscn_text += '[script name="%s"]\n%s\n\n' % [script_name, scene["scripts"][script_name]]
	return tscn_text

# --- Example: Made-by slide injected automatically ---
func inject_made_by(scene_name: String="MadeByIntro") -> void:
	if not scenes.has(scene_name):
		add_scene(scene_name)
	add_node(scene_name, "MadeByLabel", "Label")
	var code = 'text = "Made with GodotGameAssembler by CCVO"'
	add_script(scene_name, "MadeByIntro.gd", code)

# --- Utility Functions ---
func reset_project() -> void:
	scenes.clear()
	assets.clear()