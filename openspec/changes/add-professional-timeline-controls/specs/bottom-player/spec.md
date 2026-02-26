## ADDED Requirements

### Requirement: Timeline-Aware Bottom Play Control

The bottom play control SHALL function as a master transport for timeline playback when a timeline is active.

#### Scenario: Starting timeline playback from bottom bar

- **WHEN** a user presses play in the bottom bar while a timeline is active
- **THEN** timeline playback starts from the current playhead position and bottom bar state switches to playing

### Requirement: Bottom Bar Playback State Clarity

The bottom bar SHALL show clear playback context including active mood/timeline, play state, and loop state.

#### Scenario: Loop status visible in transport

- **WHEN** timeline loop is enabled
- **THEN** the bottom bar displays an active loop indicator and loop state remains synchronized with timeline playback configuration

### Requirement: Timeline Pause and Stop Behavior

The bottom bar SHALL provide predictable pause and stop controls for timeline playback.

#### Scenario: Pausing timeline playback

- **WHEN** a user presses pause during timeline playback
- **THEN** scheduled playback pauses and can resume from the paused playhead position

#### Scenario: Stopping timeline playback

- **WHEN** a user presses stop during timeline playback
- **THEN** all currently playing timeline audio stops and the playhead resets to timeline start
