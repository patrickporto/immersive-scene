## Context

This feature spans settings, runtime control, and timeline scheduling. It introduces a new external integration (QLC+) and must remain reliable in live sessions where interruptions break immersion.

Current timeline workflows already support drag-and-drop clip scheduling for audio. We will extend that mental model so QLC+ functions behave like first-class timeline cues while preserving real-time manual control.

## Goals / Non-Goals

- Goals:
  - Configure QLC+ endpoint and integration behavior in Settings.
  - Discover and list QLC+ functions with fast operator access.
  - Trigger QLC+ functions manually from the app.
  - Schedule QLC+ function execution through timeline drag-and-drop.
  - Provide runtime safety (health checks, retries, clear failure feedback).
- Non-Goals:
  - Full QLC+ project editing (fixture patching, universe setup, workspace authoring).
  - Replacing native QLC+ UI for advanced programming tasks.
  - Multi-controller orchestration across several QLC+ servers in v1.

## Decisions

### Decision 1: Adapter-Based QLC+ Integration Boundary

- Decision: Add a `QLC+ adapter` layer in backend commands so UI and timeline scheduler call a stable internal interface (`listFunctions`, `triggerFunction`, `stopFunction`, `setFunctionParameter`, `panic`).
- Rationale: Keeps vendor-specific protocol details isolated, enables future protocol upgrades without rewriting timeline/business logic.
- Alternatives considered:
  - Direct API calls from UI components: faster initially, but would spread protocol knowledge and error handling across components.

### Decision 2: Persisted QLC+ Integration Profile in App Settings

- Decision: Store QLC+ endpoint and integration options in `settings.json` with explicit validation and defaults.
- Rationale: Matches current app settings patterns and gives deterministic startup behavior.
- Alternatives considered:
  - Session-only settings: poor UX for live setups that need repeatability.

### Decision 3: Unified Cue Model for Timeline

- Decision: Introduce a timeline cue type for QLC+ events in the existing timeline domain model, rather than creating a parallel scheduler.
- Rationale: Avoids duplicated transport semantics and keeps drag/drop + playback mental model consistent.
- Alternatives considered:
  - Separate lighting timeline panel: adds synchronization complexity and fragments operator workflow.

### Decision 4: Live-Session Safety Defaults

- Decision: Default behavior on transport stop is to stop scheduled QLC+ functions started by the active timeline run; optional global panic is configurable.
- Rationale: Prevents stale lighting states between scenes while preserving operator control.
- Alternatives considered:
  - Never auto-stop: risky in RPG sessions where scene transitions are frequent.

## Risks / Trade-offs

- QLC+ API compatibility differences by version.
  - Mitigation: define minimum supported API contract and surface incompatibility clearly in settings health check.
- Network instability causing delayed cues.
  - Mitigation: per-cue status, bounded retries, and deterministic timeout handling.
- Expanded timeline complexity.
  - Mitigation: keep one cue model and reuse existing lane interaction patterns.

## Migration Plan

1. Extend app settings schema with QLC+ configuration fields and defaults.
2. Add backend adapter commands and health check endpoint.
3. Add frontend QLC+ function browser and manual interaction controls.
4. Extend timeline data model for QLC+ cues and drag/drop placement.
5. Integrate playback scheduler execution + stop/panic handling.
6. Add automated tests and manual rehearsal checklist.

## Open Questions

1. Which QLC+ API authentication modes are required for v1 (none, token, both)?
2. Should timeline start send a scene reset command before first cue by default?
3. Should panic be global-only, or scoped to cues started by Immersive Scene?

## Recommended Next Iteration (Post-v1)

- Cue templates (e.g., `Combat Enter`, `Boss Reveal`, `Calm Tavern`) with prefilled audio + lighting bundles.
- Beat or bar quantization mode for cue start snapping.
- Rehearsal mode with simulated timeline run and dry-run QLC+ calls.
- Live quick palette (hotkeys/stream deck style) for manual overrides during narration.
