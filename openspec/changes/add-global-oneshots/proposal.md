# Change: Add Global One-Shots

## Why

One-shot audio elements (like sound effects triggered by the GM) should exist independently of any soundset. Currently, elements are always tied to a SoundSet, making it awkward to create standalone sound effects. Users need a dedicated section to create, manage, and trigger global one-shots without affecting soundset-scoped elements or mixed elements (timeline clips).

## What Changes

- Introduce a **Global One-Shot** entity — an audio element with `sound_set_id = NULL` that lives outside any soundset.
- Add a dedicated "One Shots" section in the UI (within the sidebar or as a separate panel) where users can directly create, play, and delete global one-shots.
- Deleting a global one-shot MUST NOT affect any audio used in mixed elements (timeline clips), and vice versa — deleting a mixed element clip does not remove a global one-shot's audio.
- Global one-shots are NOT included in soundset exports.

## Impact

- Affected specs: `global-oneshots` (new)
- Affected code:
  - `src-tauri/src/lib.rs` (allow `sound_set_id = NULL` for global one-shots, new CRUD commands)
  - `src/features/sound-sets/stores/soundSetStore.ts` or new `globalOneShotStore.ts`
  - `src/features/sound-sets/components/SoundSetBrowser.tsx` (one-shot section)
  - `src/features/audio-engine/stores/audioEngineStore.ts` (playback support)
