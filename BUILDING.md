# Building Void (Sup-IDE fork)

This is a concise, repeatable build-and-run guide for contributors.

## Prerequisites
- Windows 10/11 with PowerShell.
- Node.js 20.18.2 (we vendor a portable copy in `.tools/node-v20.18.2-win-x64`).
- Git and 7zip in PATH.

## One-time setup
1) Clone and enter repo
   `git clone https://github.com/Karthikprasadm/Sup-IDE.git`
   `cd Sup-IDE`
2) Use Node 20.18.2 (recommended)
   `set PATH=%CD%\.tools\node-v20.18.2-win-x64;%PATH%`
3) Install deps (clean)
   `npm ci`

## Apply local patches (fix zod/SDK imports)
Run after every fresh install or lockfile change:
`npm run apply-patches`

## Build
- Compile (generates `out/main.js`, extensions, etc.):
  `npm run compile`
- Build React UI pieces (if missing):
  `npm run buildreact`

## Run (desktop / selfhost)
`.\scripts\code.bat`

Notes:
- Font decode warnings for codicon may appear and are cosmetic.
- Deprecation warnings from Node about N-API can be ignored for dev runs.

## Live development (watch)
Optional: run in a separate shell for incremental rebuilds:
`npm run watch`

## Common issues
- If you see `Cannot find module ... zod/v4`: re-run `npm run apply-patches`.
- If gulp/electron deps misbehave after an npm audit/update: re-run `npm ci` then `npm run apply-patches`.
- On PowerShell, avoid `&&`; use `;` to chain commands.

