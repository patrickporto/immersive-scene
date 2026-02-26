# Change: Add SoundSet Import/Export

## Why

Users need to share and back up their soundsets. A portable archive format containing all audio files and metadata enables soundset distribution between users and provides disaster recovery for creative work.

## What Changes

- Add **export** functionality that packs a SoundSet into a ZIP archive containing:
  - A JSON metadata file with soundset info, moods, audio channels, timeline, tracks, mixed elements (clips), and volume levels.
  - All audio files referenced by elements in the soundset.
  - **Exclusion**: Global one-shot elements are NOT included in the export (they are independent of any soundset).
- Add **import** functionality that unpacks a ZIP archive, recreates the soundset, its moods, channels, timelines, tracks, and mixed elements, and copies the audio files to the local library.
- Expose import/export actions via the UI (e.g., context menu on a soundset or toolbar buttons).

## Impact

- Affected specs: `soundset-export` (new)
- Affected code:
  - `src-tauri/src/lib.rs` (new commands: `export_sound_set`, `import_sound_set`)
  - `src/features/sound-sets/stores/soundSetStore.ts` (import/export actions)
  - `src/features/sound-sets/components/SoundSetBrowser.tsx` (UI triggers)
- Dependencies:
  - Rust: `zip` crate for archive creation/extraction
  - `add-audio-channels` (channels are part of export data)
  - `add-app-settings` (library path needed for import destination)
