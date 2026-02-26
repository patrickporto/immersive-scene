# Change: Add App Settings

## Why

Users need a central place to configure application behavior. The most immediate need is controlling how audio files are managed: whether they are merely referenced by path or copied into a dedicated library folder. The library path should also be configurable.

## What Changes

- Create an **App Settings** modal accessible from a gear icon in the UI.
- Settings include:
  - **Audio file strategy**: `reference` (use original file path) or `copy` (copy to library folder).
  - **Library path**: configurable directory where copied audio files are stored (defaults to `{app_data_dir}/library`).
- Settings are persisted locally (via Tauri's app data directory or a simple `settings.json` file).
- The audio file strategy affects how `create_audio_element` and import operations handle files.

## Impact

- Affected specs: `app-settings` (new)
- Affected code:
  - `src-tauri/src/lib.rs` (settings read/write commands, file copy logic)
  - `src/features/settings/` (new feature: store, component)
  - `src/App.tsx` (settings gear icon trigger)
- Dependencies: `add-reusable-modal` (settings displayed in the shared modal)
