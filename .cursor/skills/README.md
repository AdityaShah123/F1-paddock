# Design skills library

208 vendored agent skills covering visual direction, design process, Figma and token workflows, browser-driven visual QA, accessibility auditing and diagramming. Every agent working in this repo can use them — Cursor reads `.cursor/skills/` automatically and surfaces each skill to the model by its `description`, loading the body only when a task matches.

## Layout

```
.cursor/skills/
├── README.md          # this index
├── NOTICE.md          # upstream attribution, per source
├── LICENSES/          # upstream license texts for sources that ship one repo-wide
└── <skill-name>/
    ├── SKILL.md       # frontmatter normalized here; body is the author's
    └── ...            # references/, scripts/, themes/, LICENSE.txt as shipped upstream
```

Skills are vendored, not submoduled. To pull an upstream update, re-copy that skill's folder and re-apply the frontmatter convention below.

## What was changed from upstream

Skill bodies are what their authors wrote. The only body edit anywhere is in the five AccessLint skills, whose shared `methodology.md` sits one directory above them upstream: that file is copied into each skill folder and the link repointed from `../shared/` to `shared/`. Everything else is frontmatter, normalized to `name`, `description`, `license` and `source`:

- **Descriptions** were rewritten where they only said *what* a skill is and not *when* to reach for it. The description is all an agent sees before deciding to open a skill, so each one now names the job and the trigger.
- **Keys that name a tool Cursor does not have** were dropped: `allowed-tools` (Claude Code tool allowlists, including `mcp__*` tool names), `argument-hint` (slash-command hints), `disable-model-invocation`, and Composio's `requires: {mcp: [rube]}`. Where those keys encoded a real dependency, it moved into the **Needs** column below instead of disappearing.
- **Names** were changed for four skills that would otherwise have collided. Each one says so in its own description, and the tables below show the upstream name in parentheses.

## Needs setup before it works

13 of 208 skills cannot run in Cursor as configured today — they drive an MCP server or a tool that is not wired up here. They are installed anyway so the guidance is readable and they start working the moment the dependency exists. These are shown in **bold** in the **Needs** column.

| Skill | Blocked on | Why |
| --- | --- | --- |
| `accessibility-fix` | AccessLint MCP server (`@accesslint/mcp`) | Remediation relies on `mcp__...__audit_html` / `audit_live` to verify each fix. |
| `accessibility-inspect` | chrome-devtools MCP server; AccessLint MCP optional for rule metadata | Drives the page through `mcp__chrome-devtools__*` tools. Without a chrome-devtools MCP server configured there is no way to press keys or read the accessibility tree. |
| `figma` | Figma MCP server | Umbrella router for Figma MCP work; points at the right specialist skill and covers MCP setup and troubleshooting. Companion to `figma-implement-design`; installed so its cross-references resolve. |
| `figma-automation` | Rube MCP (Composio) + a connected Figma account | Depends entirely on Rube MCP tool slugs (`FIGMA_*`, `RUBE_SEARCH_TOOLS`). Vendored from the last upstream commit that contained it, before the repo reorganisation dropped the folder. |
| `figma-code-connect-components` | Figma MCP server | Map Figma components to their code counterparts with Code Connect. Companion to `figma-implement-design`; installed so its cross-references resolve. |
| `figma-create-design-system-rules` | Figma MCP server | Generate project-specific design-system rules for Figma-to-code work. Companion to `figma-implement-design`; installed so its cross-references resolve. |
| `figma-create-new-file` | Figma MCP server | Create a new blank Figma or FigJam file. Companion to `figma-implement-design`; installed so its cross-references resolve. |
| `figma-design-to-code` | Figma MCP server (`https://mcp.figma.com/mcp`) + a Figma Dev/Full seat | Instruction-only wrapper around the Figma MCP tools. Without the Figma MCP server connected there is nothing for it to drive. |
| `figma-generate-design` | Figma MCP server | Build or update a full page, screen or view *inside* Figma from code or a description, assembled from design-system components. Companion to `figma-implement-design`; installed so its cross-references resolve. |
| `figma-generate-library` | Figma MCP server | Build a design system in Figma from a codebase — variables, components, theming and foundations. Companion to `figma-implement-design`; installed so its cross-references resolve. |
| `figma-implement-design` | Figma MCP server | Longer, more prescriptive companion to `figma-design-to-code`. Same MCP dependency. |
| `figma-use` | Figma MCP server | Mandatory preamble before any `use_figma` canvas write — creating or editing nodes, variables, components or auto-layout from code. Companion to `figma-implement-design`; installed so its cross-references resolve. |
| `playwright-interactive` | A persistent JS REPL (`js_repl`) — not available in Cursor | The whole workflow assumes Codex's `js_repl` tool. The session-reuse technique still reads well as guidance, but it cannot be executed as written in Cursor. |

A further 6 skills work once a CLI or runtime is present (Playwright, `@accesslint/cli`, `uv`); those are listed without bold in their group table.

## Aesthetic baseline

Visual direction and taste. Load one of these *before* writing UI so the result has a deliberate look instead of the default template aesthetic. `frontend-design` is the general guardrail; the named style skills below each pin a complete system — type scale, palette, spacing, component rules, accessibility constraints and quality gates — for one visual direction.

### Guardrails

| Skill | What it's for | Source | Needs |
| --- | --- | --- | --- |
| `design-flow-frontend-design` | Build production-grade frontend code against one of eight named aesthetic philosophies, mobile-first and with dark mode included. | [julianoczkowski/designer-skills](https://github.com/julianoczkowski/designer-skills/tree/main/frontend-design) (`frontend-design`) | — |
| `frontend-design` | Baseline aesthetic guardrail for any new or reworked UI: pushes toward a deliberate visual direction, real typographic choices and restrained motion, and names the specific tells that… | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | — |

### Named visual directions (67)

All from the same registry, all MIT, none need setup. Each folder also keeps the upstream `DESIGN.md`, the human-readable companion explaining the rationale behind the system.

| Skill | What it's for | Source | Needs |
| --- | --- | --- | --- |
| `agentic` | Conversational AI-first interface with minimal controls, clear outcomes, and delegated task flows for agentic workflows. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/agentic) | — |
| `ant` | Structured, enterprise-focused design system emphasizing clarity, consistency, and efficiency for data-dense web applications. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/ant) | — |
| `artistic` | High-contrast, expressive style with creative typography and bold color choices for visually striking interfaces. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/artistic) | — |
| `basic` | Print-inspired visual language for books, magazines, and reports with editorial grids and expressive typography. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/basic) | — |
| `bento` | Modular grid layout with card-like blocks, clear hierarchy, soft spacing, and subtle visual contrast for organized, scannable interfaces. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/bento) | — |
| `bold` | Strong visual presence with heavyweight typography, high-contrast colors, and commanding layouts. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/bold) | — |
| `brutalism` | Raw, anti-design aesthetic inspired by concrete architecture with unadorned elements, jarring layouts, and functional minimalism. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/brutalism) | — |
| `cafe` | Cozy cafe-inspired interface with warm tones, soft typography, and clean layouts for a relaxed browsing experience. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/cafe) | — |
| `claude` | A research-journal aesthetic printed on warm stone — authoritative, editorial, almost achromatic. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/claude) | — |
| `claymorphism` | Soft, rounded 3D-like shapes mimicking malleable clay with playful, puffy elements and colorful surfaces. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/claymorphism) | — |
| `clean` | Simplicity-focused design with ample whitespace, legible typography, and a limited color palette to reduce visual clutter. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/clean) | — |
| `codex` | A radically minimal, blank-canvas interface built as a pure edge-to-edge surface, with almost no color and typography carrying the visual weight. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/codex) | — |
| `colorful` | Vibrant, high-contrast palettes and gradients for engaging, memorable, and modern user experiences. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/colorful) | — |
| `contemporary` | Current-era minimalist design with bento grids, dark mode support, and high-performance accessible layouts. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/contemporary) | — |
| `corporate` | Professional, brand-aligned design with structured grids, minimalist layouts, and consistent enterprise patterns. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/corporate) | — |
| `cosmic` | Futuristic sci-fi aesthetic with dark themes, vibrant neon accents, and immersive spatial elements. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/cosmic) | — |
| `creative` | Playful, character-driven design with expressive typography and bold graphics for landing pages and creative projects. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/creative) | — |
| `dithered` | Dot-pattern rendering technique that simulates shades with a limited palette for nostalgic, retro, high-contrast visuals. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/dithered) | — |
| `doodle` | Hand-drawn, sketch-like style with doodles, handwritten fonts, and imperfect lines for a playful, informal feel. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/doodle) | — |
| `dramatic` | High-contrast, theatrical design with bold layouts, immersive visuals, and unconventional compositions that command attention. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/dramatic) | — |
| `editorial` | Magazine-inspired editorial layout with refined serif typography, structured grids, and elegant reading experiences. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/editorial) | — |
| `enterprise` | Dark-themed cloud-platform aesthetic with modular grids, glass-like panels, and strong data hierarchy for productivity dashboards. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/enterprise) | — |
| `expressive` | Vibrant, personality-driven design with bold colors, playful graphics, and dynamic layouts that balance creativity with structure. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/expressive) | — |
| `fantasy` | Game-inspired fantasy aesthetic with bold, premium visuals, rich color palettes, and immersive thematic elements. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/fantasy) | — |
| `fiction` | A playful, energetic, cartoonesque interface inspired by friendly children's-book illustrations — warm cream backgrounds, big bold custom display typography, saturated brand color… | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/fiction) | — |
| `flat` | Two-dimensional minimalist style with vibrant colors, clean typography, and no 3D effects for fast, user-friendly interfaces. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/flat) | — |
| `friendly` | Approachable, intuitive design with rounded elements, ample whitespace, and soft pastel color palettes. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/friendly) | — |
| `futuristic` | Forward-looking design with tech-inspired typography, modern layouts, and a sleek, innovation-driven aesthetic. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/futuristic) | — |
| `geometric` | Geometric, structured design with clean typography, neutral colors, precise shapes, and intuitive layouts that stay out of the way. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/geometric) | — |
| `glassmorphism` | Frosted glass effect with translucent layers, subtle blur, and luminous borders for depth and modern elegance. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/glassmorphism) | — |
| `gradient` | Smooth color transitions and gradient-rich surfaces for modern, playful interfaces with visual depth. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/gradient) | — |
| `immersive` | An immersive, interactive, exhibit-style interface that blends storytelling, animation, and gamified elements to create a playful, experience-driven journey. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/immersive) | — |
| `impeccable` | A modern, graphic, editorial-poster aesthetic — warm and confident — built on alternating cream and burnt orange sections, an amber brand color. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/impeccable) | — |
| `levels` | Conversion-focused design that removes friction and guides users toward action through clarity, trust, and speed. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/levels) | — |
| `lingo` | Playful, minimal design with bright colors, rounded shapes, tactile 3D borders, and friendly illustrations for approachable interfaces. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/lingo) | — |
| `material` | Google's Material Design with layered surfaces, dynamic theming, built-in motion, and responsive cross-platform patterns. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/material) | — |
| `matrix` | A cyber-slick, dark-only Matrix-inspired interface defined by minimalist fashion, high-tech digital elements. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/matrix) | — |
| `minimal` | Stripped-back design emphasizing whitespace, clean typography, and restrained color for maximum clarity and focus. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/minimal) | — |
| `modern` | Contemporary editorial style with serif typography, minimal palettes, and clean layouts for polished digital products. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/modern) | — |
| `mono` | Monospace-driven, matrix-inspired design with high-contrast elements, compact density, and a hacker-chic aesthetic. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/mono) | — |
| `neobrutalism` | Modern take on brutalism with bold borders, vivid accent colors, and raw, high-contrast layouts on warm surfaces. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/neobrutalism) | — |
| `neon` | Electric neon glow effects with high-contrast color pairings for bold, attention-grabbing interfaces. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/neon) | — |
| `neumorphism` | Soft, extruded UI elements with inner and outer shadows on monochromatic surfaces for a tactile, embedded look. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/neumorphism) | — |
| `pacman` | Retro arcade-inspired design with pixel fonts, dotted borders, playful high-contrast colors, and 8-bit game aesthetics. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/pacman) | — |
| `paper` | Paper-textured, print-inspired design with minimal colors, clean serif/sans typography, and tactile surface qualities. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/paper) | — |
| `perspective` | Spatial depth design with isometric views, vanishing points, and layered elements that guide attention through 3D-like realism. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/perspective) | — |
| `power` | High-end dark aesthetic with bold headings, monochromatic palette, and premium feel for premium brand experiences. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/power) | — |
| `premium` | Apple-inspired premium aesthetic with precise spacing, modern typography, and a refined, polished visual language. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/premium) | — |
| `professional` | Polished, business-ready design with modern typography, structured layouts, and a trustworthy visual identity. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/professional) | — |
| `pulse` | Dynamic, vibrant style with thick borders, geometric shapes, high-contrast colors, and expressive typography conveying motion and vitality. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/pulse) | — |
| `refined` | Carefully curated, modern minimal style with elegant serif typography and understated, sophisticated palettes. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/refined) | — |
| `retro` | Throwback design with vintage-inspired typography, high-contrast retro palettes, and nostalgic visual elements. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/retro) | — |
| `riso` | A playful, joyful, two-color risograph print aesthetic built on a single warm off-white paper surface running through every section. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/riso) | — |
| `roku` | App dashboard with purple-themed aesthetic, top-bar navigation, card-based layouts, and developer-first workflows. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/roku) | — |
| `sega` | A playful, arcade-inspired interface for games — built on the VT323 pixel typeface, hard-edged 0px corners, chunky pill buttons that physically press into solid offset blocks. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/sega) | — |
| `shadcn` | Shadcn/ui-inspired design with minimal, clean components, monochrome palette, and utility-first patterns. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/shadcn) | — |
| `sketch` | A friendly, hand-drawn sketch interface inspired by pencil illustrations on warm cream paper. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/sketch) | — |
| `skeumorphism` | Real-world mimicry with textured surfaces, 3D effects, and familiar physical metaphors for intuitive digital interfaces. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/skeumorphism) | — |
| `sleek` | Modern minimalist aesthetic with clean lines, intentional color palette, subtle interactions, and consistent spacing. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/sleek) | — |
| `spacious` | Generous whitespace, consistent padding, and grid-based layouts for clean, readable, and breathing interfaces. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/spacious) | — |
| `square` | Graceful, refined aesthetic with delicate typography, minimal palettes, and polished layouts that exude sophistication. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/square) | — |
| `stitch` | Clean, high-contrast enterprise design for data-driven workflows with intuitive drag-and-drop patterns and structured layouts. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/stitch) | — |
| `storytelling` | Narrative-driven design using visuals, copy, and interaction to guide users through engaging, emotionally resonant journeys. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/storytelling) | — |
| `terracotta` | A sun-baked, clay-toned editorial interface built on warm cream surfaces, ink-brown headlines set in a display serif, and a single terracotta accent. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/terracotta) | — |
| `tetris` | Classic block-game inspired design with playful colors, bold display fonts, and compact, high-energy layouts. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/tetris) | — |
| `vibrant` | Lively, colorful design with bold playful typography, warm accents, and dynamic visual energy. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/vibrant) | — |
| `vintage` | 1950s-1990s nostalgia with skeuomorphic touches, grainy textures, retro color palettes, and pixel-style typography. | [awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/main/skills/vintage) | — |

## Design process

Deciding *what* to build, and writing it down before and after the build: discovery, research, information architecture, critique, handoff specs, QA and design ops. These are pure guidance — none of them need tooling.

### Spec-first design flow (7)

A sequenced pack: `design-flow` orchestrates the rest in order — grill the idea, write the brief, define the IA, generate tokens, break it into tasks, build, review. Each also runs standalone. Note that `design-flow`'s body refers to two of its steps by their upstream names (`design-brief`, `information-architecture`); they are installed here under `design-flow-` prefixes to avoid colliding with the designer-skills set.

| Skill | What it's for | Source | Needs |
| --- | --- | --- | --- |
| `brief-to-tasks` | Break a design brief into an ordered checklist of independently buildable tasks using vertical slices. | [julianoczkowski/designer-skills](https://github.com/julianoczkowski/designer-skills/tree/main/brief-to-tasks) | — |
| `design-flow` | Run the full design-to-build workflow as a guided sequence. | [julianoczkowski/designer-skills](https://github.com/julianoczkowski/designer-skills/tree/main/design-flow) | — |
| `design-flow-brief` | Turn a grilling session into a structured design brief, including codebase exploration so the brief respects what already exists, and save it as markdown in the project. | [julianoczkowski/designer-skills](https://github.com/julianoczkowski/designer-skills/tree/main/design-brief) (`design-brief`) | — |
| `design-flow-information-architecture` | Define the structural layer of a product before visual design starts: navigation, content hierarchy, page structure, URL patterns and user flows. | [julianoczkowski/designer-skills](https://github.com/julianoczkowski/designer-skills/tree/main/information-architecture) (`information-architecture`) | — |
| `design-review` | Run a structured design critique against the brief and codebase. | [julianoczkowski/designer-skills](https://github.com/julianoczkowski/designer-skills/tree/main/design-review) | — |
| `design-tokens` | Generate a design tokens file (CSS variables or Tailwind config) based on a chosen aesthetic philosophy, with light and dark mode palettes, spacing scale, type ramp, and component-level… | [julianoczkowski/designer-skills](https://github.com/julianoczkowski/designer-skills/tree/main/design-tokens) | — |
| `grill-me` | Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. | [julianoczkowski/designer-skills](https://github.com/julianoczkowski/designer-skills/tree/main/grill-me) | — |

### Designer skills collection (111)

The full design process as discrete, cross-referencing skills: research, UX strategy, information architecture, UI design, interaction design, design systems, prototyping and testing, visual critique, and design ops (including `handoff-spec` and `design-qa-checklist`). None need setup.

| Skill | What it's for | Source | Needs |
| --- | --- | --- | --- |
| `a-b-test-design` | Design an A/B experiment — hypothesis, variants, primary metric, and sample size. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/prototyping-testing/skills/a-b-test-design) | — |
| `accessibility-test-plan` | Plan accessibility testing — assistive technologies, participant criteria, WCAG coverage, and session protocol. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/prototyping-testing/skills/accessibility-test-plan) | — |
| `aesthetic-usability` | Apply the Aesthetic-Usability Effect — polished, consistent interfaces are perceived as more usable and forgive minor friction. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/aesthetic-usability) | — |
| `affinity-diagram` | Cluster many qualitative data points into themes and insight statements. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/affinity-diagram) | — |
| `animation-principles` | Apply animation principles — easing, staging, follow-through — to one specific UI motion. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/animation-principles) | — |
| `behavioural-analytics` | Read funnels, retention curves, and event data as a designer — separating a design problem from a tracking artefact. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/behavioural-analytics) | — |
| `business-design` | Read financials, map competitive landscapes, and argue design decisions in the language of value. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ux-strategy/skills/business-design) | — |
| `card-sort-analysis` | Analyse open or closed card sort results into a proposed grouping and label set. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/card-sort-analysis) | — |
| `case-study` | Craft a portfolio case study with narrative arc, process evidence, and outcomes. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/designer-toolkit/skills/case-study) | — |
| `click-test-plan` | Design first-click and click tests for findability and navigation. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/prototyping-testing/skills/click-test-plan) | — |
| `color-system` | Build a product colour system — tonal scales, semantic roles, and contrast compliance. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/color-system) | — |
| `competitive-analysis` | Compare UX patterns, features, strengths, and gaps across rival products. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ux-strategy/skills/competitive-analysis) | — |
| `component-spec` | Specify one component — props, states, variants, accessibility, and usage rules. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-systems/skills/component-spec) | — |
| `concept-selection` | Choose between competing concepts against criteria fixed in advance, and record what each rejected concept was testing. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/prototyping-testing/skills/concept-selection) | — |
| `content-strategy` | Define what content a product needs, how it is structured, and who owns it. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ux-strategy/skills/content-strategy) | — |
| `conversational-ux` | Design voice and conversational interfaces — dialog flows, error recovery, and persona. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/conversational-ux) | — |
| `critique-affordance` | Critique a rendered screen's affordances — what looks clickable, state visibility, CTA clarity, and action discoverability. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/visual-critique/skills/critique-affordance) | — |
| `critique-brand-consistency` | Critique a rendered screen against mood.md, voice.md, and tokens.md. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/visual-critique/skills/critique-brand-consistency) | — |
| `critique-color` | Critique a rendered screen's colour — contrast ratios, palette coherence, and semantic meaning. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/visual-critique/skills/critique-color) | — |
| `critique-composition` | Critique a rendered screen's composition — balance, whitespace, rhythm, and gestalt grouping. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/visual-critique/skills/critique-composition) | — |
| `critique-information-density` | Critique a rendered screen's density — cognitive load, content prioritisation, scanning patterns, and progressive disclosure. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/visual-critique/skills/critique-information-density) | — |
| `critique-typography` | Critique a rendered screen's typography — scale usage, readability, consistency, and token compliance. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/visual-critique/skills/critique-typography) | — |
| `critique-visual-hierarchy` | Critique a rendered screen's hierarchy — entry point, eye flow, weight distribution, and emphasis. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/visual-critique/skills/critique-visual-hierarchy) | — |
| `dark-mode-design` | Adapt an existing palette to dark mode — surface elevation, contrast rebalancing, and desaturation rules. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/dark-mode-design) | — |
| `data-visualization` | Select chart types and design data encodings — marks, axes, labels, and accessible chart styling. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/data-visualization) | — |
| `design-accessibility-audit` | Audit a design or interface against WCAG 2.2 from a designer's perspective — colour contrast, focus order, target size, motion and content structure — before it reaches engineering. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-systems/skills/accessibility-audit) (`accessibility-audit`) | — |
| `design-brief` | Write a project brief — problem space, constraints, audience, and success criteria. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ux-strategy/skills/design-brief) | — |
| `design-critique` | Facilitate a structured team critique — framing, feedback rules, and actionable outcomes. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-ops/skills/design-critique) | — |
| `design-debt-audit` | Inventory and prioritise accumulated design inconsistencies across a product. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-ops/skills/design-debt-audit) | — |
| `design-impact-reporting` | Communicate design's contribution to business and user outcomes in stakeholder language. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-ops/skills/design-impact-reporting) | — |
| `design-negotiation` | Advocate for design quality, scope, and timeline with partners and leadership using evidence and shared goals. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/designer-toolkit/skills/design-negotiation) | — |
| `design-principles` | Define actionable principles that resolve trade-offs when the team disagrees. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ux-strategy/skills/design-principles) | — |
| `design-qa-checklist` | Build a QA checklist for verifying that a build matches the design. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-ops/skills/design-qa-checklist) | — |
| `design-rationale` | Write rationale connecting decisions to user needs, business goals, and principles. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/designer-toolkit/skills/design-rationale) | — |
| `design-review-process` | Establish review gates — criteria, checkpoints, and approval flow. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-ops/skills/design-review-process) | — |
| `design-sprint-plan` | Plan and facilitate a design sprint from challenge framing through prototype testing. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-ops/skills/design-sprint-plan) | — |
| `design-system-adoption` | Create adoption strategy and enablement materials to drive design system usage. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/designer-toolkit/skills/design-system-adoption) | — |
| `design-system-governance` | Define how the system evolves — contribution model, versioning, deprecation, and change management. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-systems/skills/design-system-governance) | — |
| `design-token` | Define and organise tokens for colour, spacing, type, and elevation with naming and usage rules. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-systems/skills/design-token) | — |
| `design-token-audit` | Audit token usage across a product for coverage, drift, and hard-coded values. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/designer-toolkit/skills/design-token-audit) | — |
| `diary-study-plan` | Design a diary study — prompts, cadence, duration, participant criteria, and analysis frame. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/diary-study-plan) | — |
| `documentation-template` | Generate a reusable documentation scaffold for components, patterns, or guidelines. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-systems/skills/documentation-template) | — |
| `doherty-threshold` | Apply the Doherty Threshold — keep system response under 400ms to preserve user flow. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/doherty-threshold) | — |
| `empathy-map` | Build a Says, Thinks, Does, Feels map for one user or segment. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/empathy-map) | — |
| `error-handling-ux` | Design error prevention, detection, and recovery across a product — message content, placement, and escape routes. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/error-handling-ux) | — |
| `experience-map` | Map the full ecosystem of touchpoints, channels, and relationships across a service. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ux-strategy/skills/experience-map) | — |
| `feedback-patterns` | Design confirmations, status updates, and notifications that tell users an action registered. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/feedback-patterns) | — |
| `fitts-law` | Apply Fitts's Law — target acquisition time depends on size and distance. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/fitts-law) | — |
| `form-design` | Design a form end to end — field order, grouping, validation, and completion. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/form-design) | — |
| `gesture-patterns` | Design gesture interactions for touch and pointer — swipe, drag, long-press, and their discoverability. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/gesture-patterns) | — |
| `handoff-spec` | Write the implementation handoff — measurements, behaviours, assets, states, and edge cases. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-ops/skills/handoff-spec) | — |
| `heuristic-evaluation` | Run an expert review against Nielsen's heuristics and domain criteria, with severity ratings. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/prototyping-testing/skills/heuristic-evaluation) | — |
| `hicks-law` | Apply Hick's Law — decision time grows with the number of simultaneous choices. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/hicks-law) | — |
| `icon-system` | Specify an icon system — grid, sizing, stroke weight, naming, categories, and implementation. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-systems/skills/icon-system) | — |
| `illustration-style` | Define an illustration style guide — visual language, colour usage, and application rules. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/illustration-style) | — |
| `information-architecture` | Design content structure, hierarchy, labelling, and the navigation model. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ux-strategy/skills/information-architecture) | — |
| `interfaces-that-feel` | Apply an emotional resonance lens to a UI that is technically correct but flat, prescribing changes at the copy, motion, and interaction layer. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/interfaces-that-feel) | — |
| `interview-script` | Write a structured interview guide — warm-up, core exploration, and wrap-up. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/interview-script) | — |
| `jakobs-law` | Apply Jakob's Law — users expect your product to work like the others they already use. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/jakobs-law) | — |
| `jobs-to-be-done` | Map functional, emotional, and social jobs with outcome expectations. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/jobs-to-be-done) | — |
| `journey-map` | Map one persona's end-to-end experience with stages, touchpoints, emotions, and pain points. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/journey-map) | — |
| `law-of-closure` | Apply the Law of Closure — the eye completes implied shapes from partial forms. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/law-of-closure) | — |
| `law-of-common-region` | Apply the Law of Common Region — a shared container, background, or border groups elements regardless of spacing. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/law-of-common-region) | — |
| `law-of-continuity` | Apply the Law of Continuity — the eye follows alignment and unbroken paths. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/law-of-continuity) | — |
| `law-of-figure-ground` | Apply the Law of Figure-Ground — establish which layer is foreground and actionable versus background. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/law-of-figure-ground) | — |
| `law-of-proximity` | Apply the Law of Proximity — spatial closeness groups elements more strongly than any other cue. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/law-of-proximity) | — |
| `law-of-similarity` | Apply the Law of Similarity — shared colour, shape, or size signals that elements belong to one category. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/law-of-similarity) | — |
| `layout-grid` | Define a responsive grid — columns, gutters, margins, and breakpoint behaviour. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/layout-grid) | — |
| `loading-states` | Design waiting experiences — spinners, skeletons, optimistic updates, and progressive reveal. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/loading-states) | — |
| `localization-design` | Design for multiple languages, writing directions, and cultural contexts — text expansion, RTL mirroring, and locale formats. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-systems/skills/localization-design) | — |
| `metrics-definition` | Define UX metrics and KPIs that connect design decisions to measurable outcomes. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ux-strategy/skills/metrics-definition) | — |
| `micro-interaction-spec` | Specify one micro-interaction completely — trigger, rules, feedback, loops, and modes. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/micro-interaction-spec) | — |
| `millers-law` | Apply Miller's Law — chunk information into groups of about four to fit working memory. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/millers-law) | — |
| `motion-system` | Define motion tokens — durations, easing vocabulary, and reduced-motion handling — for consistency product-wide. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-systems/skills/motion-system) | — |
| `naming-convention` | Establish naming rules for components, tokens, and layers with patterns and worked examples. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-systems/skills/naming-convention) | — |
| `navigation-patterns` | Select and design a navigation pattern — tabs, drawer, hierarchy, or hub — matched to product structure and user tasks. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/navigation-patterns) | — |
| `north-star-vision` | Articulate a long-horizon product vision that aligns teams and anchors strategy. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ux-strategy/skills/north-star-vision) | — |
| `onboarding-design` | Design the first-run experience — activation path, progressive disclosure, and time to first value. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/onboarding-design) | — |
| `opportunity-framework` | Identify, score, and prioritise design opportunities against impact and effort. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ux-strategy/skills/opportunity-framework) | — |
| `parallel-concepts` | Build several genuinely different solutions to the same problem at once, spread across what the user does rather than how it looks. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/prototyping-testing/skills/parallel-concepts) | — |
| `pattern-library` | Structure a pattern entry — problem context, solution, usage examples, and related patterns. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-systems/skills/pattern-library) | — |
| `peak-end-rule` | Apply the Peak-End Rule — a flow is remembered by its most intense moment and its last. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/peak-end-rule) | — |
| `platform-conventions` | Design to iOS and Android conventions — what each OS mandates, where they diverge, and when to unify. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/platform-conventions) | — |
| `presentation-deck` | Structure a design presentation for a specific audience and decision. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/designer-toolkit/skills/presentation-deck) | — |
| `prototype-strategy` | Choose prototype fidelity and method to match the design question and the decision at stake. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/prototyping-testing/skills/prototype-strategy) | — |
| `qual-quant-triangulation` | Reconcile what the numbers say with what users say, and design the study that settles it rather than restates it. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/qual-quant-triangulation) | — |
| `readable-measure` | Set line length and measure for comfortable reading across type sizes and breakpoints. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/readable-measure) | — |
| `research-repository` | Build a repository that makes findings findable, reusable, and cumulative across teams. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/research-repository) | — |
| `responsive-design` | Design layouts and interactions that adapt across screen sizes and input methods. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/responsive-design) | — |
| `search-ux` | Design search — query input, zero results, refinement, and result presentation. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/search-ux) | — |
| `serial-position-effect` | Apply the Serial Position Effect — first and last items in a sequence are recalled best. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/serial-position-effect) | — |
| `service-blueprint` | Map service delivery across frontstage actions, backstage processes, and supporting systems. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ux-strategy/skills/service-blueprint) | — |
| `spacing-system` | Create a spacing scale from a base unit with rules for when each step applies. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/spacing-system) | — |
| `stakeholder-alignment` | Build alignment artifacts — responsibility matrices, decision rights, and communication plans. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ux-strategy/skills/stakeholder-alignment) | — |
| `state-machine` | Model component behaviour as explicit states, events, and transitions. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/state-machine) | — |
| `summarize-interview` | Turn one interview transcript into themes, supporting quotes, and action items. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/summarize-interview) | — |
| `survey-design` | Design unbiased survey instruments — question wording, scales, and sampling — to measure attitudes at scale. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/survey-design) | — |
| `team-workflow` | Design the team's operating rhythm — task management, collaboration rituals, and tooling. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-ops/skills/team-workflow) | — |
| `teslers-law` | Apply Tesler's Law — every process has irreducible complexity that someone must absorb. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/teslers-law) | — |
| `test-scenario` | Write realistic usability task scenarios with success criteria and facilitation notes. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/prototyping-testing/skills/test-scenario) | — |
| `theming-system` | Design theming architecture — brand variants, dark mode, and high-contrast — mapped through token layers. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-systems/skills/theming-system) | — |
| `typography-scale` | Create a modular type scale with size, weight, and line-height relationships. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/typography-scale) | — |
| `usability-test-plan` | Design a usability study — research questions, methodology, participant criteria, metrics, and facilitation guide. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/usability-test-plan) | — |
| `user-flow-diagram` | Diagram screen-level paths, decision points, and branch logic. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/prototyping-testing/skills/user-flow-diagram) | — |
| `user-persona` | Build research-grounded personas with goals, frustrations, and behavioural patterns. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-research/skills/user-persona) | — |
| `ux-writing` | Write interface copy — microcopy, error messages, empty states, and CTAs. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/designer-toolkit/skills/ux-writing) | — |
| `version-control-strategy` | Define version control for design files, components, and libraries — branching, naming, and release. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/design-ops/skills/version-control-strategy) | — |
| `visual-hierarchy` | Establish hierarchy through size, weight, colour, spacing, and position so the eye lands in the intended order. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/visual-hierarchy) | — |
| `von-restorff-effect` | Apply the Von Restorff Effect — the element that differs from its neighbours is the one remembered. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/ui-design/skills/von-restorff-effect) | — |
| `wireframe-spec` | Specify wireframe layout — content priority, component placement, and annotation. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/prototyping-testing/skills/wireframe-spec) | — |
| `zeigarnik-effect` | Apply the Zeigarnik Effect — incomplete tasks stay mentally active. | [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills/tree/main/interaction-design/skills/zeigarnik-effect) | — |

## Figma & design tokens

Moving designs, assets and tokens between Figma and the codebase, and locking a colour and type system in place. Everything here except `theme-factory` needs a Figma MCP server.

| Skill | What it's for | Source | Needs |
| --- | --- | --- | --- |
| `figma` | Use the Figma MCP server to fetch design context, screenshots, variables, and assets from Figma, and to translate Figma nodes into production code. | [openai/skills](https://github.com/openai/skills/tree/main/skills/.curated/figma) | **Figma MCP server** |
| `figma-automation` | Automate Figma through Composio's Rube MCP: inspect files and components, extract design tokens and convert them to a Tailwind config, render and download image and SVG assets, and read… | [composiohq/awesome-claude-skills](https://github.com/composiohq/awesome-claude-skills/tree/8c60204e19cdc3e01c747c3f51f9cb9ce1d3fc96/figma-automation) | **Rube MCP (Composio) + a connected Figma account** |
| `figma-code-connect-components` | Connects Figma design components to code components using Code Connect mapping tools. | [openai/skills](https://github.com/openai/skills/tree/main/skills/.curated/figma-code-connect-components) | **Figma MCP server** |
| `figma-create-design-system-rules` | Generates custom design system rules for the user's codebase. | [openai/skills](https://github.com/openai/skills/tree/main/skills/.curated/figma-create-design-system-rules) | **Figma MCP server** |
| `figma-create-new-file` | Create a new blank Figma or FigJam file, resolving the user's plan first when needed. | [openai/skills](https://github.com/openai/skills/tree/main/skills/.curated/figma-create-new-file) | **Figma MCP server** |
| `figma-design-to-code` | Figma's own rules for turning a design into code with 1:1 visual fidelity: always pull a screenshot as the visual target, implement from high-fidelity design context rather than the… | [figma/mcp-server-guide](https://github.com/figma/mcp-server-guide/tree/main/skills/figma-design-to-code) | **Figma MCP server (`https://mcp.figma.com/mcp`) + a Figma Dev/Full seat** |
| `figma-generate-design` | Use this skill alongside figma-use when the task involves translating an application page, view, or multi-section layout into Figma. | [openai/skills](https://github.com/openai/skills/tree/main/skills/.curated/figma-generate-design) | **Figma MCP server** |
| `figma-generate-library` | Build or update a professional-grade design system in Figma from a codebase. | [openai/skills](https://github.com/openai/skills/tree/main/skills/.curated/figma-generate-library) | **Figma MCP server** |
| `figma-implement-design` | Step-by-step workflow for translating a Figma node into production code: parse the file key and node id, fetch design context, capture a screenshot as the source of truth, download… | [openai/skills](https://github.com/openai/skills/tree/main/skills/.curated/figma-implement-design) | **Figma MCP server** |
| `figma-use` | **MANDATORY prerequisite** — you MUST invoke this skill BEFORE every `use_figma` tool call. | [openai/skills](https://github.com/openai/skills/tree/main/skills/.curated/figma-use) | **Figma MCP server** |
| `theme-factory` | Lock a coherent colour and type system onto an artifact — slides, docs, reports, landing pages or an app — using ten ready-made themes, each with a full palette and font pairing, or by… | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/theme-factory) | — |

## Testing & visual QA

Driving a real browser to check that what shipped matches what was designed.

| Skill | What it's for | Source | Needs |
| --- | --- | --- | --- |
| `playwright` | Automate a real browser from the terminal with the Playwright CLI: navigation, form filling, accessibility snapshots, screenshots, data extraction and UI-flow debugging, driven by a… | [openai/skills](https://github.com/openai/skills/tree/main/skills/.curated/playwright) | `playwright-cli` (or `npx playwright`) + browser binaries |
| `playwright-interactive` | Keep one long-lived Playwright session open and poke at a local web or Electron app across many iterations without restarting the browser, so page handles survive between steps. | [openai/skills](https://github.com/openai/skills/tree/main/skills/.curated/playwright-interactive) | **A persistent JS REPL (`js_repl`) — not available in Cursor** |
| `webapp-testing` | Drive a local web app with Playwright to verify it actually works: navigate, fill forms, click through flows, capture screenshots, read console logs, and manage the dev-server lifecycle… | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/webapp-testing) | Python + `playwright` (`pip install playwright && playwright install chromium`) |

## Accessibility

WCAG 2.2 work, split by job: scan one page automatically, inspect one page by hand, audit a whole site under WCAG-EM, remediate, or diff a change against a baseline.

| Skill | What it's for | Source | Needs |
| --- | --- | --- | --- |
| `accessibility-audit` | Whole site or product — a full web accessibility (a11y) audit against WCAG 2.2, following the WCAG-EM methodology. | [AccessLint/skills](https://github.com/AccessLint/skills/tree/main/plugins/accesslint/skills/accessibility-audit) | `@accesslint/cli`; AccessLint MCP optional for rule metadata |
| `accessibility-diff` | Regression check — diff a live page's web accessibility (a11y) violations against a baseline. | [AccessLint/skills](https://github.com/AccessLint/skills/tree/main/plugins/accesslint/skills/accessibility-diff) | `@accesslint/cli` (via npx) |
| `accessibility-fix` | Remediation only — repair web accessibility (a11y) violations against WCAG 2.2 with a baseline, edit, and verify loop. | [AccessLint/skills](https://github.com/AccessLint/skills/tree/main/plugins/accesslint/skills/accessibility-fix) | **AccessLint MCP server (`@accesslint/mcp`)** |
| `accessibility-inspect` | One page, hands-on manual tier — drive a live page through the web accessibility (a11y) checks a rule engine can't decide: keyboard operation and focus order, screen-reader names, roles… | [AccessLint/skills](https://github.com/AccessLint/skills/tree/main/plugins/accesslint/skills/accessibility-inspect) | **chrome-devtools MCP server; AccessLint MCP optional for rule metadata** |
| `accessibility-scan` | One page, automated tier — run the web accessibility (a11y) rule engine against a live page and locate every violation it can detect mechanically. | [AccessLint/skills](https://github.com/AccessLint/skills/tree/main/plugins/accesslint/skills/accessibility-scan) | `@accesslint/cli` (via npx) + a debuggable Chrome |

## Diagrams

Generating Excalidraw diagrams for architecture, flows and visual explanations.

| Skill | What it's for | Source | Needs |
| --- | --- | --- | --- |
| `excalidraw` | Generate hand-drawn Excalidraw diagrams and write them out as valid `.excalidraw` JSON, with a shared colour theme and a library of icon recipes. | [alexanderop/excalidraw-skill](https://github.com/alexanderop/excalidraw-skill) | — |
| `excalidraw-diagram` | Create Excalidraw diagrams that make a visual argument rather than just drawing boxes — fan-outs for one-to-many, timelines for sequences, convergence for aggregation — with a Playwright… | [coleam00/excalidraw-diagram-skill](https://github.com/coleam00/excalidraw-diagram-skill) | `uv` + Playwright chromium for the optional render-and-validate loop |

## Licensing and attribution

Every skill keeps the license it shipped under, recorded in its own frontmatter. Sources that ship a per-skill `LICENSE.txt` (anthropics, openai) keep that file in the skill folder; sources with a single repo-wide license have it copied into [`LICENSES/`](./LICENSES). Full per-source attribution is in [`NOTICE.md`](./NOTICE.md).

Two caveats worth knowing before you rely on these:

- `excalidraw-diagram` is vendored from a repository that publishes no license file. It is included because it was asked for, but it carries no grant of rights — treat it as read-only reference until upstream declares a license.
- The Figma skills are distributed by Figma under the [Figma Developer Terms](https://www.figma.com/legal/developer-terms/) as a beta feature, not an open-source license.

