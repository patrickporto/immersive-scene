## ADDED Requirements

### Requirement: QLC+ Integration Settings

The system SHALL provide a QLC+ configuration section in App Settings where users can define endpoint URL, authentication mode, authentication secret (when required), request timeout, reconnect policy, and stop behavior policy.

#### Scenario: Saving a valid QLC+ configuration

- **WHEN** a user enters a valid endpoint and supported configuration values and clicks save
- **THEN** the settings are persisted and available on the next app startup

#### Scenario: Rejecting invalid configuration values

- **WHEN** a user enters an invalid endpoint URL or unsupported timeout/policy value
- **THEN** the system shows validation feedback and MUST NOT persist invalid values

### Requirement: QLC+ Connection Health Check

The system SHALL provide a connection test action in Settings that validates endpoint reachability, authentication, and minimum API compatibility before allowing the integration to be marked healthy.

#### Scenario: Successful health check

- **WHEN** the user triggers connection test with valid endpoint and credentials
- **THEN** the system reports healthy status and records the verified timestamp

#### Scenario: Failed health check

- **WHEN** the endpoint is unreachable, authentication fails, or API compatibility check fails
- **THEN** the system reports a descriptive error state and keeps previous healthy status unset or stale

### Requirement: Startup Configuration Load

The system SHALL load persisted QLC+ settings during application startup and initialize the integration state without auto-triggering any QLC+ function.

#### Scenario: Startup with persisted QLC+ settings

- **WHEN** the application starts and saved QLC+ settings exist
- **THEN** the settings are loaded and integration state is initialized as disconnected or idle until explicit user action or timeline playback requires execution
