# Excalidraw Skill — Full Examples

## Example 1: Photosynthesis Diagram

Prompt: "Explain how photosynthesis works"

Layout: Title at top, leaf zone background, process flow (Light Reactions → Calvin Cycle), inputs/outputs around it, sun illustration.

```json
[
  {"type":"text","id":"ti","x":280,"y":10,"text":"Photosynthesis","fontSize":28,"strokeColor":"#1e1e1e"},
  {"type":"text","id":"fo","x":245,"y":48,"text":"6CO2 + 6H2O --> C6H12O6 + 6O2","fontSize":16,"strokeColor":"#b0b0b0"},
  {"type":"rectangle","id":"lf","x":150,"y":90,"width":520,"height":380,"backgroundColor":"#d3f9d8","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#22c55e","strokeWidth":1,"opacity":35},
  {"type":"text","id":"lfl","x":170,"y":96,"text":"Inside the Leaf","fontSize":16,"strokeColor":"#22c55e"},
  {"type":"rectangle","id":"lr","x":190,"y":190,"width":160,"height":70,"backgroundColor":"#fff3bf","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#f59e0b","label":{"text":"Light Reactions","fontSize":16}},
  {"type":"arrow","id":"a1","x":350,"y":225,"width":120,"height":0,"points":[[0,0],[120,0]],"strokeColor":"#1e1e1e","strokeWidth":2,"endArrowhead":"arrow","label":{"text":"ATP","fontSize":14}},
  {"type":"rectangle","id":"cc","x":470,"y":190,"width":160,"height":70,"backgroundColor":"#d0bfff","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#8b5cf6","label":{"text":"Calvin Cycle","fontSize":16}},
  {"type":"rectangle","id":"sl","x":10,"y":200,"width":120,"height":50,"backgroundColor":"#fff3bf","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#f59e0b","label":{"text":"Sunlight","fontSize":16}},
  {"type":"arrow","id":"a2","x":130,"y":225,"width":60,"height":0,"points":[[0,0],[60,0]],"strokeColor":"#f59e0b","strokeWidth":2,"endArrowhead":"arrow"},
  {"type":"rectangle","id":"wa","x":200,"y":360,"width":140,"height":50,"backgroundColor":"#a5d8ff","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#4a9eed","label":{"text":"Water (H2O)","fontSize":16}},
  {"type":"arrow","id":"a3","x":270,"y":360,"width":0,"height":-100,"points":[[0,0],[0,-100]],"strokeColor":"#4a9eed","strokeWidth":2,"endArrowhead":"arrow"},
  {"type":"rectangle","id":"co","x":480,"y":360,"width":130,"height":50,"backgroundColor":"#ffd8a8","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#f59e0b","label":{"text":"CO2","fontSize":16}},
  {"type":"arrow","id":"a4","x":545,"y":360,"width":0,"height":-100,"points":[[0,0],[0,-100]],"strokeColor":"#f59e0b","strokeWidth":2,"endArrowhead":"arrow"},
  {"type":"rectangle","id":"ox","x":540,"y":100,"width":100,"height":40,"backgroundColor":"#ffc9c9","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#ef4444","label":{"text":"O2","fontSize":16}},
  {"type":"arrow","id":"a5","x":310,"y":190,"width":230,"height":-50,"points":[[0,0],[230,-50]],"strokeColor":"#ef4444","strokeWidth":2,"endArrowhead":"arrow"},
  {"type":"rectangle","id":"gl","x":690,"y":195,"width":120,"height":60,"backgroundColor":"#c3fae8","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#22c55e","label":{"text":"Glucose","fontSize":18}},
  {"type":"arrow","id":"a6","x":630,"y":225,"width":60,"height":0,"points":[[0,0],[60,0]],"strokeColor":"#22c55e","strokeWidth":2,"endArrowhead":"arrow"},
  {"type":"ellipse","id":"sun","x":30,"y":110,"width":50,"height":50,"backgroundColor":"#fff3bf","fillStyle":"solid","strokeColor":"#f59e0b","strokeWidth":2},
  {"type":"arrow","id":"r1","x":55,"y":108,"width":0,"height":-14,"points":[[0,0],[0,-14]],"strokeColor":"#f59e0b","strokeWidth":2,"endArrowhead":null,"startArrowhead":null},
  {"type":"arrow","id":"r2","x":55,"y":162,"width":0,"height":14,"points":[[0,0],[0,14]],"strokeColor":"#f59e0b","strokeWidth":2,"endArrowhead":null,"startArrowhead":null},
  {"type":"arrow","id":"r3","x":28,"y":135,"width":-14,"height":0,"points":[[0,0],[-14,0]],"strokeColor":"#f59e0b","strokeWidth":2,"endArrowhead":null,"startArrowhead":null},
  {"type":"arrow","id":"r4","x":82,"y":135,"width":14,"height":0,"points":[[0,0],[14,0]],"strokeColor":"#f59e0b","strokeWidth":2,"endArrowhead":null,"startArrowhead":null},
  {"type":"arrow","id":"r5","x":73,"y":117,"width":10,"height":-10,"points":[[0,0],[10,-10]],"strokeColor":"#f59e0b","strokeWidth":2,"endArrowhead":null,"startArrowhead":null},
  {"type":"arrow","id":"r6","x":37,"y":117,"width":-10,"height":-10,"points":[[0,0],[-10,-10]],"strokeColor":"#f59e0b","strokeWidth":2,"endArrowhead":null,"startArrowhead":null},
  {"type":"arrow","id":"r7","x":73,"y":153,"width":10,"height":10,"points":[[0,0],[10,10]],"strokeColor":"#f59e0b","strokeWidth":2,"endArrowhead":null,"startArrowhead":null},
  {"type":"arrow","id":"r8","x":37,"y":153,"width":-10,"height":10,"points":[[0,0],[-10,10]],"strokeColor":"#f59e0b","strokeWidth":2,"endArrowhead":null,"startArrowhead":null}
]
```

## Example 2: Storyboard (Browser UI Mockup)

Prompt: "Create storyboard showing how to install Excalidraw connector to claude.ai"

Layout: Two browser windows side-by-side. Left = Claude.ai chat. Right = Settings/Connectors page. Modal overlay for "Add custom connector".

```json
[
  {"type":"rectangle","id":"wf1","x":20,"y":40,"width":700,"height":500,"backgroundColor":"#fafaf7","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#d4d4d0","strokeWidth":1},
  {"type":"rectangle","id":"tb1","x":20,"y":40,"width":700,"height":38,"backgroundColor":"#ededed","fillStyle":"solid","strokeColor":"#d4d4d0","strokeWidth":1},
  {"type":"ellipse","id":"dr1","x":42,"y":50,"width":12,"height":12,"backgroundColor":"#ff5f57","fillStyle":"solid","strokeColor":"#ff5f57","strokeWidth":1},
  {"type":"ellipse","id":"dy1","x":60,"y":50,"width":12,"height":12,"backgroundColor":"#febc2e","fillStyle":"solid","strokeColor":"#febc2e","strokeWidth":1},
  {"type":"ellipse","id":"dg1","x":78,"y":50,"width":12,"height":12,"backgroundColor":"#28c840","fillStyle":"solid","strokeColor":"#28c840","strokeWidth":1},
  {"type":"rectangle","id":"chtab","x":310,"y":48,"width":56,"height":24,"backgroundColor":"#ffffff","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#d4d4d0","strokeWidth":1,"label":{"text":"Chat","fontSize":14}},
  {"type":"rectangle","id":"cwtab","x":370,"y":48,"width":70,"height":24,"roundness":{"type":3},"strokeColor":"#d4d4d0","strokeWidth":1,"label":{"text":"Cowork","fontSize":14}},
  {"type":"text","id":"logo","x":345,"y":155,"text":"*","fontSize":64,"strokeColor":"#D77655"},
  {"type":"text","id":"brnd","x":290,"y":225,"text":"Claude.ai","fontSize":28,"strokeColor":"#1e1e1e"},
  {"type":"rectangle","id":"ta","x":110,"y":340,"width":520,"height":100,"backgroundColor":"#ffffff","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#d4d4d0","strokeWidth":1},
  {"type":"text","id":"ph","x":130,"y":355,"text":"How can I help you today?","fontSize":18,"strokeColor":"#b0b0b0"},
  {"type":"rectangle","id":"plus","x":125,"y":408,"width":32,"height":32,"roundness":{"type":3},"strokeColor":"#b0b0b0","strokeWidth":1,"label":{"text":"+","fontSize":18}},
  {"type":"text","id":"mdl","x":510,"y":416,"text":"Opus 4.6","fontSize":14,"strokeColor":"#b0b0b0"},
  {"type":"ellipse","id":"sendb","x":596,"y":410,"width":28,"height":28,"backgroundColor":"#c4795b","fillStyle":"solid","strokeColor":"#c4795b","strokeWidth":1},
  {"type":"text","id":"plushl","x":131,"y":406,"text":"+","fontSize":30,"strokeColor":"#4a9eed"},
  {"type":"rectangle","id":"dd","x":115,"y":448,"width":250,"height":92,"backgroundColor":"#ffffff","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#d4d4d0","strokeWidth":1},
  {"type":"text","id":"dd1","x":130,"y":455,"text":"@ Add files and photos","fontSize":16,"strokeColor":"#555555"},
  {"type":"text","id":"dd2","x":130,"y":480,"text":"~ Research","fontSize":16,"strokeColor":"#555555"},
  {"type":"rectangle","id":"dd3h","x":119,"y":502,"width":242,"height":28,"backgroundColor":"#f5f0e8","fillStyle":"solid","roundness":{"type":3},"strokeColor":"transparent"},
  {"type":"text","id":"dd3","x":130,"y":506,"text":"# Manage connectors","fontSize":16,"strokeColor":"#1e1e1e"},
  {"type":"rectangle","id":"dd3a","x":119,"y":502,"width":242,"height":28,"backgroundColor":"#c4795b","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#c4795b","opacity":15},
  {"type":"arrow","id":"crv","x":365,"y":515,"width":460,"height":-180,"points":[[0,0],[180,-60],[460,-180]],"strokeColor":"#c4795b","strokeWidth":2,"strokeStyle":"dashed","endArrowhead":"arrow","startArrowhead":null},
  {"type":"rectangle","id":"sw","x":820,"y":40,"width":680,"height":500,"backgroundColor":"#fafaf7","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#d4d4d0","strokeWidth":1},
  {"type":"rectangle","id":"stb","x":820,"y":40,"width":680,"height":38,"backgroundColor":"#ededed","fillStyle":"solid","strokeColor":"#d4d4d0","strokeWidth":1},
  {"type":"ellipse","id":"dr2","x":842,"y":50,"width":12,"height":12,"backgroundColor":"#ff5f57","fillStyle":"solid","strokeColor":"#ff5f57","strokeWidth":1},
  {"type":"ellipse","id":"dy2","x":860,"y":50,"width":12,"height":12,"backgroundColor":"#febc2e","fillStyle":"solid","strokeColor":"#febc2e","strokeWidth":1},
  {"type":"ellipse","id":"dg2","x":878,"y":50,"width":12,"height":12,"backgroundColor":"#28c840","fillStyle":"solid","strokeColor":"#28c840","strokeWidth":1},
  {"type":"text","id":"sttl","x":845,"y":92,"text":"Settings","fontSize":28,"strokeColor":"#1e1e1e"},
  {"type":"text","id":"sb1","x":845,"y":138,"text":"General","fontSize":16,"strokeColor":"#555555"},
  {"type":"text","id":"sb2","x":845,"y":163,"text":"Account","fontSize":16,"strokeColor":"#555555"},
  {"type":"text","id":"sb3","x":845,"y":188,"text":"Usage","fontSize":16,"strokeColor":"#555555"},
  {"type":"text","id":"sb4","x":845,"y":213,"text":"Capabilities","fontSize":16,"strokeColor":"#555555"},
  {"type":"rectangle","id":"sbhi","x":840,"y":237,"width":130,"height":28,"backgroundColor":"#f5f0e8","fillStyle":"solid","roundness":{"type":3},"strokeColor":"transparent"},
  {"type":"text","id":"sb5","x":845,"y":239,"text":"Connectors","fontSize":16,"strokeColor":"#c4795b"},
  {"type":"text","id":"sb6","x":845,"y":272,"text":"Claude Code","fontSize":16,"strokeColor":"#555555"},
  {"type":"arrow","id":"div","x":975,"y":92,"width":0,"height":425,"points":[[0,0],[0,425]],"strokeColor":"#e8e8e8","strokeWidth":1,"endArrowhead":null,"startArrowhead":null},
  {"type":"text","id":"cnh","x":1000,"y":92,"text":"Connectors","fontSize":24,"strokeColor":"#1e1e1e"},
  {"type":"text","id":"cns","x":1000,"y":120,"text":"Allow Claude to reference apps and services.","fontSize":14,"strokeColor":"#b0b0b0"},
  {"type":"rectangle","id":"bcb","x":1330,"y":92,"width":150,"height":32,"roundness":{"type":3},"strokeColor":"#d4d4d0","strokeWidth":1,"label":{"text":"Browse connectors","fontSize":14}},
  {"type":"ellipse","id":"ci1","x":1005,"y":157,"width":28,"height":28,"backgroundColor":"#dbe4ff","fillStyle":"solid","strokeColor":"#d4d4d0","strokeWidth":1},
  {"type":"text","id":"cn1","x":1045,"y":161,"text":"Figma","fontSize":16,"strokeColor":"#1e1e1e"},
  {"type":"rectangle","id":"cb1","x":1380,"y":157,"width":90,"height":28,"roundness":{"type":3},"strokeColor":"#d4d4d0","strokeWidth":1,"label":{"text":"Connect","fontSize":14}},
  {"type":"ellipse","id":"ci2","x":1005,"y":198,"width":28,"height":28,"backgroundColor":"#e8e8e8","fillStyle":"solid","strokeColor":"#d4d4d0","strokeWidth":1},
  {"type":"text","id":"cn2","x":1045,"y":203,"text":"GitHub","fontSize":16,"strokeColor":"#1e1e1e"},
  {"type":"rectangle","id":"cb2","x":1380,"y":198,"width":90,"height":28,"roundness":{"type":3},"strokeColor":"#d4d4d0","strokeWidth":1,"label":{"text":"Connect","fontSize":14}},
  {"type":"ellipse","id":"ci3","x":1005,"y":240,"width":28,"height":28,"backgroundColor":"#d3f9d8","fillStyle":"solid","strokeColor":"#d4d4d0","strokeWidth":1},
  {"type":"text","id":"cn3","x":1045,"y":244,"text":"Slack","fontSize":16,"strokeColor":"#1e1e1e"},
  {"type":"rectangle","id":"cb3","x":1380,"y":240,"width":90,"height":28,"roundness":{"type":3},"strokeColor":"#d4d4d0","strokeWidth":1,"label":{"text":"Connect","fontSize":14}},
  {"type":"arrow","id":"sep","x":1000,"y":282,"width":470,"height":0,"points":[[0,0],[470,0]],"strokeColor":"#e8e8e8","strokeWidth":1,"endArrowhead":null,"startArrowhead":null},
  {"type":"rectangle","id":"acb","x":1000,"y":298,"width":220,"height":36,"backgroundColor":"#f5f0e8","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#c4795b","strokeWidth":1,"label":{"text":"+ Add custom connector","fontSize":14}},
  {"type":"arrow","id":"cur","x":1250,"y":340,"width":-20,"height":-10,"points":[[0,0],[-20,-10]],"strokeColor":"#c4795b","strokeWidth":2,"endArrowhead":"arrow","startArrowhead":null},
  {"type":"rectangle","id":"ov","x":820,"y":78,"width":680,"height":462,"backgroundColor":"#888888","fillStyle":"solid","strokeColor":"transparent","opacity":30},
  {"type":"rectangle","id":"md","x":940,"y":150,"width":420,"height":280,"backgroundColor":"#ffffff","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#d4d4d0","strokeWidth":1},
  {"type":"text","id":"mdt","x":960,"y":168,"text":"Add custom connector","fontSize":22,"strokeColor":"#1e1e1e"},
  {"type":"text","id":"nl","x":960,"y":210,"text":"Name","fontSize":16,"strokeColor":"#555555"},
  {"type":"rectangle","id":"ni","x":960,"y":232,"width":380,"height":34,"backgroundColor":"#ffffff","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#d4d4d0","strokeWidth":1},
  {"type":"text","id":"nv","x":972,"y":238,"text":"Excalidraw","fontSize":18,"strokeColor":"#1e1e1e"},
  {"type":"text","id":"ul","x":960,"y":278,"text":"Server URL","fontSize":16,"strokeColor":"#555555"},
  {"type":"rectangle","id":"urli","x":960,"y":300,"width":380,"height":34,"backgroundColor":"#ffffff","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#d4d4d0","strokeWidth":1},
  {"type":"text","id":"uv","x":968,"y":306,"text":"https://excalidraw-mcp-app.vercel.app/mcp","fontSize":18,"strokeColor":"#1e1e1e"},
  {"type":"text","id":"can","x":1220,"y":388,"text":"Cancel","fontSize":16,"strokeColor":"#999999"},
  {"type":"rectangle","id":"addb","x":1260,"y":380,"width":100,"height":36,"backgroundColor":"#c4795b","fillStyle":"solid","roundness":{"type":3},"strokeColor":"#c4795b","strokeWidth":1},
  {"type":"text","id":"addt","x":1288,"y":388,"text":"Add","fontSize":16,"strokeColor":"#ffffff"},
  {"type":"arrow","id":"aurl","x":920,"y":317,"width":40,"height":0,"points":[[0,0],[40,0]],"strokeColor":"#4a9eed","strokeWidth":2,"endArrowhead":"arrow","startArrowhead":null},
  {"type":"arrow","id":"ptr","x":1400,"y":420,"width":-60,"height":-20,"points":[[0,0],[-60,-20]],"strokeColor":"#4a9eed","strokeWidth":2,"endArrowhead":"arrow","startArrowhead":null},
  {"type":"text","id":"enj","x":1080,"y":455,"text":"Enjoy!","fontSize":36,"strokeColor":"#4a9eed"},
  {"type":"ellipse","id":"st1","x":1070,"y":465,"width":10,"height":10,"backgroundColor":"#f59e0b","fillStyle":"solid","strokeColor":"#f59e0b","strokeWidth":1},
  {"type":"ellipse","id":"st2","x":1195,"y":460,"width":10,"height":10,"backgroundColor":"#22c55e","fillStyle":"solid","strokeColor":"#22c55e","strokeWidth":1},
  {"type":"ellipse","id":"st3","x":1210,"y":475,"width":8,"height":8,"backgroundColor":"#8b5cf6","fillStyle":"solid","strokeColor":"#8b5cf6","strokeWidth":1},
  {"type":"ellipse","id":"st4","x":1060,"y":480,"width":8,"height":8,"backgroundColor":"#ec4899","fillStyle":"solid","strokeColor":"#ec4899","strokeWidth":1}
]
```

## Example 3: Simple Two-Box Flow

Prompt: "Draw two connected boxes"

Minimal example showing shape + label + arrow binding.

```json
[
  {"type":"rectangle","id":"b1","x":100,"y":100,"width":200,"height":100,"roundness":{"type":3},"backgroundColor":"#a5d8ff","fillStyle":"solid","label":{"text":"Start","fontSize":20}},
  {"type":"rectangle","id":"b2","x":450,"y":100,"width":200,"height":100,"roundness":{"type":3},"backgroundColor":"#b2f2bb","fillStyle":"solid","label":{"text":"End","fontSize":20}},
  {"type":"arrow","id":"a1","x":300,"y":150,"width":150,"height":0,"points":[[0,0],[150,0]],"endArrowhead":"arrow","startBinding":{"elementId":"b1","fixedPoint":[1,0.5]},"endBinding":{"elementId":"b2","fixedPoint":[0,0.5]}}
]
```
