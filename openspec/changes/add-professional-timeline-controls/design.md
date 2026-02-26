## Context

This change introduces professional timeline editing behaviors into an existing audio scene builder. The solution spans frontend timeline UI, state stores, audio scheduling, and backend persistence, and must preserve existing soundset/mood workflows.

## Goals / Non-Goals

- Goals:
  - Precise clip start-time positioning on tracks
  - Visible timeline gaps (intentional silence)
  - Loop playback for an entire timeline
  - Easy track add/remove/reorder operations
  - Clear playback state visibility in element cards and bottom bar
  - Soundset-level element reuse across moods
  - Drag-to-one-shot conversion flow
  - Crossfade support for timeline transitions
- Non-Goals:
  - Full DAW feature parity (automation lanes, time-stretching, pitch editing)
  - Real-time collaboration
  - Destructive waveform editing

## Decisions

- Decision: Represent timeline content as tracks containing clips with `startMs`, `durationMs`, and `elementId`.
  - Rationale: Simple structure for deterministic scheduling and rendering.
- Decision: Use absolute timeline coordinates for scheduling, not relative clip chaining.
  - Rationale: Enables drag/drop anywhere, easy gap creation, and direct scrub/playhead math.
- Decision: Loop mode is timeline-level (`isLooping`), not clip-level.
  - Rationale: Matches user request for repeating the full sequence.
- Decision: Bottom bar controls timeline playback when a timeline is active; otherwise controls free element playback.
  - Rationale: Preserves current behavior while adding timeline master control.
- Decision: Crossfade implemented through gain automation between outgoing and incoming scheduled sources.
  - Rationale: Uses Web Audio primitives with predictable transitions.

## Risks / Trade-offs

- Scheduling drift and timing precision issues under heavy UI load.
  - Mitigation: Use AudioContext clock scheduling and buffer lookahead.
- Complexity in drag-and-drop interactions (clips, tracks, one-shots).
  - Mitigation: Start with constrained interactions and clear drop targets.
- Backward compatibility with current element ownership and mood data.
  - Mitigation: Add migration path and compatibility read logic.

## Migration Plan

1. Introduce/confirm soundset-level element ownership and migrate existing records.
2. Add timeline tables for tracks and clips with start-time fields.
3. Implement read/write commands with fallback handling for older data.
4. Ship timeline UI in advanced mode and keep legacy path available during rollout.
5. Enable bottom bar timeline controls and loop support.

## Open Questions

- Default timeline time unit in UI (ms only vs mixed mm:ss + frames).
- Crossfade default duration and allowed range.
- Maximum clip overlap policy per track (allow overlap vs enforce one clip at a time per track).
