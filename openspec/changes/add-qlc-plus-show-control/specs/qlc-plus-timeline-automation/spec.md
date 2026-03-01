## ADDED Requirements

### Requirement: Drag-and-Drop QLC+ Cues to Timeline

The system SHALL allow users to drag a QLC+ function from the function list and drop it onto a timeline track, creating a scheduled QLC+ cue with start time and duration metadata.

#### Scenario: Dropping a function onto a track

- **WHEN** a user drags a QLC+ function card to a timeline track lane
- **THEN** a QLC+ cue is created on that track at the dropped timeline position

### Requirement: Timeline-Driven QLC+ Execution

The timeline scheduler SHALL execute QLC+ cues at their configured start times during playback and SHALL apply cue action semantics (start, stop, toggle, or parameterized action).

#### Scenario: Cue executes at scheduled time

- **WHEN** timeline playback reaches a QLC+ cue start time
- **THEN** the corresponding QLC+ command is dispatched and cue execution status is recorded

#### Scenario: Cue fails during execution

- **WHEN** a scheduled QLC+ command fails
- **THEN** the cue is marked failed with a visible error indicator while timeline playback continues

### Requirement: Transport Stop and Safety Behavior

When timeline playback stops, the system SHALL apply configured QLC+ stop behavior: stop only cues started by the current run, or issue a global panic/blackout command.

#### Scenario: Stop current-run cues on transport stop

- **WHEN** transport stop is triggered and stop policy is scoped to current run
- **THEN** the system sends stop commands for active QLC+ cues initiated by that run

#### Scenario: Global panic on transport stop

- **WHEN** transport stop is triggered and panic mode is enabled
- **THEN** the system sends the configured global panic/blackout command to QLC+

### Requirement: Cue Metadata for Narrative Workflow

The system SHALL support optional metadata on QLC+ timeline cues, including custom label, notes, and scene tags, so operators can identify cues quickly during live RPG narration.

#### Scenario: Viewing cue metadata during editing

- **WHEN** a user selects a QLC+ cue in the timeline
- **THEN** the cue inspector displays editable label, notes, and tags associated with that cue
