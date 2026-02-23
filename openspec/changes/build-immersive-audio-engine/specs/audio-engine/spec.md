## ADDED Requirements

### Requirement: SQLite Database Schema

The system SHALL provide a SQLite database for persisting SoundSets, Moods, and AudioElements.

#### Scenario: Create SoundSet

- **WHEN** the user creates a SoundSet with name="Dungeon" and description="Dark ambient"
- **THEN** the SoundSet SHALL be saved to the database
- **AND** it SHALL persist after app restart

#### Scenario: Create Mood

- **GIVEN** a SoundSet exists
- **WHEN** the user adds a Mood with name="Combat"
- **THEN** the Mood SHALL be associated with the SoundSet
- **AND** it SHALL be retrievable later

#### Scenario: Add Audio Element

- **GIVEN** a Mood exists
- **WHEN** the user adds an audio file to the Mood
- **THEN** an AudioElement record SHALL be created
- **AND** it SHALL store the file path and metadata

### Requirement: Audio File Upload

The system SHALL support uploading audio files in OGG, MP3, WAV, and FLAC formats.

#### Scenario: Valid file upload

- **GIVEN** the user selects a valid .mp3 file
- **WHEN** they confirm the upload
- **THEN** the file SHALL be copied to the app's audio directory
- **AND** metadata SHALL be extracted

#### Scenario: Invalid format rejection

- **GIVEN** the user selects a .txt file
- **WHEN** they attempt to upload
- **THEN** the system SHALL reject with error message

### Requirement: Basic Audio Playback

The system SHALL play audio files using the Web Audio API.

#### Scenario: Play audio file

- **GIVEN** an audio element exists
- **WHEN** the user clicks play
- **THEN** the audio SHALL start playing
- **AND** the UI SHALL show playing state

#### Scenario: Stop playback

- **GIVEN** audio is playing
- **WHEN** the user clicks stop
- **THEN** the audio SHALL stop immediately
- **AND** the playback position SHALL reset

### Requirement: Five-Channel Mixer

The system SHALL provide 5 mixing channels with independent volume controls.

#### Scenario: Adjust channel volume

- **GIVEN** audio is playing on the "Music" channel
- **WHEN** the user adjusts the volume slider to 50%
- **THEN** the audio volume SHALL change accordingly

#### Scenario: Mute channel

- **GIVEN** audio is playing
- **WHEN** the user mutes a channel
- **THEN** that channel's audio SHALL be silenced
- **AND** other channels SHALL continue playing

### Requirement: Three-Panel Layout

The system SHALL provide a layout with Sidebar, Main Area, and Mixer Panel.

#### Scenario: Display layout

- **WHEN** the app loads
- **THEN** three panels SHALL be visible
- **AND** the Sidebar SHALL show SoundSet list
- **AND** the Main Area SHALL show the active Mood
- **AND** the Mixer Panel SHALL show channel controls
