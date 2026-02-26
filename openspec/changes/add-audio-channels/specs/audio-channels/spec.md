## ADDED Requirements

### Requirement: Audio Channel Entity

The system SHALL provide audio channels as first-class entities scoped to a SoundSet. Each channel MUST have a name, icon identifier, volume level (0.0–1.0), and order index.

#### Scenario: Channel created for a SoundSet

- **WHEN** a user creates a new audio channel for a SoundSet
- **THEN** the channel is persisted with the given name, volume defaults to 1.0, and it is appended at the end of the channel order

#### Scenario: Channel deleted

- **WHEN** a user deletes a channel
- **THEN** the channel is removed and elements assigned to it lose their channel assignment (set to null)

### Requirement: Default Channels on Mood Creation

The system SHALL auto-create three default channels (Music, Ambient, Sound Effects) for a SoundSet when a mood is created and the SoundSet has no channels yet. Each default channel MUST have a dedicated icon identifier.

#### Scenario: First mood created in a SoundSet

- **WHEN** a mood is created and the SoundSet has zero channels
- **THEN** three channels are created: "Music" (icon: `music`), "Ambient" (icon: `ambient`), "Sound Effects" (icon: `effects`)

#### Scenario: Subsequent mood created

- **WHEN** a mood is created and the SoundSet already has channels
- **THEN** no additional channels are created

### Requirement: Channel-Based Volume Routing

The system SHALL route each audio element's volume through its assigned channel's gain, and then through the global volume. The effective volume MUST be `elementVolume × channelVolume × globalVolume`.

#### Scenario: Volume chain applied during playback

- **WHEN** an element is playing and its channel volume is 0.5 and global volume is 0.8
- **THEN** the effective output volume is `elementVolume × 0.5 × 0.8`

### Requirement: Channel Sidebar

The system SHALL provide a collapsible right sidebar that displays all channels of the selected SoundSet, allowing users to adjust volume, add new channels, rename, reorder, and delete channels.

#### Scenario: Sidebar displays channels

- **WHEN** a SoundSet is selected
- **THEN** the right sidebar lists its channels with volume sliders and icons

#### Scenario: Custom channel added

- **WHEN** a user adds a custom channel
- **THEN** the channel is created with a generic icon and default volume

### Requirement: Channel Selection on Element Creation

The system SHALL require the user to select a target audio channel when adding a new element. The selection MUST happen in a modal dialog that also collects the audio file.

#### Scenario: New element modal

- **WHEN** the user clicks "new element"
- **THEN** a modal opens requesting the audio file and the target channel
