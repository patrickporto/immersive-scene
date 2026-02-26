## 1. Backend — Export

- [x] 1.1 Add `zip` crate to `Cargo.toml`
- [x] 1.2 Implement `export_sound_set` Tauri command that:
  - Queries all soundset data (channels, elements, moods, timelines, tracks, clips)
  - Filters out global one-shot elements
  - Builds `manifest.json`
  - Copies audio files into ZIP archive
  - Saves ZIP to user-chosen path (via Tauri file dialog)

## 2. Backend — Import

- [x] 2.1 Implement `import_sound_set` Tauri command that:
  - Opens ZIP from user-chosen path
  - Parses `manifest.json`
  - Creates SoundSet, channels, elements (copying audio files to library), moods, timelines, tracks, clips
  - Handles name collision (append suffix)

## 3. Frontend — UI & Store

- [x] 3.1 Add `exportSoundSet` and `importSoundSet` actions to `soundSetStore.ts`
- [x] 3.2 Add export/import buttons to `SoundSetBrowser` (context menu or toolbar)
- [x] 3.3 Show progress/loading feedback during export/import

## 4. Validation

- [ ] 4.1 Manual test: export a soundset → verify ZIP contents (manifest.json + audio files)
- [ ] 4.2 Manual test: import the exported ZIP → verify soundset recreated with all data
- [ ] 4.3 Manual test: verify global one-shots are NOT in the exported archive
