## 1. Backend — Settings Persistence

- [ ] 1.1 Create `settings.json` schema with `audio_file_strategy` and `library_path` fields
- [ ] 1.2 Implement `get_app_settings` Tauri command (reads from app data dir, returns defaults if missing)
- [ ] 1.3 Implement `update_app_settings` Tauri command (writes to app data dir)
- [ ] 1.4 Create `ensure_library_dir` helper that creates the library directory if it doesn't exist

## 2. Backend — File Strategy Integration

- [ ] 2.1 Update `create_audio_element` to check the file strategy:
  - If `copy`: copy the source file to `{library_path}/{filename}` and store the library path
  - If `reference`: store the original file path as-is
- [ ] 2.2 Update import flow to respect file strategy

## 3. Frontend — Settings Feature

- [ ] 3.1 Create `src/features/settings/` feature folder with store and component
- [ ] 3.2 Create `settingsStore.ts` with load/save actions
- [ ] 3.3 Create `SettingsModal.tsx` using the shared Modal component
  - Radio/toggle for audio file strategy
  - Directory picker for library path
- [ ] 3.4 Add gear icon to `App.tsx` UI that opens the settings modal

## 4. Validation

- [ ] 4.1 Manual test: open settings → change strategy to "copy" → add new element → verify file is copied to library
- [ ] 4.2 Manual test: change strategy to "reference" → add new element → verify original path is used
- [ ] 4.3 Manual test: change library path → verify new elements go to the new path
