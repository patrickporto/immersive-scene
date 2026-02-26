## ADDED Requirements

### Requirement: Crossfade Between Moods

The system SHALL perform a crossfade transition when transport switches playback from one mood timeline to another mood timeline.

#### Scenario: Switching moods while playback is active

- **WHEN** Mood A is playing and the user starts Mood B playback from transport
- **THEN** Mood A audio fades out while Mood B audio fades in over the configured crossfade window

#### Scenario: Switching moods while playback is stopped

- **WHEN** playback is stopped and the user starts a different mood
- **THEN** playback starts directly for the new mood without applying transition fade-out from a previous mood

### Requirement: Active Playback Context State

The system SHALL store and expose active playback context as runtime state separate from selection state.

#### Scenario: Playback context update on mood transition

- **WHEN** crossfade to a new mood starts
- **THEN** active playback context updates to identify the incoming mood timeline and parent soundset for transport UI consumers
