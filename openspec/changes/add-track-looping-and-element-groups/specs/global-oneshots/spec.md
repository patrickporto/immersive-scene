## MODIFIED Requirements

### Requirement: Direct One-Shot Management UI

The system SHALL provide a dedicated "One Shots" section in the UI where users can create, play, stop, and delete global one-shots without needing to select a SoundSet first. The One Shots section SHALL also display and support playback of element groups that have `sound_set_id = NULL`.

#### Scenario: One Shots section visibility

- **WHEN** the application loads
- **THEN** the One Shots section is visible and lists all global one-shots and global element groups regardless of selected SoundSet

#### Scenario: Playing a global one-shot

- **WHEN** a user clicks play on a global one-shot
- **THEN** the audio plays immediately as a one-shot (non-looping)

#### Scenario: Playing a global element group from One Shots

- **WHEN** a user clicks play on an element group in the One Shots section
- **THEN** one element is randomly selected from the group and played as a one-shot
