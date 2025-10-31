# UI Simplification Backlog

## Guiding Principles
- Preserve Void’s agent automations (chat sidebar, edit/apply pipeline, terminal tooling) as first-class features.
- Present a notes-first surface that feels closer to Obsidian than an IDE while keeping developer affordances available in the background.
- Prefer hiding or deferring code-centric UI rather than deleting logic so functionality can return later if needed.

## Activity Bar & Side Views
- **Keep (renamed/tuned):** Explorer → “Vault”, custom Plate editor view, a lightweight Outline/backlinks panel once implemented.
- **Hide by default:** Run & Debug, Remote Explorer, Testing, Extensions, SCM (leave service active for automations, expose only in advanced mode), Timeline view.
- **Implementation notes:** Update `product.json` default view visibility, or register minimal `viewWelcome` contributions that point users to Vault/Notes instead of code tooling.

## Bottom Panel & Panels Toggle
- **Hide:** Run/Debug console, Problems, Toggle Panel button in layout control (unless needed for agent logs).
- **Keep (background):** Terminal & Output services for agents; surface only through automation UI rather than permanent tabs.
- **Implementation notes:** Adjust layout control defaults (`workbench.layoutControl.type = 'custom'`) and panel visibility settings in configuration defaults.

## Menu Bar Strategy
- **Keep:** File, Edit, View (trim commands), Window, Help.
- **Hide/relocate:** Go, Run, Terminal top-level menus; re-home any necessary commands under View or the agent UI.
- **Implementation notes:** Review `src/vs/workbench/electron-main/menus/menus.ts` and related menu contribution files to prune menu groups or gate them behind an “Advanced Mode”.

## Explorer Details
- Outline and Timeline sections move into a future “Knowledge” right rail (backlinks, graph, outline).
- Source Control surface hidden initially but services remain for agents (commit message generation, file diffing).
- Context menu items like “Void: Copy Prompt” can stay if they serve automations; trim anything code-specific.

## Layout Defaults
- Start in single-column layout focused on Vault + Editor.
- Hide activity bar labels, status bar items related to build/debug.
- Auto-open the user’s vault folder and the Plate editor with last note.

## Open Questions
- Do we expose a manual terminal entry point for advanced users, or only via agent-issued commands?
- Should SCM be discoverable through a secondary menu, or entirely delegated to automation?
- What fallback UI do we provide if agent services fail (e.g., show raw terminal/output panels)?

## Next Implementation Steps
1. Prototype settings overrides in `product.json` to hide debug/run/testing containers and adjust layout control.
2. Inspect `menus.ts` in electron-main to plan menu pruning work.
3. Design the Vault explorer rename and ensure agent features (e.g., file staging) continue working without the VS Code chat branding.
