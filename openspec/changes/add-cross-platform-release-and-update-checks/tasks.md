## 1. OpenSpec

- [x] 1.1 Add proposal, design, and spec deltas for distribution, versioning, and update checks.
- [x] 1.2 Validate change with `openspec validate add-cross-platform-release-and-update-checks --strict`.

## 2. CI/CD Distribution

- [x] 2.1 Add GitHub Actions workflow for push-to-main multi-platform builds (Windows, Linux AppImage, macOS best-effort).
- [x] 2.2 Add dedicated GitHub Actions workflow/job for Linux Flatpak bundle generation.
- [x] 2.3 Upload platform artifacts and checksums as workflow artifacts.

## 3. Automatic Versioning

- [x] 3.1 Add Changesets configuration and scripts.
- [x] 3.2 Add release workflow using Changesets action.

## 4. App Version and Update Checks

- [x] 4.1 Add frontend hook to read current app version at runtime.
- [x] 4.2 Add frontend update check against GitHub latest release endpoint.
- [x] 4.3 Expose version/update status in Settings UI.

## 5. Validation

- [x] 5.1 Run `npm run lint:fix`.
- [x] 5.2 Run targeted tests for new update/version hook.
