# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## CI/CD and distribution

- `desktop-build.yml`: builds Windows, Linux AppImage, and macOS artifacts on push to `main`.
- `flatpak-build.yml`: builds Linux `.flatpak` bundle on push to `main`.
- `release-versioning.yml`: runs Changesets release automation.

## Automatic versioning

- Create a changeset file: `npm run changeset`
- Apply version bumps: `npm run version-packages`
- Publish in CI: `npm run release`

## In-app version and update checks

- Current app version is shown in Settings.
- "Check updates" calls GitHub Releases API (`/releases/latest`) and compares with current app version.
- Optional override: set `VITE_GITHUB_REPO` (format `owner/repo`).

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
