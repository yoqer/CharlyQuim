# Plate Research Notes

## Snapshot
- Plate is a Slate-based editor framework distributed as the `platejs` package plus dozens of feature plugins (`packages/*`). The core exports ensure both headless usage and React bindings via `platejs/react`.  
  Sources: `packages/plate/package.json`, `docs/index.mdx`
- The project’s philosophy: ownable UI (Plate UI), composable plugin system, and openness to AI/MCP tooling for automation-friendly editors.  
  Sources: `docs/index.mdx`, `docs/installation/mcp.mdx`
- Markdown support is handled by `@platejs/markdown`, providing deterministic serialize/deserialize with remark pipelines and customizable rules for custom elements/marks.  
  Source: `docs/(plugins)/(serializing)/markdown.mdx`

## Core Architecture
- **Plugin-driven editor** – everything is a plugin created/configured via `createPlatePlugin`. Plugins can define nodes (elements/marks), behaviors (rules, handlers), injected props, and extend the Slate editor instance.  
  Source: `docs/(guides)/plugin.mdx`
- **Editor creation** – `createPlateEditor` (headless) or `usePlateEditor` (React hook) assembles the plugin list, initial value (sync or async), node ID policies, normalization, and other options.  
  Source: `docs/(guides)/editor.mdx`
- **Feature kits** – curated arrays of plugins + Plate UI components (`BasicBlocksKit`, `MarkdownKit`, etc.) that accelerate setup; recommended when we want turnkey functionality.  
  Source: `docs/(guides)/feature-kits.mdx`

## Key Packages for Obsidian-like MVP
- `platejs` (core + React bindings, Slate helpers).  
- `@platejs/markdown` for Markdown ↔ Plate JSON.  
- `@platejs/basic-nodes`, `@platejs/basic-styles`, `@platejs/list`, `@platejs/table`, `@platejs/toc`, `@platejs/tag`, `@platejs/blockquote`, `@platejs/toggle`, etc., to cover typical Obsidian features (headings, lists, callouts, toggles, tables, tags).  
- `packages/ai` integrates AI commands; relevant for agent-driven features, though we need to evaluate how it interacts with Void’s agent pipeline.  
- `packages/yjs` for collaborative editing if/when multiplayer is desired.  
- Plate UI (copied components under `apps/plate-ui` via CLI) provides ready-made shadcn-styled elements (slash menu, floating toolbars, structure panels), aligning with modern note UX.  
  Sources: `packages` directory listing, `docs/index.mdx`, `docs/(guides)/feature-kits.mdx`

## Markdown Serialization Highlights
- Round-trip faithful conversions with MDX fallback for custom nodes; we can register rules keyed by Plate plugin `key`/`type` to convert to/from mdast nodes.  
- Supports CommonMark, GFM (`remark-gfm`), math (`remark-math`), MDX, mentions, etc., through `remarkPlugins`.  
- Paste pipeline: `MarkdownPlugin` optionally intercepts `text/plain` paste; disable via `parser: null` if we need manual handling.  
- Serialization API allows filtering (`allowedNodes`, `disallowedNodes`, `allowNode`) and custom content extraction for partial exports.  
- Provides strong hook for enforcing Obsidian-compatible syntax; any gaps can be patched via `rules`.  
  Source: `docs/(plugins)/(serializing)/markdown.mdx`

## UI & Interaction Layer
- Plate UI encourages copying source into the app (shadcn model). Components include block toolbars, slash command, command palettes, comments, etc., already themed and agent-friendly.  
- MCP server plus shadcn registry allow automated retrieval/update of UI resources—promising for Void agents managing editor configuration.  
  Sources: `docs/index.mdx`, `docs/installation/mcp.mdx`

## Integration Considerations for Void
- **Rendering:** Mount Plate inside a React root (Void already bundles React for chat panels). Need to ensure bundler adds Plate’s ESM output (`dist/*.mjs`). Exports provide both `import` and `require`, but we should prefer ESM in the renderer thread.  
  Source: `packages/plate/package.json`
- **State sync:** Plate operates on Slate in-memory tree; to persist, convert to Markdown via `editor.api.markdown.serialize()` on save, and rehydrate via `deserialize` when opening `.md`.  
- **Plugin list:** Must mirror every Markdown construct we plan to round-trip; e.g., for callouts we’ll need `CalloutPlugin`, for wikilinks we may need custom plugin + Markdown rule.  
- **nodeId system:** Enabled by default; keep it to power tables, TOC, block selection. If we disable, we lose functionality like drag-and-drop.  
  Source: `docs/(guides)/editor.mdx`
- **Controlled vs uncontrolled:** Plate allows controlled value (React state) or internal state management. For large documents, consider using the uncontrolled model and subscribe to `onChange` to avoid unnecessary re-renders.  
  Source: `docs/(guides)/controlled.mdx`
- **Command palette & slash menu:** Provided via Plate UI kits; candidate for Void’s command bar surfacing note-level actions. Need to check compatibility with existing Void quick edit commands.

## Agent & Automation Hooks
- Plate AI plugins provide command schema for formatting, rewriting, summarizing; could integrate with Void agent prompts once we map agent outputs to Plate operations.  
- MCP registry exposes template metadata; Void agents could fetch Plate kits or docs dynamically, but we must vet licensing and runtime cost.  
  Source: `docs/installation/mcp.mdx`

## Build & Runtime Notes
- `sideEffects: false` on `platejs` enabling tree-shaking (good for bundling in VS Code).  
- Peer dependency on React 18+; ensure Void renderer uses compatible React/ReactDOM versions.  
- Packages publish both `index.mjs` and `index.js`; we need bundler config to handle `.mjs` in Electron environment (esbuild/webpack modifications).  
- Many plugins rely on CSS variables/class names from Plate UI; we must port Tailwind/shadcn styles or translate to VS Code theme tokens.  
  Source: `packages/plate/package.json`, Plate UI docs

## Risks & Unknowns
- **Styling integration:** Plate UI expects Tailwind/shadcn stack; bridging to VS Code theming may require significant adaptation.  
- **Performance:** Need benchmarks for large Markdown files (plate uses Slate; operations on big docs can be heavy). Evaluate virtualization for notes >10k nodes.  
- **Markdown parity:** Out-of-the-box Markdown rules may not match Obsidian conventions (e.g., callouts `[!type]`, wikilinks `[[link]]`, block refs `^id`). Will require custom remark plugins or `rules` definitions.  
- **Collab vs local-first:** Yjs support exists but adds bundle weight; decide if we enable by default.  
- **License:** MIT, compatible—but verify Plate UI code we copy inherits same license before shipping.  

## Suggested Research Questions / Checklist
1. What set of Plate plugins or kits reproduce Obsidian’s feature set (wikilinks, callouts, embeds, task lists, frontmatter) without custom code, and where do we need bespoke plugins?  
2. How to implement Obsidian-style wikilinks and embeds in Plate’s plugin architecture while keeping Markdown serialization identical?  
3. What is the minimal CSS/theming bridge needed to make Plate UI components follow VS Code theme tokens (light/dark/high contrast)?  
4. How do Plate AI plugins expose commands/events, and can Void’s agent pipeline trigger them programmatically?  
5. What are the bundle sizes for core + essential plugins, and can we lazy-load heavy features (tables, graph view) to keep the renderer responsive?  
6. Does Plate’s paste/clipboard behavior respect Obsidian expectations (YAML frontmatter, Markdown tables, block refs), or do we need overrides?  
7. What is the strategy for validating Markdown round-trips at scale (test harness, sample vault diffing)?  
8. How well do Plate’s collaborative (Yjs) plugins coexist with a local-first file model, and should they be disabled initially?  
9. Are there any Slate-level limitations (e.g., nested lists, complex tables) that would affect Obsidian compatibility, and what workarounds exist?  
10. What is the migration path if Plate releases breaking changes (major versions move quickly)—do we pin to a version and mirror docs locally for MCP use?

