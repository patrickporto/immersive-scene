## ADDED Requirements

### Requirement: Paced Discord Audio Egress

The system SHALL send Discord-bound audio with fixed pacing semantics to prevent bursty packet delivery and playback stutter.

#### Scenario: IPC jitter spike during playback

- **WHEN** frontend-to-backend IPC latency temporarily increases
- **THEN** pacing logic preserves smooth output and avoids burst-drain behavior at the Discord sender

### Requirement: Bounded Buffering and Backpressure

The system SHALL implement bounded capture and transport buffers with explicit backpressure policy to prevent unbounded growth and unstable latency.

#### Scenario: Producer temporarily outruns consumer

- **WHEN** capture produces frames faster than sender can flush
- **THEN** the system applies defined backpressure behavior while keeping memory bounded and latency controlled

#### Scenario: Short consumer stall

- **WHEN** sender stalls briefly under load
- **THEN** jitter buffer absorbs the stall and playback continuity is preserved within configured limits

### Requirement: Bridge Recovery Without Audio Engine Freeze

The system SHALL recover Discord bridge disruptions asynchronously without freezing transport controls or tearing down valid local transport state.

#### Scenario: Bridge disconnect while playing

- **WHEN** Discord bridge disconnects during active playback
- **THEN** recovery runs in background, controls remain responsive, and playback state is preserved according to latest transport command

### Requirement: Streaming Quality Telemetry

The system SHALL expose telemetry for continuity and quality diagnostics, including queue depth, underruns, dropped frames, and recovery counts.

#### Scenario: Quality regression investigation

- **WHEN** operators inspect streaming telemetry after a choppy session
- **THEN** they can identify whether cuts were caused by underrun, overrun/backpressure, pacing drift, or reconnect churn
