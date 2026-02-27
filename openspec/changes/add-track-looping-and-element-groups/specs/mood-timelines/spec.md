## ADDED Requirements

### Requirement: Per-Track Independent Looping

The system SHALL support an independent loop toggle on each timeline track. When a track's loop is enabled, the track's clip sequence SHALL automatically restart from the beginning of its first clip after the last clip finishes, regardless of other tracks' playback state.

#### Scenario: Enabling loop on a single track

- **WHEN** a user enables loop on Track A while Track B has loop disabled
- **THEN** Track A restarts its clip sequence when it finishes, and Track B plays through once and stops

#### Scenario: Multiple tracks looping independently

- **WHEN** Track A (10 seconds of clips) and Track B (30 seconds of clips) both have loop enabled
- **THEN** Track A restarts three times during one full playback of Track B, each track maintaining its own independent loop cycle

#### Scenario: Disabling loop on a playing track

- **WHEN** a user disables loop on a currently looping track
- **THEN** the track finishes its current playback cycle and stops without affecting other tracks

## MODIFIED Requirements

### Requirement: Timeline Loop Playback

The system SHALL support looping the full timeline sequence for the active mood. When timeline loop is toggled, it SHALL set the `is_looping` flag on all tracks simultaneously as a convenience shortcut.

#### Scenario: Toggling timeline loop on

- **WHEN** timeline loop is enabled
- **THEN** all tracks in the timeline have their loop flag set to enabled

#### Scenario: Toggling timeline loop off

- **WHEN** timeline loop is disabled
- **THEN** all tracks in the timeline have their loop flag set to disabled

#### Scenario: Individual track override after timeline loop

- **WHEN** timeline loop is enabled and then a user disables loop on a specific track
- **THEN** that track does not loop while other tracks continue looping
