# Change: Add Track Looping and Audio Element Groups

## Why

Currently, timeline loop mode is all-or-nothing: the entire timeline loops, but individual tracks cannot loop independently. In professional audio tools (Ableton Live Session View, Logic Pro, FMOD), tracks can loop independently — a background ambience track loops endlessly while an event track plays through once. This enables living, evolving soundscapes with minimal authoring effort.

Additionally, there is no way to create variation in repeated audio. Professional samplers (Kontakt, FMOD, Wwise) use "round robin" and "random" groups to pick one of several audio alternatives on each trigger, avoiding the mechanical repetition of a single sample. Users need this for footsteps, thunder, crowd murmur, and similar effects that sound unnatural when the exact same clip replays.

## What Changes

- **Per-track loop toggle**: Each timeline track gains an independent `is_looping` flag. When enabled, the track's clip sequence restarts automatically when it reaches the end of its last clip, while other tracks continue their own independent playback lifecycle. The existing timeline-level loop remains as a convenience shortcut that toggles all tracks simultaneously.
- **Audio Element Group** (new entity): A named container holding multiple audio elements. On playback, exactly one element is selected randomly from the group (no immediate repeats of the same element). The group can be:
  - Used as a **global one-shot** (triggered directly from the One Shots panel).
  - Placed as a **timeline clip** (occupies a slot on a track; the random pick happens at each trigger).
- **Group management UI**: Create, rename, and manage groups; drag-and-drop audio files into a group; visually distinguish groups from single elements.

## Impact

- Affected specs: `mood-timelines` (track looping), `element-groups` (new), `global-oneshots` (group one-shot support)
- Affected code:
  - `src/features/sound-sets/stores/timelineStore.ts` (track `is_looping` field)
  - `src/features/audio-engine/stores/audioEngineStore.ts` (per-track loop scheduling, group random selection logic)
  - `src/features/sound-sets/stores/globalOneShotStore.ts` (group one-shot support)
  - `src/features/audio-engine/components/TimelineTrackLane.tsx` (track loop toggle UI)
  - `src/features/audio-engine/components/TimelineEditor.tsx` (track loop indicators)
  - `src-tauri/src/lib.rs` (new database tables for groups, track `is_looping` column, CRUD commands)
  - New components for group management UI
