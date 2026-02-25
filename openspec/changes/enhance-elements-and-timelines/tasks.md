## 1. Schema and Backend Migration

- [x] 1.1 Create database migration to change `audio_elements.mood_id` to `sound_set_id`.
- [x] 1.2 Update backend Rust commands (`create_audio_element`, `get_audio_elements`, etc.) to use `sound_set_id`.
- [x] 1.3 Update `SoundSetStore` in frontend to load elements per soundset.

## 2. Element UI and Interactions

- [x] 2.1 Refactor `AudioElementItem` UI to be visually stunning when playing (add glowing borders, smooth waveform integration, clear hierarchy).
- [x] 2.2 Implement React DnD (or similar drag-and-drop mechanics) in the elements view.
- [x] 2.3 Implement drag-to-one-shot logic (updating `channel_type` to `effects` upon drop in One Shot area).

## 3. Timeline Architecture

- [x] 3.1 Create `Timeline` and `TimelineElement` types and database tables.
- [x] 3.2 Create Tauri commands for CRUD operations on Timelines.
- [x] 3.3 Create `timelineStore` to handle timeline state and selection.

## 4. Timeline UI

- [x] 4.1 Build optional `TimelineEditor` component (advanced mode toggle).
- [x] 4.2 Implement drag-and-drop of elements from the library onto `TimelineEditor` tracks.
- [x] 4.3 Add UI for intuitively adding, removing, and reordering timelines within the active mood.

## 5. Audio Engine Integration

- [x] 5.1 Update `audioEngineStore.play` buffer logic to respect timeline `startTime` scheduling.
- [x] 5.2 Implement audio crossfade logic using `GainNode` transitions when switching between timelines.
- [x] 5.3 Enhance Bottom Bar player to sync with the active timeline's playback state and provide more functional control.
