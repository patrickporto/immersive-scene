# Change: Add CLI command to validate manifest folder and build importable ZIP

## Why

Today, SoundSet import expects a specific archive structure (`manifest.json` + audio files), but there is no direct CLI workflow to package an already-prepared folder into a guaranteed-compatible ZIP. This slows down external content workflows and increases import failures caused by malformed folders.

## What Changes

- Add a CLI command that accepts a source folder, validates `manifest.json`, and validates referenced audio files before packaging.
- Add deterministic ZIP packaging rules so output matches the same structure used by project export/import (`manifest.json` at archive root and audio files at their declared `archive_path`).
- Add clear validation errors for malformed manifests, missing files, unsupported `format_version`, and unsafe archive paths.
- Add command output behavior:
  - Required input: source folder path
  - Optional output path: defaults to `<soundset-name>.zip` in current working directory

## Impact

- Affected specs: `soundset-package-cli` (new)
- Related existing change: `add-soundset-import-export` (reuses the same manifest contract)
- Affected code:
  - `src-tauri/src/import_export.rs` (shared validation/packaging logic)
  - `src-tauri/src/bin/*` or equivalent CLI entrypoint (new command surface)
  - Documentation for CLI usage and expected folder layout
