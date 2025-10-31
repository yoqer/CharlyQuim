# Project Overview

## Vision
- Deliver a Markdown-first, Obsidian-compatible note-taking experience on top of the existing Void (VS Code) fork.
- Ship a rich WYSIWYG editor powered by Plate/Slate while preserving raw Markdown files as the single source of truth.
- Retain Void’s agent/terminal affordances so users can automate vault workflows through AI.

## Repository Snapshot
- Root `product.json` mirrors Code-OSS branding with `builtInExtensions: []` (no Markdown preview bundled yet).
- Core Void additions live under `src/vs/workbench/contrib/void/{browser,common,electron-main}`.
- Workbench contributions in `void/browser` register AI services (autocomplete, edit/apply pipeline, terminal tools, settings panes).
- No existing assets inside `.agents`; this document seeds project planning here.

## MVP Targets
- Replace the default code editor surface for `.md` files with a Plate-based custom editor that renders rich text.
- Implement a Markdown ⇄ Plate serializer that round-trips Obsidian syntax (wikilinks, callouts, embeds, block refs, tasks, frontmatter) without diffs.
- Trim or hide IDE-centric chrome (activity bar items, debug/run panels, SCM) to present a notes-first layout.
- Auto-open a designated “vault” folder on launch to mimic Obsidian’s workspace model.

## Key Touchpoints in Codebase
- `product.json`: curate bundled extensions/settings, toggle activity bar defaults, update branding once the app pivots to notes.
- `src/vs/workbench/contrib/void/browser/void.contribution.ts`: entry point for registering services—hook Plate editor contribution here.
- `src/vs/workbench/contrib/void/browser/react/*`: existing React surface for Void panes; reuse patterns to mount Plate inside workbench webviews.
- `src/vs/platform/*`: leverage configuration defaults (e.g., `workbench.activityBar.visible`) to declutter UI.
- File service + model plumbing already wrapped in `voidModelService` and `editCodeService`; extend for Markdown-aware saves if needed.

## Immediate Next Steps
1. Audit existing workbench contributions to identify which can be disabled for the notes MVP without breaking core shell functionality.
2. Prototype a custom editor contribution that mounts a React root; confirm we can intercept `.md` files and persist edits through VS Code’s model service.
3. Draft the Markdown ⇄ Plate schema map (mdast nodes ↔ Plate elements) aligned with Obsidian’s formatting expectations.
4. Inventory Void’s agent entry points to plan how note context will flow into agent prompts while respecting vault safety.

## Open Questions to Resolve
- Do we ship any built-in Markdown extensions (e.g., upstream preview) alongside Plate for fallback/raw mode?
- How opinionated should default vault location be versus prompting users to pick or create one on first run?
- What guardrails are required before exposing agent-driven terminal access in a notes-focused product?
