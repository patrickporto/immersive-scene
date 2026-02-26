## ADDED Requirements

### Requirement: Global One-Shot Entity

The system SHALL support audio elements that exist independently of any SoundSet (global one-shots). A global one-shot MUST have `sound_set_id = NULL` in the database and SHALL NOT belong to any soundset.

#### Scenario: Creating a global one-shot

- **WHEN** a user creates a global one-shot by selecting an audio file
- **THEN** an audio element is created with `sound_set_id = NULL` and is accessible from the One Shots section

### Requirement: Global One-Shot Lifecycle Isolation

Deleting a global one-shot MUST NOT affect any audio elements used in mixed elements (timeline clips). Conversely, deleting a mixed element clip MUST NOT affect any global one-shot.

#### Scenario: Global one-shot deleted does not affect mixed elements

- **WHEN** a global one-shot is deleted
- **THEN** all timeline clips that reference audio files with the same name remain intact and playable

#### Scenario: Mixed element deleted does not affect global one-shots

- **WHEN** a mixed element (timeline clip) is deleted
- **THEN** any global one-shot using the same audio file remains intact and playable

### Requirement: Direct One-Shot Management UI

The system SHALL provide a dedicated "One Shots" section in the UI where users can create, play, stop, and delete global one-shots without needing to select a SoundSet first.

#### Scenario: One Shots section visibility

- **WHEN** the application loads
- **THEN** the One Shots section is visible and lists all global one-shots regardless of selected SoundSet

#### Scenario: Playing a global one-shot

- **WHEN** a user clicks play on a global one-shot
- **THEN** the audio plays immediately as a one-shot (non-looping)

### Requirement: Global One-Shots Excluded from Export

Global one-shots MUST NOT be included in SoundSet export archives.

#### Scenario: Exporting with global one-shots present

- **WHEN** a user exports a SoundSet and global one-shots exist in the system
- **THEN** the export archive contains only elements with a non-null `sound_set_id`
