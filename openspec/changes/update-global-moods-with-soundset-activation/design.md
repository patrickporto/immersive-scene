## Context

The current product structure treats a mood as a child of one soundset. This blocks a key creative workflow: combining assets from multiple soundsets inside the same mood. In parallel, import/export currently assumes soundsets include mood structures, which couples reusable content packages to project-specific arrangement state.

This change separates concerns:

- SoundSet: reusable content package (source library)
- Mood: global arrangement/composition that references any enabled sources

## Goals / Non-Goals

- Goals:
  - Let users enable/disable soundsets as content sources.
  - Let a single mood use elements from multiple enabled soundsets.
  - Keep import/export focused on package data, independent from mood arrangement data.
  - Preserve existing timelines/clips with safe migration and clear missing-source UX.
- Non-Goals:
  - Collaborative/cloud sync semantics.
  - Automatic conflict merging between two imported soundsets.
  - A full DAW-style source routing matrix redesign in this change.

## Decisions

- Decision: **Moods become global entities**
  - Rationale: This directly supports cross-soundset composition and removes artificial ownership constraints.

- Decision: **SoundSet activation controls source visibility, not data existence**
  - Rationale: Disable should be reversible and non-destructive. Disabling hides source elements from pickers and direct browsing without deleting clips or files.

- Decision: **Unavailable source handling uses "muted-until-restored" behavior**
  - Rationale: If a mood references an element whose source soundset is disabled, the clip remains in the timeline but is marked unavailable and skipped in playback until source re-enable.
  - UX Benefit: Users do not lose arrangement work and receive explicit recovery paths.

- Decision: **Import/export packages only source-library data**
  - Rationale: Moods are project-level arrangements and should not be embedded in reusable source packs.

## UX/UI Proposal

- Add a "Library Sources" section in the left sidebar (or soundset browser) with:
  - Toggle per soundset (`Enabled` / `Disabled`)
  - Optional quick actions: `Enable all`, `Disable all`, search/filter by name
  - Status chips showing counts (e.g., `24 elements`, `3 groups`)
- Element cards and timeline clips display source badges (`Source: Rain Pack`).
- Mood editor shows a compact warning strip when clips are unavailable due to disabled sources, with quick action: `Re-enable source`.
- Import flow lands imported soundsets in the sources list and keeps them immediately understandable via source badges and counts.
- Export action is available from source-level actions only (not mood-level actions) to reinforce conceptual separation.

## Risks / Trade-offs

- Risk: Users may disable a source and think clips were deleted.
  - Mitigation: Keep clips visible with explicit "Unavailable (source disabled)" badge and one-click recovery.

- Risk: Cross-source libraries can become noisy.
  - Mitigation: Default filter to enabled sources and provide source chips/search.

- Risk: Existing workflows rely on selecting a single soundset before selecting a mood.
  - Mitigation: Migrate UI flow to mood-first composition with source activation nearby.

## Migration Plan

1. Add `is_enabled` to soundsets (default `true`).
2. Migrate moods to global ownership (remove runtime dependence on `moods.sound_set_id`).
3. Keep existing mood/timeline/clip records; infer source availability from referenced element -> soundset mapping.
4. Introduce availability checks in playback and editing surfaces.
5. Update import/export schema version to indicate package-only scope.

## Open Questions

- No blocking open questions for proposal stage.
