## Context

This change overhauls how audio elements relate to moods and soundsets. Currently, elements strictly belong to a mood. To allow element reuse and advanced sequencing, elements need to move to the soundset level, and moods will rely on timelines to define playback logic.

## Goals / Non-Goals

- Goals:
  - Global soundset elements accessible in any mood.
  - Drag-to-convert for one-shots.
  - Clear, visually pleasing playback state.
  - Optional timelines for precise element sequencing.
  - Smooth crossfading between timelines.
- Non-Goals:
  - Full Digital Audio Workstation (DAW) capabilities (e.g., precise waveform envelope editing).
  - Automation curves for volume/effects (outside of basic crossfades).

## Decisions

- Decision: **Move Audio Elements to SoundSet level**
  - Rationale: The requirement states "all audio elements must be present in all moods of the soundset they were added to." Making the foreign key point to `sound_set_id` achieves this cleanly without duplication.
- Decision: **Timelines as an optional abstraction within Moods**
  - Rationale: To avoid confusing simple use cases, Timelines are an advanced feature. Elements can still just loop continuously if the user opts not to use a timeline.
- Decision: **Crossfading implemented via AudioContext GainNodes**
  - Rationale: Transitioning gain values between the active timeline's master gain and the incoming timeline's master gain provides smooth audio crossfades natively.

## Risks / Trade-offs

- Risk: Complex data migration for existing `audio_elements`.
  - Mitigation: Create a backend migration script that looks up the `sound_set_id` from the existing `mood_id` of each element.
- Risk: Timeline state management might become overly complex for the React frontend.
  - Mitigation: Keep the timeline state flat (e.g., `TimelineTrack` with `startTime` and `duration`) and use a linear playback cursor model.

## Migration Plan

1. Create a database migration to alter `audio_elements`, replacing `mood_id` with `sound_set_id`.
2. Update Tauri backend commands to reflect the new queries and parameter structures.
3. Update standard Play/Pause logic to handle loose elements globally in the soundset.
4. Add the timeline data structures and UI as an iterative phase.
