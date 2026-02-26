## Context

This change reshapes timeline and playback behavior across persistence, scheduler logic, and shell layout. It narrows data model flexibility (single timeline per mood), introduces transport-driven mood transitions, and updates playback context ownership for UI labels.

## Goals / Non-Goals

- Goals:
  - Guarantee one timeline per mood.
  - Provide smooth crossfade between currently playing mood and next mood.
  - Centralize play/pause/stop in bottom player.
  - Keep timeline available but visually subtle and collapsible below transport.
  - Enforce non-overlap per track.
  - Show true playback context in bottom player metadata.
- Non-Goals:
  - Multi-timeline authoring per mood.
  - Advanced conflict resolution (auto-ripple, auto-trim) for overlaps.
  - New mixing automation model.

## Decisions

- Decision: Keep timeline identity as a mood-owned singleton.
  - Rationale: Matches requested UX and removes timeline picker complexity.
- Decision: Persist and expose `activePlaybackContext` (`soundSetId`, `soundSetName`, `moodId`, `moodName`, `timelineId`) in audio engine store.
  - Rationale: UI must reflect what is audibly playing, not only selected state.
- Decision: Crossfade on mood transition is transport-driven and uses scheduler/gain automation.
  - Rationale: Makes transitions predictable and independent of component-level play buttons.
- Decision: Track overlap enforcement is validated both in client and backend.
  - Rationale: Prevents invalid state from drag races and stale clients.
- Decision: Timeline panel remains collapsible and low-emphasis, mounted below bottom player container.
  - Rationale: Keeps timeline accessible without competing with transport prominence.

## Risks / Trade-offs

- Existing moods with multiple timelines require deterministic migration.
  - Mitigation: choose canonical timeline per mood and re-link track elements; archive extras.
- Layout move could impact desktop viewport and drag interactions.
  - Mitigation: keep single scroll parent around drop zones and add interaction tests.
- Crossfade between moods can overlap many sources simultaneously.
  - Mitigation: cap fade window and rely on scheduled stop for outgoing mood.

## Migration Plan

1. Add backend constraint/logic so each mood has exactly one active timeline.
2. Migrate existing duplicate timelines by selecting canonical timeline per mood and moving/removing extras.
3. Remove timeline list UX and auto-bind editor to mood singleton timeline.
4. Move timeline panel below bottom player and keep collapsed-by-default behavior.
5. Route all transport actions through bottom player and set playback context from scheduler.
6. Add overlap guards for create/move operations (client + backend).

## Open Questions

- Canonical timeline migration rule: oldest timeline vs newest timeline when duplicates exist.
- Default crossfade duration for mood transitions.
