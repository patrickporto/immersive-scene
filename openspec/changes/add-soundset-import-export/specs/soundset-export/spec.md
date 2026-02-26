## ADDED Requirements

### Requirement: SoundSet Export

The system SHALL allow users to export a SoundSet as a self-contained ZIP archive containing a JSON metadata manifest and all associated audio files. The export MUST include channels, moods, timelines, tracks, clips (mixed elements), and volume levels. Global one-shot elements MUST NOT be included in the export.

#### Scenario: Exporting a SoundSet

- **WHEN** a user exports a SoundSet
- **THEN** a ZIP archive is created containing `manifest.json` at the root and all audio files under an `audio/` directory

#### Scenario: Global one-shots excluded

- **WHEN** a SoundSet contains elements and there are global one-shots in the system
- **THEN** the exported archive does NOT include any global one-shot audio files or metadata

### Requirement: SoundSet Import

The system SHALL allow users to import a SoundSet from a ZIP archive. The import MUST recreate the SoundSet, its channels, elements (with audio files copied to the local library), moods, timelines, tracks, and clips. If a SoundSet with the same name already exists, the system MUST resolve the collision (e.g., by appending a suffix).

#### Scenario: Importing a SoundSet archive

- **WHEN** a user imports a valid ZIP archive
- **THEN** a new SoundSet is created with all channels, elements, moods, timelines, tracks, and clips from the manifest

#### Scenario: Name collision on import

- **WHEN** a SoundSet with the same name already exists
- **THEN** the imported SoundSet name is appended with a numeric suffix (e.g., "My Set (2)")

### Requirement: Export Metadata Format

The system SHALL use JSON as the metadata format. The manifest MUST include a `format_version` field for forward compatibility.

#### Scenario: Manifest structure

- **WHEN** a SoundSet is exported
- **THEN** the `manifest.json` contains `format_version`, `soundset`, `channels`, `elements`, and `moods` (with nested `timeline`, `tracks`, and `clips`)
