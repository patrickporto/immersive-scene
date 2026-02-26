## 1. Backend

- [x] 1.1 Alter `audio_elements` table to allow `sound_set_id` = NULL
- [x] 1.2 Implement `create_global_oneshot` Tauri command (inserts with `sound_set_id = NULL`)
- [x] 1.3 Implement `get_global_oneshots` Tauri command (query `WHERE sound_set_id IS NULL`)
- [x] 1.4 Implement `delete_global_oneshot` Tauri command (deletes only if `sound_set_id IS NULL`)
- [x] 1.5 Ensure deleting a global one-shot does NOT cascade to timeline elements referencing the same audio file

## 2. Frontend — Store

- [x] 2.1 Create `globalOneShotStore.ts` with CRUD actions and state
- [x] 2.2 Add playback support for global one-shots in `audioEngineStore.ts`

## 3. Frontend — UI

- [x] 3.1 Add "One Shots" section in `SoundSetBrowser.tsx` (or a separate panel)
- [x] 3.2 Add "Create One Shot" button that opens file picker directly
- [x] 3.3 Show play/stop controls for each one-shot

## 4. Validation

- [x] 4.1 Manual test: create a global one-shot → verify it appears outside any soundset
- [x] 4.2 Manual test: delete a global one-shot → verify mixed elements are unaffected
- [x] 4.3 Manual test: delete a mixed element clip → verify global one-shots are unaffected
- [x] 4.4 Manual test: export a soundset → verify global one-shots are NOT in the archive
