# Contributing to CorteXIDE

### Welcome! 👋
This is the official guide on how to contribute to CorteXIDE. We want to make it as easy as possible to contribute, so if you have any questions or comments, reach out via email or discord!

There are a few ways to contribute:

- 💫 Complete items on the [Roadmap](https://github.com/orgs/cortexide/projects/2).
- 💡 Make suggestions in our [Discord](https://discord.gg/cortexide).
- 🪴 Start new Issues - see [Issues](https://github.com/cortexide/cortexide/issues).

## Codebase Guide

We [highly recommend reading this](VOID_CODEBASE_GUIDE.md) guide that we put together on CorteXIDE's sourcecode if you'd like to add new features.

The repo is not as intimidating as it first seems if you read the guide!

Most of CorteXIDE's code lives in the folder `src/vs/workbench/contrib/void/`.

## Development Setup

### Prerequisites

#### Mac
- Python and XCode (usually pre-installed)

#### Windows
- [Visual Studio 2022](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=Community) or [VS Build Tools](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=BuildTools)
- Select "Desktop development with C++" and "Node.js build tools" workloads
- Select MSVC v143, C++ ATL, and C++ MFC components

#### Linux
- `sudo apt-get install build-essential g++ libx11-dev libxkbfile-dev libsecret-1-dev libkrb5-dev python-is-python3` (Debian/Ubuntu)
- `sudo dnf install @development-tools gcc gcc-c++ make libsecret-devel krb5-devel libX11-devel libxkbfile-devel` (Red Hat/Fedora)

### Quick Start

1. `git clone https://github.com/cortexide/cortexide` to clone the repo.
2. `npm ci` to install all dependencies.
3. `npm run buildreact` to build React components.
4. `npm run compile` to compile the project.
5. `./scripts/code.sh --user-data-dir ./.tmp/user-data --extensions-dir ./.tmp/extensions` to launch CorteXIDE in dev mode.

### Development Workflow

- Use `npm run watch` for continuous compilation during development.
- Press `Ctrl+R` (or `Cmd+R`) in the dev window to reload after changes.
- Use `--user-data-dir ./.tmp/user-data --extensions-dir ./.tmp/extensions` flags to isolate dev data.

## Pull Request Guidelines

- Please submit a pull request once you've made a change.
- No need to submit an Issue unless you're creating a new feature that might involve multiple PRs.
- Please don't use AI to write your PR 🙂
- Follow the existing code style and patterns.
- Test your changes thoroughly.

## Branch Naming

- `feature/description` for new features
- `fix/description` for bug fixes
- `docs/description` for documentation changes
- `refactor/description` for code refactoring

## Privacy & Security

CorteXIDE is designed to be privacy-first:
- No telemetry by default (gated behind `CORTEXIDE_ENABLE_TELEMETRY=true`)
- No outbound requests by default (gated behind `CORTEXIDE_ENABLE_UPDATES=true`)
- All AI model communications are direct to providers
- Local audit logging in `.cortexide/audit/log.jsonl`

## License

CorteXIDE is licensed under the MIT License. See [LICENSE.txt](LICENSE.txt) for details.
