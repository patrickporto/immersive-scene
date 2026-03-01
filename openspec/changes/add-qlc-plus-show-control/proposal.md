# Change: Add QLC+ Show Control Integration

## Why

For RPG sessions, audio alone is not enough to deliver full immersion. Lighting and effects must be orchestrated with the same precision as timeline audio, with fast operator control during live narration. Integrating QLC+ provides a professional lighting engine while keeping Immersive Scene as the single creative console.

## What Changes

- Add a dedicated **QLC+ section in Settings** to configure API endpoint and connection profile (transport, authentication token when required, request timeout, auto-reconnect policy).
- Add a **QLC+ Function Browser** that lists available QLC+ functions with search, filtering by type, and quick actions.
- Add direct **function interaction controls** (run, stop, flash/toggle, and parameter controls when a function supports them).
- Add **drag-and-drop from QLC+ Function Browser to timeline tracks**, creating scheduled QLC+ cues that execute according to timeline time.
- Add execution safeguards: connection health state, retry behavior, cue-level error visibility, and transport stop behavior that can optionally send a global stop/panic command to QLC+.
- Add cue metadata optimized for live storytelling workflows (label, notes, tags like `combat`, `mystery`, `boss`, and optional intensity marker).

## Impact

- Affected specs:
  - `qlc-plus-settings` (new)
  - `qlc-plus-functions` (new)
  - `qlc-plus-timeline-automation` (new)
- Affected code:
  - `src/features/settings/components/SettingsModal.tsx`
  - `src/features/settings/stores/settingsStore.ts`
  - `src/features/audio-engine/components/TimelineEditor.tsx`
  - `src/features/audio-engine/components/TimelineTrackLane.tsx`
  - `src/features/sound-sets/stores/timelineStore.ts`
  - `src-tauri/src/lib.rs` (or split modules for QLC+ commands and transport)
  - New QLC+ integration service in frontend + backend bridge layer
- External dependency:
  - QLC+ Web API/Virtual Console endpoint availability and API compatibility
