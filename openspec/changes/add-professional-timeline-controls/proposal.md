# Change: Add Professional Timeline Controls

## Why

The current audio workflow does not provide a professional timeline editing experience for scheduling clips with precise start times, intentional silence between clips, and loopable timeline playback. Users also need clearer playback feedback, stronger bottom bar controls, and reusable element behavior across moods to build reliable scene sequences.

## What Changes

- Add timeline clip scheduling with explicit start time placement per track (video-editor style timeline behavior).
- Allow empty space (gaps/silence) between clips and preserve those gaps during playback.
- Add timeline loop mode so a whole timeline can repeat continuously.
- Improve track management UX to make adding, removing, and reordering tracks easy.
- Improve element UX so playing state is visually obvious and all elements can be triggered directly.
- Keep soundset elements available in all moods within that soundset.
- Allow drag-and-drop conversion of elements into one-shots.
- Expand bottom bar play behavior to control timeline playback states (play/pause/stop/loop context and timeline state visibility).
- Add crossfade behavior between tracks/timelines where applicable.

## Impact

- Affected specs: `mood-timelines`, `soundset-elements`, `bottom-player`
- Affected code:
  - `src/features/audio-engine/components/AudioUploader.tsx`
  - `src/features/audio-engine/stores/audioEngineStore.ts`
  - `src/features/mixer/components/BottomPlayer.tsx`
  - `src/features/sound-sets/stores/soundSetStore.ts`
  - timeline-related stores/components and Tauri commands
  - database schema for timeline tracks and scheduled clips
