## ADDED Requirements

### Requirement: Sidecar PCM Ingress Contract

The system SHALL send Discord-bound PCM to the Node sidecar through a bounded IPC contract with fixed pacing semantics.

#### Scenario: Producer temporarily outruns sidecar consumer

- **WHEN** PCM production exceeds the sidecar send rate for a short interval
- **THEN** bounded buffering and explicit backpressure policy are applied without unbounded memory growth

### Requirement: Sidecar Jitter Handling

The system SHALL implement jitter absorption in the sidecar to prevent burst-drain playback behavior.

#### Scenario: IPC jitter spike from desktop app

- **WHEN** sidecar ingress receives packets with bursty timing
- **THEN** jitter handling preserves smoother Discord egress within configured buffering limits

### Requirement: Sidecar Streaming Telemetry

The system SHALL expose Discord streaming telemetry produced by the sidecar for continuity diagnostics.

#### Scenario: Investigating degraded Discord audio session

- **WHEN** operators inspect telemetry after reported choppiness
- **THEN** telemetry includes queue depth/capacity, underruns, dropped frames, reconnect attempts, and last error

### Requirement: Recovery Without Transport Freeze

The system SHALL recover sidecar/voice disruptions asynchronously without freezing transport controls.

#### Scenario: Voice reconnect while playback controls are used

- **WHEN** reconnect logic is active and the user triggers pause or stop
- **THEN** controls apply immediately in transport state while reconnect continues in background
