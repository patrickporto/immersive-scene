## Context

This change introduces two related but distinct capabilities: per-track independent looping and audio element groups with random selection. Both features span frontend UI, state stores, audio scheduling, and backend persistence. The design draws from professional audio production patterns — Ableton Live's Session View for independent track looping, and Kontakt/FMOD's round-robin/random groups for variation.

## Goals / Non-Goals

- Goals:
  - Per-track `is_looping` flag so individual tracks loop independently
  - Timeline-level loop remains as a convenience toggle for all tracks
  - Audio Element Group entity that holds N audio elements and selects one randomly on each trigger
  - No-immediate-repeat logic (don't play the same element twice in a row)
  - Groups usable as global one-shots or as timeline clips
  - Drag-and-drop audio files into groups
  - Clear visual distinction between groups and single elements
- Non-Goals:
  - Follow Actions (Ableton-style chain triggers between clips)
  - Velocity layers or velocity-based sample selection
  - Round-robin mode (sequential cycling) — random only in v1
  - Weighted probability per element within a group

## Decisions

- Decision: Per-track looping rather than per-clip looping.
  - Rationale: Matches the DAW-inspired UX where a track contains a sequence of clips that replays as a unit. Clip-level looping can be added later. The existing per-element `isLooping` in `AudioSource` is separate and applies to free-play mode, not timeline scheduled playback.
- Decision: Timeline-level loop acts as a shortcut to toggle `is_looping` on all tracks.
  - Rationale: Preserves existing behavior while adding finer granularity. When timeline loop is toggled on, all tracks loop; individual tracks can then be toggled off. Current `Timeline.is_looping` field still exposed but now controls all tracks simultaneously.
- Decision: Track looping restarts the track's clip sequence from its first clip's `start_time_ms` when the last clip finishes.
  - Rationale: Simple and predictable. The track effectively repeats its entire content. The track duration is derived from its last clip's end time (`start_time_ms + duration_ms` of the last clip).
- Decision: Audio Element Group stored as a new database entity (`element_groups` table) with a join table (`element_group_members`).
  - Rationale: Clean relational model; groups can reference any existing audio elements. A group can optionally belong to a SoundSet (`sound_set_id` nullable) for global one-shot groups.
- Decision: Random selection uses "no-immediate-repeat" algorithm.
  - Rationale: Avoids the obvious mechanical feel of replaying the same sample. When a group has only 1 element, it always plays that element. When it has 2+ elements, the engine excludes the last-played element from the random pool.
- Decision: Groups can be placed on timeline tracks exactly like single elements.
  - Rationale: Minimal data model change — `TimelineElement` gets an optional `element_group_id` alongside the existing `audio_element_id`. When `element_group_id` is set, the scheduler resolves the group at trigger time.
- Decision: Group one-shot triggers use the same playback path as single elements.
  - Rationale: The audio engine already handles one-shot playback; groups simply add a resolution step before the existing `play` call.

## Risks / Trade-offs

- Track looping adds scheduling complexity: each looping track needs independent loop scheduling alongside other non-looping tracks.
  - Mitigation: Each track maintains its own loop timer/callback. `crossfadeToTimeline` already schedules per-element; extending to per-track loop boundary is incremental.
- Group random state needs to persist per-playback-session (last-played tracking), but not across restarts.
  - Mitigation: Track last-played in-memory only (in the audio engine store). No database persistence needed.
- Groups on timelines can cause unpredictable duration if elements in a group have different durations.
  - Mitigation: When placing a group on a timeline, `duration_ms` is set explicitly by the user (or defaults to the longest element). The scheduler plays the selected element for that duration, truncating or padding with silence as needed.

## Migration Plan

1. Add `is_looping` column to `timeline_tracks` table (default `false`).
2. Create `element_groups` and `element_group_members` tables.
3. Add `element_group_id` nullable column to `timeline_elements` table.
4. Add backend CRUD commands for groups and members.
5. Update frontend stores and scheduling logic.
6. Ship new UI components for group management and track loop toggle.

## Open Questions

- Should element groups also support a "round-robin" mode (sequential cycling) in v1 or defer to a future change?
- Maximum number of elements per group (practical limit for UX)?
