## Context

The app uses Tauri v2 with React and currently relies on local/manual builds. The request requires straightforward CI-based distribution and lightweight runtime update awareness based on GitHub releases.

## Goals / Non-Goals

- Goals:
  - Build desktop artifacts for Windows, Linux AppImage, Linux Flatpak, and macOS on push to `main`.
  - Keep versioning automation simple and low-maintenance.
  - Show the current app version in the UI.
  - Check GitHub releases for updates from inside the app.
- Non-Goals:
  - Fully automatic background download/install in this change.
  - Flathub publication.
  - Notarization/signing orchestration beyond documenting secrets.

## Decisions

- Use GitHub Actions with one workflow for multi-platform builds plus a dedicated Flatpak job.
- Use Changesets release PR flow for semver automation.
- Use `@tauri-apps/api/app` for current version and GitHub Releases API (`/releases/latest`) for update checks.

## Risks / Trade-offs

- Flatpak build can be environment-sensitive in CI.
  - Mitigation: isolate it in its own job and always upload logs/artifacts.
- macOS build/signing can fail without Apple credentials.
  - Mitigation: keep macOS job best-effort and surface status clearly.

## Migration Plan

1. Merge workflows and changeset config.
2. Add first changeset and merge release PR.
3. Configure repo secrets for optional release upload/signing.
4. Validate in-app version and update check behavior.
