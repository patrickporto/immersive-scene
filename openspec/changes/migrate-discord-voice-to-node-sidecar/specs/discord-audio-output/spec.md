## ADDED Requirements

### Requirement: Node Sidecar Voice Runtime

The system SHALL route Discord voice output through a dedicated Node sidecar runtime using `@discordjs/voice`.

#### Scenario: Successful Discord connection through sidecar

- **WHEN** the user provides a valid token, guild, and channel and selects Discord output
- **THEN** the application establishes voice routing through the Node sidecar and reports connected state to the UI

### Requirement: Breaking Runtime Migration Without Fallback

The system SHALL remove compatibility with the legacy Rust Discord voice runtime and SHALL NOT provide fallback to the previous pipeline.

#### Scenario: Legacy runtime path invocation after migration

- **WHEN** a legacy Rust voice-routing path is requested
- **THEN** the request is rejected as unsupported and the system keeps only the sidecar runtime active

### Requirement: Sidecar Lifecycle Management

The system SHALL manage sidecar startup, health-check, and shutdown as part of desktop app lifecycle.

#### Scenario: App startup with Discord output available

- **WHEN** the desktop app initializes audio routing services
- **THEN** the sidecar is started and marked healthy before Discord routing commands are accepted

#### Scenario: App shutdown

- **WHEN** the desktop app closes
- **THEN** the sidecar receives a graceful shutdown signal and voice resources are released

### Requirement: Sidecar Failure Feedback

The system SHALL expose explicit user feedback when the sidecar is unavailable or unhealthy.

#### Scenario: Sidecar boot failure

- **WHEN** the sidecar fails to start or respond within timeout
- **THEN** Discord output is marked unavailable and the user receives a clear actionable error state
