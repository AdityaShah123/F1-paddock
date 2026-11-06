# Excalidraw Skill for Claude Code

A [Claude Code skill](https://docs.anthropic.com/en/docs/claude-code/skills) that generates hand-drawn Excalidraw diagrams as `.excalidraw` files.

## Install

```bash
npx skills add alexanderop/excalidraw-skill
```

## Usage

Invoke via slash command:

```
/excalidraw a flowchart showing user authentication
```

Or just ask naturally — the skill triggers on requests to create diagrams, flowcharts, architecture sketches, wireframes, or visual explanations.

## What it does

1. Reads a customizable color theme (`colors.md`)
2. Spawns a subagent with the full Excalidraw element format reference
3. The subagent generates valid `.excalidraw` JSON and writes the file
4. Open the output at [excalidraw.com](https://excalidraw.com) or in VS Code with the [Excalidraw extension](https://marketplace.visualstudio.com/items?itemName=pomdtr.excalidraw-editor)

## How the converter works

Excalidraw's native JSON format is verbose and has some non-obvious requirements — particularly around **labels inside shapes**. To put the text "Web App" inside a rectangle, Excalidraw needs **two separate elements** with bidirectional references:

- The **rectangle** needs a `boundElements` array pointing to the text element
- A **separate text element** needs a `containerId` pointing back to the rectangle, plus precisely computed `x`/`y` coordinates to center it

This is tedious and error-prone for an AI to produce directly. So the skill uses a two-step process: the subagent writes a simplified **skeleton format**, and a converter script expands it into valid Excalidraw JSON.

### Skeleton format

The skeleton is a minimal JSON array where shapes can have a `label` shorthand:

```json
{
  "type": "rectangle",
  "id": "webapp",
  "x": 350, "y": 170, "width": 200, "height": 70,
  "label": { "text": "Web App", "fontSize": 20 }
}
```

One element, only the fields that matter. The `label` property is **not valid Excalidraw JSON** — it only exists in the skeleton format.

### What the converter does

The script at `scripts/excalidraw-convert.ts` transforms skeleton into real Excalidraw JSON:

| Step | Skeleton (input) | Excalidraw (output) |
|------|-------------------|---------------------|
| **Label expansion** | 1 rectangle with `label` | 2 elements: rectangle with `boundElements` + text with `containerId`, centered coordinates computed automatically |
| **Default filling** | Only non-default fields | All ~15 required fields filled in (`seed`, `versionNonce`, `isDeleted`, `groupIds`, etc.) |
| **Arrow binding** | Arrow has `startBinding`/`endBinding` | Target shapes also get reverse `boundElements` entries pointing back to the arrow |
| **Envelope wrapping** | Bare JSON array | Wrapped in the standard `.excalidraw` envelope with `type`, `version`, `appState`, `files` |

### Running the converter manually

```bash
npx tsx scripts/excalidraw-convert.ts input.skeleton.json output.excalidraw
```

If the output path is omitted, it replaces `.json` with `.excalidraw` automatically.

## Customization

Edit `colors.md` to change the color palette used for all generated diagrams.

## License

MIT
