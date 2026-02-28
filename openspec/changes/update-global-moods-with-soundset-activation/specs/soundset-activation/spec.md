## ADDED Requirements

### Requirement: SoundSet Activation State

The system SHALL maintain an activation state (`enabled` or `disabled`) for each soundset. Newly created soundsets MUST default to `enabled`.

#### Scenario: Creating a new soundset

- **WHEN** a user creates a new soundset
- **THEN** the soundset is persisted with activation state `enabled`

#### Scenario: Toggling activation state

- **WHEN** a user disables or enables a soundset from the Library Sources UI
- **THEN** the soundset activation state is persisted and restored across app restarts

### Requirement: Source Visibility by Activation

The system SHALL show soundset elements in browsing and picker surfaces only when their source soundset is enabled.

#### Scenario: Disabled source hidden from pickers

- **WHEN** a soundset is disabled
- **THEN** its elements are excluded from element libraries and timeline insertion pickers

#### Scenario: Re-enabled source restored in pickers

- **WHEN** a disabled soundset is re-enabled
- **THEN** its elements become available again in element libraries and timeline insertion pickers

### Requirement: Non-Destructive Disable Behavior

Disabling a soundset MUST NOT delete source data, moods, timelines, or clips that reference that soundset.

#### Scenario: Disabling a source used by existing clips

- **WHEN** a mood timeline contains clips tied to elements from a soundset and that soundset is disabled
- **THEN** the clips remain in place and are marked unavailable instead of being removed
