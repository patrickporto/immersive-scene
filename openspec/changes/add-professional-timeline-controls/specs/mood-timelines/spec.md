## ADDED Requirements

### Requirement: Timeline Clip Start Positioning

The system SHALL allow users to define the exact start moment of each audio clip inside a mood timeline track.

#### Scenario: Positioning a clip at a specific start time

- **WHEN** a user places or drags a clip to a timestamp on a track
- **THEN** the clip start time is saved and playback begins at that exact timestamp

### Requirement: Timeline Gaps and Silence

The system SHALL preserve empty time ranges between clips in the timeline so users can intentionally create silence between audio events.

#### Scenario: Leaving an empty interval between clips

- **WHEN** a user positions two clips with a time gap between them
- **THEN** playback includes silence during the gap and does not auto-fill or auto-shift clips

### Requirement: Timeline Loop Playback

The system SHALL support looping the full timeline sequence for the active mood.

#### Scenario: Looping the full timeline

- **WHEN** timeline loop is enabled and playback reaches the timeline end
- **THEN** playback restarts from the timeline start and continues until loop is disabled or playback is stopped

### Requirement: Track Management in Timelines

The system SHALL provide simple controls to add, remove, and reorder tracks within a mood timeline.

#### Scenario: Reordering tracks

- **WHEN** a user changes track order in the timeline
- **THEN** the new order is persisted and reflected consistently in the timeline UI and playback model

### Requirement: Crossfade Between Timeline Sections

The system SHALL support smooth crossfade transitions for timeline playback transitions where overlapping handoff is configured.

#### Scenario: Transition with crossfade

- **WHEN** playback transitions between configured timeline sections with crossfade enabled
- **THEN** outgoing audio fades out while incoming audio fades in over the configured crossfade duration
