## ADDED Requirements

### Requirement: App Settings Persistence

The system SHALL persist application settings in a `settings.json` file within the Tauri app data directory. If the file does not exist, defaults MUST be used.

#### Scenario: Settings loaded on startup

- **WHEN** the application starts and `settings.json` exists
- **THEN** settings are loaded from the file

#### Scenario: Settings file missing

- **WHEN** the application starts and `settings.json` does not exist
- **THEN** default settings are used: audio strategy = `reference`, library path = `{app_data_dir}/library`

### Requirement: Audio File Strategy Setting

The system SHALL allow users to configure whether audio files are referenced by their original path or copied into the app's library folder. The setting MUST be either `reference` or `copy`.

#### Scenario: Strategy set to "copy"

- **WHEN** a new audio element is created and the strategy is `copy`
- **THEN** the audio file is copied to the library directory and the element's `file_path` points to the copied file

#### Scenario: Strategy set to "reference"

- **WHEN** a new audio element is created and the strategy is `reference`
- **THEN** the element's `file_path` stores the original file location without copying

### Requirement: Library Path Configuration

The system SHALL allow users to configure the library directory where copied audio files are stored. The directory MUST be created automatically if it does not exist.

#### Scenario: Custom library path

- **WHEN** the user changes the library path to a custom directory
- **THEN** subsequent file copies use the new directory

### Requirement: Settings Modal

The system SHALL provide a settings modal accessible via a gear icon in the application UI. The modal MUST display all configurable settings with appropriate controls (radio buttons, directory picker).

#### Scenario: Opening settings

- **WHEN** the user clicks the gear icon
- **THEN** the settings modal opens showing current settings values
