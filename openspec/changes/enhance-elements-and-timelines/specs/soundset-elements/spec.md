## ADDED Requirements

### Requirement: SoundSet Global Elements

All audio elements uploaded to a soundset MUST be available to play regardless of the currently active mood.

#### Scenario: Element availability across moods
- **WHEN** a user uploads an audio element to a soundset
- **THEN** the element appears in the library for all moods within that same soundset

### Requirement: Drag to One Shot

Users MUST be able to drag a standard element into a designated "One Shots" area to convert it into a one-shot trigger.

#### Scenario: Converting to One-Shot via drag and drop
- **WHEN** a user drags an element from the main library into the One Shots section
- **THEN** the element's channel type changes to `effects` and it renders as a dedicated one-shot trigger button

### Requirement: Meaningful Playback Visibility

The element component MUST provide a highly visible and aesthetically pleasing indication when it is currently playing.

#### Scenario: Visual playing state
- **WHEN** an element starts playing
- **THEN** its UI updates to show a vibrant, pulsating visual state (e.g., glowing effects, waveform animation) that clearly distinguishes it from idle elements
