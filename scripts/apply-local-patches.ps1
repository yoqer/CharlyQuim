# Applies local patches so a fresh install keeps working.
# Run after `npm ci` and before launching the app.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

function Assert-Path($path, $message) {
    if (-not (Test-Path $path)) {
        throw $message
    }
}

# Patch zod exports to allow subpaths used by @modelcontextprotocol/sdk
$zodPkgPath = Join-Path $repoRoot 'node_modules/zod/package.json'
Assert-Path $zodPkgPath "Missing zod package; run npm ci first."

$pkgJson = Get-Content -LiteralPath $zodPkgPath -Raw | ConvertFrom-Json
if (-not $pkgJson.exports) {
    $pkgJson | Add-Member -NotePropertyName 'exports' -NotePropertyValue @{}
}

function Ensure-Export {
    param(
        [string] $Name,
        [string] $Import,
        [string] $Require,
        [string] $Types
    )

    if (-not $pkgJson.exports.$Name) {
        $pkgJson.exports | Add-Member -NotePropertyName $Name -NotePropertyValue @{
            import  = $Import
            require = $Require
            types   = $Types
        }
    }
}

Ensure-Export './v3' './lib/v3/index.mjs' './lib/v3/index.js' './lib/v3/index.d.ts'
Ensure-Export './v4' './lib/v4/index.mjs' './lib/v4/index.js' './lib/v4/index.d.ts'
Ensure-Export './v4-mini' './lib/v4-mini/index.mjs' './lib/v4-mini/index.js' './lib/v4-mini/index.d.ts'

$pkgJson | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $zodPkgPath -Encoding UTF8

Write-Host "Patched zod exports for v3/v4/v4-mini subpaths."

# Patch @modelcontextprotocol/sdk to import plain zod (not zod/v4) in JS and d.ts
$sdkRoot = Join-Path $repoRoot 'node_modules/@modelcontextprotocol/sdk'
Assert-Path $sdkRoot "Missing @modelcontextprotocol/sdk; run npm ci first."

function Fix-ZodImport {
    param(
        [string] $FilePath
    )
    if (-not (Test-Path $FilePath)) { return }
    $text = Get-Content -LiteralPath $FilePath -Raw
    $updated = $text `
        -replace "from 'zod/v4'", "from 'zod'" `
        -replace 'from "zod/v4"', 'from "zod"' `
        -replace "require\('zod/v4'\)", "require('zod')" `
        -replace 'require\("zod/v4"\)', 'require("zod")'
    if ($updated -ne $text) {
        Set-Content -LiteralPath $FilePath -Value $updated -Encoding UTF8
        Write-Host "Patched zod import in $FilePath"
    }
}

$sdkTargets = Get-ChildItem -LiteralPath (Join-Path $sdkRoot 'dist') -Recurse -File |
    Where-Object { $_.Extension -in '.js', '.ts', '.d.ts', '.mjs', '.cjs' } |
    Where-Object { Select-String -Path $_.FullName -Pattern 'zod/v4' -SimpleMatch -Quiet }

foreach ($file in $sdkTargets) {
    Fix-ZodImport -FilePath $file.FullName
}

Write-Host "Patched @modelcontextprotocol/sdk to use plain zod imports."

