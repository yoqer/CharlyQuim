# Changelog

All notable changes to CorteXIDE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-internal] - 2025-01-27

### Added
- Initial CorteXIDE fork from Void IDE
- Privacy-first design with telemetry disabled by default
- Local-only operation with no outbound requests by default
- CorteXIDE branding and logo (brain/circuit design)
- Environment variable gating for telemetry and updates:
  - `CORTEXIDE_ENABLE_TELEMETRY=true` to enable PostHog analytics
  - `CORTEXIDE_ENABLE_UPDATES=true` to enable update checks
  - `CORTEXIDE_POSTHOG_KEY` and `CORTEXIDE_POSTHOG_HOST` for custom telemetry
  - `CORTEXIDE_UPDATES_URL` for custom update endpoint
- Updated product identifiers:
  - Application name: `cortexide`
  - Bundle ID: `com.cortexide.app`
  - Data folder: `.cortexide-editor`
  - Version: `0.1.0`
- Canonical dev command: `npm ci && ./scripts/code.sh --user-data-dir ./.tmp/user-data --extensions-dir ./.tmp/extensions`

### Changed
- Rebranded from Void to CorteXIDE throughout the codebase
- Updated repository URLs and issue links
- Modified product.json with CorteXIDE identifiers
- Updated README with CorteXIDE branding and privacy notes

### Security
- Disabled all telemetry by default
- Disabled update checks by default
- No outbound network requests without explicit opt-in
- Local audit logging planned for future releases

### Technical
- Maintained compatibility with VS Code extension ecosystem
- Preserved Void's AI chat/apply workflow
- Kept React component architecture intact
- Maintained Electron main/renderer process separation
