## Context

The frontend had a concentration of complex logic and large JSX trees inside single files, especially in audio-engine timeline and mixer areas. The change focuses on structural refactoring without changing product behavior.

## Goals / Non-Goals

- Goals:
  - Reduce component size and complexity in critical files
  - Enforce one-component-per-file for feature components
  - Extract orchestration logic into reusable hooks
  - Preserve existing interactions and playback behavior
- Non-Goals:
  - Redesigning the UI visual language
  - Introducing new user-facing timeline capabilities
  - Refactoring `src/shared/components/Icons.tsx` icon registry in this wave

## Decisions

- Decision: Split `AudioUploader`, `TimelineEditor`, `MixerPanel`, and `SoundSetBrowser` into focused components.
  - Rationale: Immediate reduction in file size and easier testing boundaries.
- Decision: Extract audio preload/upload behavior into hooks.
  - Rationale: Keep view components focused on rendering and interactions.
- Decision: Preserve icon registry as a documented exception for this phase.
  - Rationale: Avoid broad churn in shared icon usage.

## Risks / Trade-offs

- Risk: Refactor regressions in drag/playback interactions.
  - Mitigation: Keep logic parity and validate with lint/typecheck/tests.
- Risk: More files increase navigation overhead initially.
  - Mitigation: Use feature-local component naming and clear file boundaries.

## Migration Plan

1. Extract reusable subcomponents from large files.
2. Move upload/preload orchestration to hooks.
3. Replace old monolithic components with composition entry points.
4. Validate and mark tasks complete.
