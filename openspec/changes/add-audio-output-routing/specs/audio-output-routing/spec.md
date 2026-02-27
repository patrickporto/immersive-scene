## ADDED Requirements

### Requirement: Audio Output Device Selection

The system SHALL allow users to select a specific system audio output device from a list of available devices. The selected device SHALL be persisted and used on subsequent launches. If no device is selected, the system MUST use the system default output.

#### Scenario: User selects a specific output device

- **WHEN** the user opens the Audio Output section in Settings and selects a device from the dropdown
- **THEN** all audio output is routed to the selected device immediately

#### Scenario: Selected device is unavailable

- **WHEN** the previously selected output device is no longer available (unplugged)
- **THEN** the system falls back to the system default output and shows a notification

#### Scenario: Default output selection

- **WHEN** the user selects "Default" in the dropdown
- **THEN** audio is routed to the operating system's default output device

### Requirement: Quick Output Switcher

The system SHALL provide a quick-access output device picker in the bottom player bar. The picker MUST show all available system output devices and a Discord option (if configured). Selecting a device from the picker SHALL switch the active output immediately.

#### Scenario: Opening the quick switcher

- **WHEN** the user clicks the speaker/output icon in the bottom player
- **THEN** a popover appears listing available output devices with the active device highlighted

#### Scenario: Switching output via quick switcher

- **WHEN** the user selects a different device from the quick switcher
- **THEN** audio output switches to the selected device without interrupting playback

### Requirement: Audio Output Device Persistence

The system SHALL persist the selected output device ID in the application settings. The system MUST restore the selected device on startup if it is still available.

#### Scenario: Device persisted across sessions

- **WHEN** the user selects an output device and restarts the application
- **THEN** the same output device is automatically selected on startup
