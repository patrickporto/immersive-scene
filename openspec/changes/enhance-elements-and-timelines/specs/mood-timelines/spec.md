## ADDED Requirements

### Requirement: Optional Mood Timelines

Users MUST have the option to enable timelines within a mood to sequence audio elements over time. Managing these timelines (adding, removing, reordering) MUST be simple.

#### Scenario: Enabling the timeline view
- **WHEN** an advanced user toggles the timeline view on
- **THEN** the timeline interface appears and manages the sequential state of the mood

### Requirement: Timeline Element Positioning

Users MUST be able to drag and drop elements into timeline tracks to define when they play. The UI MUST visualize elements that are playing concurrently or nearby.

#### Scenario: Dragging an element to a timeline sequence
- **WHEN** a user drags an element onto a timeline track
- **THEN** a visual block is created at the drop position, representing the element's playback time and duration

### Requirement: Timeline Crossfading

When switching between two different timelines, the audio engine MUST smoothly crossfade between them.

#### Scenario: Switching timelines with crossfade
- **WHEN** a user switches playback from Timeline A to Timeline B
- **THEN** the audio engine fades out Timeline A while simultaneously fading in Timeline B

### Requirement: Enhanced Bottom Bar Control

The main play button and controls in the bottom bar MUST integrate with the timeline system to offer advanced playback, serving as the master control for sequenced playback.

#### Scenario: Master playback of a timeline
- **WHEN** a timeline is active and the bottom bar play button is pressed
- **THEN** the timeline sequence begins playing and the playback cursor accurately reflects the timing
