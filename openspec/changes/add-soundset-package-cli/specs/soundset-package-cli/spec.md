## ADDED Requirements

### Requirement: CLI packaging command

The system SHALL provide a CLI command that accepts a source folder and produces a SoundSet ZIP archive compatible with the project import flow.

#### Scenario: Package a valid folder

- **WHEN** the user runs the CLI command with a folder containing a valid `manifest.json` and all referenced files
- **THEN** the command creates a ZIP archive that can be imported by the existing SoundSet import capability

#### Scenario: Default output path

- **WHEN** the user omits the output path argument
- **THEN** the command writes `<soundset-name>.zip` to the current working directory

### Requirement: Manifest and file validation

Before creating an archive, the system SHALL validate manifest schema compatibility and referenced file integrity.

#### Scenario: Missing manifest

- **WHEN** the source folder does not contain `manifest.json`
- **THEN** the command fails with an explicit validation error and does not create a ZIP file

#### Scenario: Unsupported format version

- **WHEN** `manifest.json` contains an unsupported `format_version`
- **THEN** the command fails with a version compatibility error and does not create a ZIP file

#### Scenario: Referenced file missing

- **WHEN** an `elements[].archive_path` value in the manifest points to a file that does not exist in the source folder
- **THEN** the command fails with the missing file path in the error message and does not create a ZIP file

### Requirement: Safe archive paths

The system SHALL reject unsafe manifest paths to prevent path traversal and invalid archive structure.

#### Scenario: Path traversal attempt

- **WHEN** an `elements[].archive_path` value is absolute or contains parent traversal (`..`)
- **THEN** the command fails validation and reports the invalid path

### Requirement: Archive structure compatibility

The generated archive SHALL preserve the structure expected by existing SoundSet import.

#### Scenario: Required archive layout

- **WHEN** the command creates an archive
- **THEN** `manifest.json` is placed at archive root and each referenced audio file is placed at its declared relative `archive_path`
