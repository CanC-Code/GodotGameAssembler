// nlp_pro.js
// Advanced NLP for GodotGameAssembler
// Generates scenes, nodes, assets, and runnable script skeletons

const NLP = (function() {

  const nodeHints = ["Node2D","Sprite","Label","Control","Area2D","Camera2D","Button","TextureRect"];

  const templates = {
    "snake": {
      scenes:["MainMenu","GameScene"],
      nodes:{
        "GameScene":[
          {name:"Player",type:"Sprite",scripts:["PlayerControl.gd"]},
          {name:"Food",type:"Sprite",scripts:["FoodLogic.gd"]},
          {name:"ScoreLabel",type:"Label",scripts:["Score.gd"]}
        ],
        "MainMenu":[
          {name:"StartButton",type:"Button",scripts:["StartButton.gd"]},
          {name:"TitleLabel",type:"Label"}
        ]
      },
      assets:["Player.png","Food.png","Background.png"]
    },
    "tic tac toe": {
      scenes:["MainMenu","GameScene"],
      nodes:{
        "GameScene":[
          {name:"Grid",type:"Control",scripts:["GridLogic.gd"]},
          {name:"PlayerX",type:"Sprite"},
          {name:"PlayerO",type:"Sprite"}
        ]
      },
      assets:["X.png","O.png"]
    }
  };

  // --- Auto-script templates ---
  const scriptTemplates = {
    "PlayerControl.gd": `extends Sprite
var speed = 200
func _process(delta):
    var dir = Vector2.ZERO
    if Input.is_action_pressed("ui_right"): dir.x += 1
    if Input.is_action_pressed("ui_left"): dir.x -= 1
    if Input.is_action_pressed("ui_up"): dir.y -= 1
    if Input.is_action_pressed("ui_down"): dir.y += 1
    position += dir.normalized() * speed * delta`,
    
    "Score.gd": `extends Label
var score = 0
func increase(amount=1):
    score += amount
    text = str(score)`,
    
    "FoodLogic.gd": `extends Sprite
func _ready():
    randomize()
    position = Vector2(randi()%640, randi()%480)`,
    
    "StartButton.gd": `extends Button
func _pressed():
    get_tree().change_scene("res://GameScene.tscn")`,
    
    "GridLogic.gd": `extends Control
# Tic Tac Toe grid logic placeholder`
  };

  // --- Free-form parsing ---
  function parseCommand(cmd){
    cmd = cmd.toLowerCase().trim();
    // First check templates
    for(let key in templates){
      if(cmd.includes(key)) return JSON.parse(JSON.stringify(templates[key]));
    }

    // Fallback: create a default scene
    const plan = { scenes:["MainScene"], nodes:{"MainScene":[]}, assets:[] };
    nodeHints.forEach(type=>{
      if(cmd.includes(type.toLowerCase())){
        plan.nodes["MainScene"].push({name:type+"Auto",type:type});
      }
    });

    // Detect asset references
    const assetMatches = cmd.match(/\b\w+\.(png|jpg|jpeg|gltf|wav|ogg|mp3)\b/g);
    if(assetMatches) assetMatches.forEach(a=>plan.assets.push(a));

    return plan;
  }

  // --- Generate scripts for nodes ---
  function attachScripts(plan){
    for(let sceneName in plan.nodes){
      plan.nodes[sceneName].forEach(node=>{
        node.scripts = node.scripts || [];
        node.scripts.forEach((script,i)=>{
          if(scriptTemplates[script]){
            node.scripts[i] = {name:script,code:scriptTemplates[script]};
          } else {
            node.scripts[i] = {name:script,code:"# Script placeholder"};
          }
        });
      });
    }
  }

  return {
    interpret: function(cmd){
      const plan = parseCommand(cmd);
      attachScripts(plan);
      return plan;
    }
  };
})();