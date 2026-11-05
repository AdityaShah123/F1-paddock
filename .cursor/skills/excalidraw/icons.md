# Excalidraw Primitive Icon Recipes

Small icons composed from basic Excalidraw shapes (rectangles, ellipses, lines). They make architecture diagrams more visually distinct without requiring external images.

## Usage Rules

- **Max 5–6 icons per diagram** — icons are decorative, not structural
- **Use the diagram's stroke color** (`strokeColor`) for all icon parts
- **All parts of one icon share a `groupIds` entry** — convention: `ico_{type}_{n}` (e.g., `ico_database_1`)
- **Icons go LAST** in the elements array (highest z-order)
- **Default scale: 40×40** — scale uniformly if needed
- **strokeWidth: 1** for icon parts (thinner than normal shapes)
- **No fills** unless noted — icons are stroke-only outlines

## Placement Patterns

### Inline (inside a labeled shape)

Place the icon to the left of the label text inside the shape. The shape needs `width >= 160` to fit both icon and label. Position the icon at roughly `(shape.x + 12, shape.y + shape.height/2 - 20)`.

### Standalone (icon + label below)

Place the icon, then add a small text element centered below it. Good for legend items or actor nodes.

## Icon Recipes

All positions use a base point `(bx, by)` — substitute any top-left coordinate. Default size 40×40.

---

### database (cylinder — DBs, caches, data stores)

| # | Type | x | y | w | h | Notes |
|---|------|---|---|---|---|-------|
| 1 | rectangle | bx | by+8 | 40 | 28 | body |
| 2 | ellipse | bx | by | 40 | 16 | top cap |
| 3 | ellipse | bx | by+20 | 40 | 16 | bottom cap |

---

### server (server rack — servers, backends, VMs)

| # | Type | x | y | w | h | Notes |
|---|------|---|---|---|---|-------|
| 1 | rectangle | bx | by | 40 | 40 | chassis, roundness `{"type":3}` |
| 2 | line | bx+6, by+14 → bx+34, by+14 | | | | divider 1 — `points: [[0,0],[28,0]]` |
| 3 | line | bx+6, by+26 → bx+34, by+26 | | | | divider 2 — `points: [[0,0],[28,0]]` |

---

### cloud (cloud shape — cloud services, external APIs)

| # | Type | x | y | w | h | Notes |
|---|------|---|---|---|---|-------|
| 1 | ellipse | bx+8 | by+14 | 28 | 20 | base |
| 2 | ellipse | bx | by+8 | 22 | 18 | left bump |
| 3 | ellipse | bx+18 | by | 24 | 20 | top bump |
| 4 | ellipse | bx+22 | by+10 | 18 | 16 | right bump |

All ellipses: `backgroundColor` matching stroke, `fillStyle: "solid"`, same `strokeColor`.

---

### person (stick figure — users, actors)

| # | Type | x | y | w | h | Notes |
|---|------|---|---|---|---|-------|
| 1 | ellipse | bx+12 | by | 16 | 16 | head |
| 2 | ellipse | bx+6 | by+18 | 28 | 22 | torso |

---

### browser (window — web UIs, frontends)

| # | Type | x | y | w | h | Notes |
|---|------|---|---|---|---|-------|
| 1 | rectangle | bx | by | 40 | 36 | frame, roundness `{"type":3}` |
| 2 | line | bx, by+10 → bx+40, by+10 | | | | title bar divider — `points: [[0,0],[40,0]]` |
| 3 | ellipse | bx+4 | by+3 | 5 | 5 | dot 1, `backgroundColor: "#ef4444"`, `fillStyle: "solid"` |
| 4 | ellipse | bx+11 | by+3 | 5 | 5 | dot 2, `backgroundColor: "#f59e0b"`, `fillStyle: "solid"` |
| 5 | ellipse | bx+18 | by+3 | 5 | 5 | dot 3, `backgroundColor: "#22c55e"`, `fillStyle: "solid"` |

---

### folder (folder — file storage, repos)

| # | Type | x | y | w | h | Notes |
|---|------|---|---|---|---|-------|
| 1 | rectangle | bx | by+8 | 40 | 32 | body, roundness `{"type":3}` |
| 2 | rectangle | bx | by | 18 | 12 | tab, roundness `{"type":3}` |

---

### lock (padlock — auth, security, encryption)

| # | Type | x | y | w | h | Notes |
|---|------|---|---|---|---|-------|
| 1 | rectangle | bx+6 | by+18 | 28 | 22 | body, roundness `{"type":3}` |
| 2 | ellipse | bx+10 | by | 20 | 22 | shackle (stroke only, no fill) |

---

### document (doc — files, configs, logs)

| # | Type | x | y | w | h | Notes |
|---|------|---|---|---|---|-------|
| 1 | rectangle | bx | by | 34 | 40 | page |
| 2 | line | bx+6, by+12 → bx+28, by+12 | | | | line 1 — `points: [[0,0],[22,0]]` |
| 3 | line | bx+6, by+20 → bx+28, by+20 | | | | line 2 — `points: [[0,0],[22,0]]` |
| 4 | line | bx+6, by+28 → bx+20, by+28 | | | | line 3 (shorter) — `points: [[0,0],[14,0]]` |

---

### gear (cog — settings, processing, CI/CD)

| # | Type | x | y | w | h | Notes |
|---|------|---|---|---|---|-------|
| 1 | ellipse | bx+10 | by+10 | 20 | 20 | center circle |
| 2 | rectangle | bx+17 | by | 6 | 10 | tooth top |
| 3 | rectangle | bx+17 | by+30 | 6 | 10 | tooth bottom |
| 4 | rectangle | bx | by+17 | 10 | 6 | tooth left |
| 5 | rectangle | bx+30 | by+17 | 10 | 6 | tooth right |

---

### envelope (mail — email, messaging, queues)

| # | Type | x | y | w | h | Notes |
|---|------|---|---|---|---|-------|
| 1 | rectangle | bx | by | 40 | 28 | body |
| 2 | line | bx, by → bx+20, by+14 | | | | flap left — `points: [[0,0],[20,14]]` |
| 3 | line | bx+20, by+14 → bx+40, by | | | | flap right — `points: [[0,0],[20,-14]]` |

---

### magnifier (search — search, monitoring)

| # | Type | x | y | w | h | Notes |
|---|------|---|---|---|---|-------|
| 1 | ellipse | bx | by | 26 | 26 | lens |
| 2 | line | bx+22, by+22 → bx+38, by+38 | | | | handle — `points: [[0,0],[16,16]]`, `strokeWidth: 2` |

---

### lightning (bolt — events, triggers, lambdas)

| # | Type | x | y | w | h | Notes |
|---|------|---|---|---|---|-------|
| 1 | line | zigzag path | | | | `points: [[0,0],[14,-18],[6,-8],[20,-40]]`, `strokeWidth: 2` |

Position at `(bx+10, by+40)` so the bolt draws upward. Adjust points to taste.
