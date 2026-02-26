## ADDED Requirements

### Requirement: Unified Transport Authority

The bottom player SHALL be the single transport authority for timeline playback controls (play, pause, stop).

#### Scenario: Starting playback from bottom player

- **WHEN** a user presses play in the bottom player
- **THEN** timeline playback starts for the active mood timeline and no parallel timeline-local transport is required

#### Scenario: Pausing playback from bottom player

- **WHEN** a user presses pause in the bottom player during timeline playback
- **THEN** playback pauses and can later resume from the paused position

#### Scenario: Stopping playback from bottom player

- **WHEN** a user presses stop in the bottom player during timeline playback
- **THEN** all timeline audio stops and playhead state resets according to transport rules

### Requirement: Playback Context Metadata

The bottom player SHALL display the soundset and mood that are currently audible, independent of what is currently selected in the editor.

#### Scenario: Selected mood differs from currently playing mood

- **WHEN** playback continues for Mood A and the user selects Mood B in the UI
- **THEN** the bottom player continues to display Mood A and its parent soundset until playback context changes
