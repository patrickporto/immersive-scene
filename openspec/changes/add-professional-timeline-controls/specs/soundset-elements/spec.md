## ADDED Requirements

### Requirement: SoundSet-Wide Element Availability

The system SHALL make every audio element added to a soundset available in all moods belonging to that same soundset.

#### Scenario: Viewing elements from another mood in the same soundset

- **WHEN** a user switches from Mood A to Mood B within the same soundset
- **THEN** the full soundset element library remains available without re-uploading elements

### Requirement: Drag to One-Shot Conversion

The system SHALL allow users to drag an element into a one-shot area to convert it into a one-shot trigger.

#### Scenario: Converting an ambient element to one-shot

- **WHEN** a user drops an element into the one-shot drop zone
- **THEN** the element type updates to one-shot and appears in one-shot playback controls

### Requirement: Playback Visibility for Elements

The system SHALL clearly indicate which elements are currently playing using high-contrast visual state cues.

#### Scenario: Element starts playback

- **WHEN** an element enters playing state
- **THEN** the element card shows a distinct active visual state that is immediately distinguishable from idle elements

### Requirement: Direct Playback for All Elements

The system SHALL allow every audio element to be triggered directly from the element library regardless of timeline usage.

#### Scenario: Playing an element without timeline editing

- **WHEN** a user clicks play on an element card
- **THEN** the element starts playback and updates global playback indicators
