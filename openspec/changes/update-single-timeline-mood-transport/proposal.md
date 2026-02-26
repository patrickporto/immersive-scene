# Change: Update Mood Timeline and Unified Transport

## Why

The current flow allows multiple timelines per mood, splits transport controls between timeline and bottom bar, and ties playback labels to selected context instead of actual playback context. This creates confusion during live use and makes mood transitions and arrangement behavior less predictable.

## What Changes

- Enforce exactly one timeline per mood and remove multi-timeline selection UX.
- Add mood-to-mood crossfade playback behavior when switching active mood during playback.
- Move the timeline panel below the bottom player and keep it visually discrete with expand/collapse behavior.
- Unify play/pause/stop controls into a single transport entry point (bottom player) and remove duplicated timeline transport controls.
- Prevent clip overlap inside the same track (hard collision rule on create/move).
- Update bottom player metadata to show the soundset/mood that is currently playing, not only the currently selected entities.

## Impact

- Affected specs: `mood-timelines`, `bottom-player`, `audio-playback`
- Affected code:
  - `src/features/audio-engine/components/TimelineEditor.tsx`
  - `src/features/mixer/components/BottomPlayer.tsx`
  - `src/features/audio-engine/stores/audioEngineStore.ts`
  - `src/features/sound-sets/stores/timelineStore.ts`
  - `src-tauri/src/lib.rs` (timeline uniqueness and overlap validation)
