## 1. Backend - Data Model and Migration

- [ ] 1.1 Add `is_enabled` field to `sound_sets` with default `true` and migration coverage for existing databases.
- [ ] 1.2 Introduce global mood model support (remove query/command dependency on `moods.sound_set_id`).
- [ ] 1.3 Add backend queries/commands to list and update SoundSet activation state.
- [ ] 1.4 Ensure timeline/clip loading marks clips as unavailable when their source soundset is disabled.

## 2. Backend - Package Import/Export Scope Update

- [ ] 2.1 Update SoundSet export to include only source package data (soundset metadata, channels, elements, groups, audio files).
- [ ] 2.2 Remove moods/timelines/tracks/clips from export manifest.
- [ ] 2.3 Update SoundSet import to restore only source package data, independent from mood creation.
- [ ] 2.4 Bump and validate package `format_version` for new scope semantics.

## 3. Frontend - Source Activation UX

- [ ] 3.1 Add a "Library Sources" management UI with per-soundset enable/disable toggles.
- [ ] 3.2 Add source-aware filtering so element browser and timeline pickers show assets from enabled soundsets only.
- [ ] 3.3 Add source badges on element cards and timeline clips.
- [ ] 3.4 Add unavailable-source warnings with one-click recovery action (`Re-enable source`).

## 4. Frontend - Global Mood Flow

- [ ] 4.1 Update mood loading/selection to be global and independent from selected soundset.
- [ ] 4.2 Ensure mood composition supports clips/elements from multiple soundsets concurrently.
- [ ] 4.3 Update SoundSet browser actions so import/export are clearly source-level operations.

## 5. Validation

- [ ] 5.1 Add/adjust backend tests for migration, activation toggling, and package scope.
- [ ] 5.2 Add/adjust frontend tests for source toggles, filtering, badges, and unavailable-source UX.
- [ ] 5.3 Manual test: create mood with elements from 2+ soundsets, disable one source, verify clips become unavailable but remain visible.
- [ ] 5.4 Manual test: re-enable source and verify clips become playable again without remapping.
- [ ] 5.5 Manual test: export/import soundset and verify moods are not included, while package assets are preserved.
- [ ] 5.6 Run `openspec validate update-global-moods-with-soundset-activation --strict`.
