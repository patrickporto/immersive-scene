# Change: Add cross-platform release automation and in-app GitHub update checks

## Why

The project currently has no GitHub Actions pipeline for desktop distribution, no automated version flow, and no in-app way to display the current app version and check for new releases.

## What Changes

- Add a GitHub Actions build pipeline on push to `main` that generates:
  - Windows installer artifacts
  - Linux AppImage artifacts
  - Linux Flatpak bundle artifacts (`.flatpak`)
  - macOS artifacts when macOS build succeeds
- Add a simple automatic versioning workflow using Changesets release PR automation.
- Add app runtime version visibility in Settings.
- Add an in-app "Check updates" action that checks the latest GitHub release and compares versions.
- Document release/update configuration and required repository secrets.

## Impact

- Affected specs:
  - `desktop-release-distribution` (new)
  - `release-versioning` (new)
  - `github-update-awareness` (new)
- Affected code:
  - `.github/workflows/*` (new workflows)
  - `.changeset/*` (new versioning automation config)
  - `src/features/settings/hooks/useAppVersionAndUpdates.ts` (new)
  - `src/features/settings/components/SettingsModal.tsx` (version and update UI)
  - `package.json` (changeset scripts and dependency)
