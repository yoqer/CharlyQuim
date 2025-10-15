# Welcome to CorteXIDE

<div align="center">
	<img
		src="./resources/branding/icon.png"
	 	alt="CorteXIDE Logo"
		width="300"
	 	height="300"
	/>
</div>

**Open-source, self-hosted AI IDE — inspired by Cursor, forked from Void — focused on privacy and local control.**

CorteXIDE is an open-source, privacy-first AI IDE — a self-hosted alternative to Cursor, forked from Void IDE, rebuilt for reliability, transparency, and full local control. Chat → Plan → Diff → Apply — locally, securely, and open-source.

Use AI agents on your codebase, checkpoint and visualize changes, and bring any model or host locally. CorteXIDE sends messages directly to providers without retaining your data.

**Local-only by default; no telemetry; no outbound requests. See `.cortexide/audit/log.jsonl`.**

## Quick Start

```bash
npm ci && ./scripts/code.sh --user-data-dir ./.tmp/user-data --extensions-dir ./.tmp/extensions
```

## Contributing

1. See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

2. Check out our [Project Board](https://github.com/orgs/cortexide/projects/2) for current tasks.

## Reference

CorteXIDE is a fork of the [vscode](https://github.com/microsoft/vscode) repository and [Void IDE](https://github.com/voideditor/void). For a guide to the codebase, see [VOID_CODEBASE_GUIDE](VOID_CODEBASE_GUIDE.md).

## Support
- 🧭 [Website](https://cortexide.com)
- 👋 [Discord](https://discord.gg/cortexide)
- 📧 Email: hello@cortexide.com
