## ADDED Requirements

### Requirement: Single Timeline Per Mood

The system SHALL maintain exactly one editable timeline per mood.

#### Scenario: Opening the timeline editor for a mood

- **WHEN** a user opens timeline editing for a mood
- **THEN** the system loads that mood's single timeline without presenting timeline selection

#### Scenario: Attempting to create a second timeline in the same mood

- **WHEN** a create-timeline action targets a mood that already has a timeline
- **THEN** the system MUST reject duplicate creation and keep only the existing mood timeline

### Requirement: Discrete Collapsible Timeline Panel

The system SHALL render the timeline panel below the bottom player with a low-emphasis visual style and explicit expand/collapse control.

#### Scenario: Collapsing the timeline panel

- **WHEN** the user toggles collapse on the timeline panel
- **THEN** the panel hides editing content while preserving current timeline state

#### Scenario: Expanding the timeline panel

- **WHEN** the user toggles expand on the timeline panel
- **THEN** the panel restores full timeline editing content for the active mood timeline

### Requirement: Track Clip Non-Overlap

The system SHALL prevent two clips from occupying overlapping time ranges inside the same track.

#### Scenario: Dropping a clip where another clip already occupies time

- **WHEN** a user places a clip such that its time interval intersects an existing clip in the same track
- **THEN** the placement MUST be rejected and the user MUST receive overlap feedback

#### Scenario: Moving a clip to a non-overlapping interval

- **WHEN** a user moves a clip to a free interval in the same track
- **THEN** the new start and duration are saved successfully
