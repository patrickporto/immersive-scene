## 1. Baseline and Instrumentation

- [x] 1.1 Capture baseline metrics for transport latency (`start`, `pause`, `stop`) across local and Discord routing.
- [x] 1.2 Add structured telemetry fields for queue depth, underruns, dropped frames, and reconnect attempts.

## 2. Transport Control Decoupling

- [x] 2.1 Introduce a non-blocking transport command queue in the audio engine store.
- [x] 2.2 Implement a deterministic transport state machine with command sequencing and coalescing.
- [x] 2.3 Ensure UI handlers dispatch intent without awaiting routing operations.

## 3. Routing and Streaming Reliability

- [x] 3.1 Refactor routing workers so pause/stop apply immediately in mixer state, independent of Discord health.
- [x] 3.2 Implement bounded capture/ring buffering between AudioWorklet and IPC.
- [x] 3.3 Implement paced egress to Discord and backend jitter buffering with explicit backpressure policy.
- [x] 3.4 Ensure bridge recovery does not tear down active transport state or block controls.

## 4. Validation

- [x] 4.1 Add tests for rapid control sequences (play/pause/play, stop/start, pause/stop) under routing transitions.
- [x] 4.2 Add soak test scenario under CPU load to verify no sustained choppy output and bounded queue growth.
- [x] 4.3 Verify transport control latency SLOs and continuity thresholds from telemetry.
- [x] 4.4 Run `npm run lint:fix`, `npm run typecheck`, and `cargo check` before delivery.
