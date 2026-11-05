#!/usr/bin/env npx tsx
/**
 * Converts skeleton Excalidraw JSON (with `label` shorthand) into a valid .excalidraw file.
 *
 * Usage:
 *   npx tsx scripts/excalidraw-convert.ts <input.json> [output.excalidraw]
 *
 * The input file should contain a JSON array of skeleton elements (the same format
 * the cheat sheet teaches). The script:
 *   1. Converts `label` shorthand on shapes/arrows into separate bound text elements
 *   2. Wraps everything in a standard .excalidraw envelope
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, basename, dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SkeletonElement {
  type: string;
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: {
    text: string;
    fontSize?: number;
    textAlign?: string;
    verticalAlign?: string;
  };
  [key: string]: any;
}

interface ExcalidrawElement {
  type: string;
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  groupIds: string[];
  boundElements: { id: string; type: string }[] | null;
  updated: number;
  link: string | null;
  locked: boolean;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomSeed(): number {
  return Math.floor(Math.random() * 2_000_000_000);
}

function randomNonce(): number {
  return Math.floor(Math.random() * 2_000_000_000);
}

const BASE_DEFAULTS = {
  strokeColor: "#1e1e1e",
  backgroundColor: "transparent",
  fillStyle: "solid",
  strokeWidth: 2,
  strokeStyle: "solid",
  roughness: 1,
  opacity: 100,
  angle: 0,
  seed: 0, // will be overridden
  version: 1,
  versionNonce: 0, // will be overridden
  isDeleted: false,
  groupIds: [] as string[],
  boundElements: null as { id: string; type: string }[] | null,
  updated: Date.now(),
  link: null as string | null,
  locked: false,
};

/** Estimate text width. Rough heuristic — Excalidraw's Virgil font averages ~0.55 × fontSize per char. */
function estimateTextWidth(text: string, fontSize: number): number {
  const lines = text.split("\n");
  const maxLineLen = Math.max(...lines.map((l) => l.length));
  return Math.ceil(maxLineLen * fontSize * 0.55);
}

function estimateTextHeight(text: string, fontSize: number): number {
  const lineCount = text.split("\n").length;
  return Math.ceil(lineCount * fontSize * 1.35);
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

function convert(skeletonElements: SkeletonElement[]): ExcalidrawElement[] {
  const result: ExcalidrawElement[] = [];

  for (const raw of skeletonElements) {
    const el = { ...raw };
    const label = el.label;
    delete el.label;

    // Build the base element with defaults
    const element: ExcalidrawElement = {
      ...BASE_DEFAULTS,
      ...el,
      width: el.width ?? 0,
      height: el.height ?? 0,
      seed: randomSeed(),
      versionNonce: randomNonce(),
      roundness: el.roundness ?? (
        ["rectangle", "diamond", "ellipse"].includes(el.type) ? { type: 3 } : null
      ),
    };

    // Arrow-specific defaults
    if (el.type === "arrow" || el.type === "line") {
      element.points = el.points ?? [[0, 0], [el.width ?? 100, el.height ?? 0]];
      if (el.type === "arrow") {
        element.startArrowhead = el.startArrowhead ?? null;
        element.endArrowhead = el.endArrowhead ?? "arrow";
      }
      if (el.startBinding) element.startBinding = el.startBinding;
      if (el.endBinding) element.endBinding = el.endBinding;
    }

    // Text-specific defaults
    if (el.type === "text") {
      element.fontFamily = el.fontFamily ?? 1; // Virgil
      element.fontSize = el.fontSize ?? 20;
      element.textAlign = el.textAlign ?? "left";
      element.verticalAlign = el.verticalAlign ?? "top";
      element.text = el.text ?? "";
      element.originalText = el.text ?? "";
      element.autoResize = true;
      element.lineHeight = el.lineHeight ?? 1.25;
      // Estimate dimensions if not provided
      if (!el.width) element.width = estimateTextWidth(element.text, element.fontSize);
      if (!el.height) element.height = estimateTextHeight(element.text, element.fontSize);
    }

    // Handle label → separate bound text element
    if (label && label.text) {
      const textId = `${el.id}_label`;
      const fontSize = label.fontSize ?? 20;
      const textWidth = estimateTextWidth(label.text, fontSize);
      const textHeight = estimateTextHeight(label.text, fontSize);

      // Center text inside the container
      const containerW = element.width;
      const containerH = element.height;
      const textX = element.x + (containerW - textWidth) / 2;
      const textY = element.y + (containerH - textHeight) / 2;

      // Add binding to the container
      element.boundElements = [
        ...(element.boundElements ?? []),
        { id: textId, type: "text" },
      ];

      result.push(element);

      // Create the bound text element
      const textEl: ExcalidrawElement = {
        ...BASE_DEFAULTS,
        type: "text",
        id: textId,
        x: textX,
        y: textY,
        width: textWidth,
        height: textHeight,
        seed: randomSeed(),
        versionNonce: randomNonce(),
        text: label.text,
        originalText: label.text,
        fontSize,
        fontFamily: 1,
        textAlign: label.textAlign ?? "center",
        verticalAlign: label.verticalAlign ?? "middle",
        containerId: el.id,
        autoResize: true,
        lineHeight: 1.25,
        roundness: null,
      };

      result.push(textEl);
    } else {
      result.push(element);
    }
  }

  // Second pass: add arrow → shape bindings to shapes' boundElements
  for (const el of result) {
    if (el.type !== "arrow") continue;
    for (const bindingKey of ["startBinding", "endBinding"] as const) {
      const binding = el[bindingKey];
      if (!binding?.elementId) continue;
      const target = result.find((e) => e.id === binding.elementId);
      if (!target) continue;
      if (!target.boundElements) target.boundElements = [];
      if (!target.boundElements.some((b: any) => b.id === el.id)) {
        target.boundElements.push({ id: el.id, type: "arrow" });
      }
    }
  }

  return result;
}

function wrapInEnvelope(elements: ExcalidrawElement[]): object {
  return {
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements,
    appState: {
      gridSize: null,
      viewBackgroundColor: "#ffffff",
    },
    files: {},
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: npx tsx scripts/excalidraw-convert.ts <input.json> [output.excalidraw]");
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const outputPath = args[1]
    ? resolve(args[1])
    : join(dirname(inputPath), basename(inputPath, ".json") + ".excalidraw");

  const inputJson = readFileSync(inputPath, "utf-8");
  let skeletonElements: SkeletonElement[];

  try {
    const parsed = JSON.parse(inputJson);
    skeletonElements = Array.isArray(parsed) ? parsed : parsed.elements ?? [];
  } catch (e) {
    console.error(`Failed to parse ${inputPath}: ${(e as Error).message}`);
    process.exit(1);
  }

  const elements = convert(skeletonElements);
  const envelope = wrapInEnvelope(elements);

  writeFileSync(outputPath, JSON.stringify(envelope, null, 2), "utf-8");
  console.log(outputPath);
}

main();
