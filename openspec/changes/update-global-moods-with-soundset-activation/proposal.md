# Change: Update SoundSets to Activation-Based Global Mood Sources

## Why

The current model couples moods to a single soundset, which limits creative composition and makes import/export too broad. Users need soundsets to behave like reusable content packs that can be turned on/off, while moods remain global compositions that can mix elements from multiple packs.

## What Changes

- Redefine SoundSets as independent audio source packages with explicit `enabled/disabled` state.
- Decouple SoundSet import/export from moods:
  - Export only package data (soundset metadata, channels, elements, groups, and referenced audio files).
  - Do not include moods, timelines, tracks, or clips in SoundSet packages.
- Make moods global (not owned by a single soundset), allowing one mood to use elements from multiple enabled soundsets at the same time.
- Introduce UX for source activation and discoverability:
  - A dedicated SoundSet activation area with fast enable/disable toggles.
  - Element library and timeline pickers filtered by enabled soundsets.
  - Clear "source" labels on elements and clips, plus missing-source warnings when a source is disabled.
- Define migration behavior for existing data where moods currently reference `sound_set_id`.

## Impact

- Affected specs:
  - `soundset-activation` (new)
  - `global-mood-composition` (new)
  - `soundset-package-management` (new)
- Affected code (expected):
  - `src-tauri/src/lib.rs` (schema migration, import/export command scope, enabled-state commands)
  - `src/features/sound-sets/stores/soundSetStore.ts` (activation state, global mood loading, cross-source element queries)
  - `src/features/sound-sets/components/SoundSetBrowser.tsx` (activation UX and import/export entry points)
  - `src/features/audio-engine/components/AudioUploader.tsx` and timeline UI (enabled-source filtering and source badges)
- Related in-progress changes:
  - `add-soundset-import-export` (this proposal narrows package scope and supersedes mood-coupled import/export behavior)
