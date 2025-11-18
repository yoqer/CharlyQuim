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

## 2025-02-13 Workbench Audit Notes
- **Run & Debug (`workbench.view.debug`)** – Activity bar container and Debug Console panel are registered in `src/vs/workbench/contrib/debug/browser/debug.contribution.ts` (see `registerViewContainer` calls around lines 398 & 426 and `DEBUG_PANEL_ID`). We can unpin the activity bar entry by seeding `workbench.activity.pinnedViewlets2` via a startup contribution (use `IStorageService` + `StorageScope.PROFILE`) and skip the panel by pruning `workbench.panel.pinnedPanels` to omit `workbench.panel.repl`. Underlying debug services stay intact for agent use if ever needed.
- **Remote Explorer (`workbench.view.remote`)** – Forwarded ports view container comes from `src/vs/workbench/contrib/remote/browser/remoteExplorer.ts`. Similar storage seeding can remove the activity bar icon while leaving tunnel services alive for automations that rely on SSH/agent tunnels.
- **Testing (`workbench.view.testing`) & Extensions (`workbench.view.extensions`)** – Registered in `src/vs/workbench/contrib/testing/browser/testing.contribution.ts` and `src/vs/workbench/contrib/extensions/browser/extensions.contribution.ts`. Apply the same pinned-view override so the MVP only surfaces the Vault (Explorer) entry.
- **Source Control (`workbench.view.scm`)** – Keep services (`src/vs/workbench/contrib/scm/browser/scm.contribution.ts`) but hide the view container by default using the storage override. Agents can still drive SCM via services; expose a manual toggle later if users need it.
- **Outline View (`outline`)** – Added to the Explorer container in `src/vs/workbench/contrib/outline/browser/outline.contribution.ts`. We can register a `WorkbenchContribution` that calls `viewsService.setViewVisibility('outline', false)` on first run and track the flag in storage to avoid overriding user choice.
- **Timeline View (`timeline`)** – Registered next to Outline in `src/vs/workbench/contrib/timeline/browser/timeline.contribution.ts`. Same pattern as Outline: hide on startup unless explicitly re-enabled.
- **Toggle Panel / Layout Control** – Settings live in `src/vs/workbench/browser/workbench.contribution.ts` (`workbench.layoutControl.enabled` & `workbench.layoutControl.type`). Set product-level `configurationDefaults` (in `product.json`) to disable the layout control entirely for a cleaner title bar.
- **Status Bar Tabs (Problems/Output/Debug Console)** – Panel pinning is stored under `workbench.panel.pinnedPanels`. Seed this storage key with only `workbench.panel.terminal` so Problems/Debug Console stay hidden yet can be resurrected by agents when needed.
