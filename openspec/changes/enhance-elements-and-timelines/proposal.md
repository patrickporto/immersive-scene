# Change: Enhance Elements and Add Timelines

## Why

Currently, elements are tied directly to moods and cannot be easily reused across a SoundSet without duplication. The user experience lacks visual clarity on what is playing, and there is no way to sequence elements precisely. Advanced users need timelines to trigger elements at specific moments and create seamless transitions between different states.

## What Changes

- **BREAKING**: Audio elements will belong to a `SoundSet` rather than a `Mood`, making them available across all moods within that set.
- All audio elements become playable directly from the SoundSet library.
- Elements can be dragged and dropped into a "One Shots" section to convert their channel type to `effects`.
- The element component UI will be improved to make playing states visually obvious and aesthetically pleasing.
- Introduce an optional Timeline feature within Moods:
  - Users can drag and drop elements into a timeline.
  - Timelines support visualizing and positioning elements to play at specific times (concurrently or sequentially).
  - Users can easily add, remove, and reorder timelines.
  - Support crossfading between timelines.
- Enhance the bottom bar Play button to handle timeline playback and provide more control.

## Impact

- Affected specs: `soundset-elements`, `mood-timelines`
- Affected code:
  - `src/features/sound-sets/stores/soundSetStore.ts`
  - `src/features/audio-engine/stores/audioEngineStore.ts`
  - `src/features/audio-engine/components/AudioUploader.tsx`
  - Backend database schema (`audio_elements` table `mood_id` -> `sound_set_id`)
