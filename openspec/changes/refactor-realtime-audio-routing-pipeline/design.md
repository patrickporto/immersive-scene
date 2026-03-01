## Context

The application currently performs transport control and routing updates inside the same execution paths. This creates coupling between UI responsiveness and routing/bridge state (Discord join, bridge recovery, IPC timing). Recent incidents show that packet counters can increase while audio remains choppy, indicating pacing and buffering mismatches between capture, IPC, and backend playback.

## Goals / Non-Goals

- Goals:
  - Keep `start`, `pause`, and `stop` perceptually instant regardless of routing target health.
  - Eliminate bursty packet egress and reduce underruns using explicit pacing and jitter buffering.
  - Bound memory and latency with deterministic backpressure behavior.
  - Provide actionable telemetry for transport latency and stream continuity.
- Non-Goals:
  - Changing product UX flows unrelated to transport/routing.
  - Introducing new external streaming services.
  - Rewriting the entire audio engine.

## Decisions

- Decision: Split transport control into two planes.
  - Control plane: UI emits transport intent into a non-blocking command queue.
  - Data plane: routing workers (local/Discord) consume commands and execute independently.
  - Rationale: isolates UI responsiveness from routing recovery and network variability.

- Decision: Adopt a transport state machine with monotonic command sequencing.
  - Each command gets a sequence id; workers apply only latest relevant command.
  - Coalescing rules prevent stale transitions during rapid toggles (e.g., play/pause/play).
  - Rationale: removes race conditions and stale side effects.

- Decision: Standardize audio buffering and pacing.
  - Capture in AudioWorklet at fixed frame boundaries.
  - Stage into bounded ring buffer.
  - Apply paced dequeue at fixed interval for Discord egress.
  - Maintain backend jitter buffer with underrun/overrun policy.
  - Rationale: smooths scheduler jitter and IPC burst behavior.

- Decision: Use routing-agnostic pause/stop semantics.
  - `pause` and `stop` act immediately in local engine state and mixer graph.
  - Routing workers reconcile asynchronously without blocking UI.
  - Rationale: keeps controls instant independent of bridge state.

- Decision: Add telemetry with SLO-style thresholds.
  - Track p50/p95 transport command latency, queue depth, dropped frames, underruns, reconnect attempts.
  - Rationale: enables objective quality verification and regression detection.

## Alternatives Considered

- Keep current direct invocation model and tune constants only.
  - Rejected: cannot guarantee instant controls under bridge recovery or network jitter.
- Increase queue sizes without pacing.
  - Rejected: masks jitter temporarily, increases latency, and can still burst/drain.
- Fully move transport to Rust backend.
  - Deferred: larger migration and risk; staged decoupling in current architecture is lower risk.

## Risks / Trade-offs

- Risk: More moving parts (queues/state machine) increases implementation complexity.
  - Mitigation: strict invariants, deterministic sequencing, focused tests.
- Risk: Aggressive buffering can increase latency.
  - Mitigation: bounded queues, explicit latency budget, telemetry-driven tuning.
- Risk: Pacing interval mismatch with Discord internals.
  - Mitigation: configurable pacing constants and soak testing under CPU contention.

## Migration Plan

1. Introduce transport state machine + command queue behind current APIs.
2. Add pacing/jitter buffers with conservative defaults.
3. Enable telemetry and compare against baseline under scripted scenarios.
4. Tune queue and pacing constants to meet latency and continuity targets.
5. Remove deprecated direct-coupled paths after parity validation.

## Open Questions

- None. The proposal defines measurable acceptance criteria and bounded architecture changes.
