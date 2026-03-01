## ADDED Requirements

### Requirement: Non-Blocking Transport Dispatch

The system SHALL dispatch `start`, `pause`, and `stop` intents from UI controls without blocking on routing or network operations.

#### Scenario: Pause during Discord bridge recovery

- **WHEN** the user presses pause while Discord routing is reconnecting or recovering
- **THEN** UI feedback is immediate and playback enters paused state without waiting for routing completion

#### Scenario: Stop under active reconnect attempts

- **WHEN** the user presses stop while background reconnect logic is running
- **THEN** playback is silenced immediately and reconnect activity does not block the stop action

### Requirement: Deterministic Transport State Machine

The system SHALL process transport commands through a deterministic state machine with monotonic sequencing and command coalescing.

#### Scenario: Rapid play-pause-play sequence

- **WHEN** a user triggers play, pause, and play in rapid succession
- **THEN** only the latest valid command is applied and transport state converges to playing without stale side effects

#### Scenario: Stop supersedes pending commands

- **WHEN** stop is issued while prior start/pause commands are queued
- **THEN** stop takes precedence and no earlier queued command resumes playback afterward

### Requirement: Routing-Independent Control Latency

The system SHALL keep control latency for `start`, `pause`, and `stop` within a defined SLO regardless of active routing target.

#### Scenario: Instant controls on Discord output

- **WHEN** Discord output is selected and connected
- **THEN** transport control latency remains within configured SLO and is not coupled to network jitter

#### Scenario: Instant controls on local output

- **WHEN** local output is selected
- **THEN** transport control latency remains within configured SLO and behavior matches Discord control responsiveness
