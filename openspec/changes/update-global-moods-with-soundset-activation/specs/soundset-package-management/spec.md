## ADDED Requirements

### Requirement: SoundSet Package Scope

SoundSet import/export SHALL be scoped to reusable source package data only. Exported packages MUST include soundset metadata, channels, elements, groups, and referenced audio files, and MUST NOT include moods, timelines, tracks, or clips.

#### Scenario: Exporting a soundset package

- **WHEN** a user exports a soundset
- **THEN** the package contains source-library data and audio assets only, with no mood arrangement data

### Requirement: Mood-Independent Import

Importing a soundset package SHALL create or restore source-library data without creating or modifying moods.

#### Scenario: Importing into a project with existing moods

- **WHEN** a user imports a valid soundset package
- **THEN** the imported soundset appears as a source package and existing moods remain unchanged

### Requirement: Source-Level Import/Export UX

The system SHALL expose import/export actions as source-level operations in soundset management surfaces, not as mood-level operations.

#### Scenario: User initiates export from source controls

- **WHEN** a user opens soundset actions in the Library Sources area
- **THEN** export is available for the selected soundset regardless of active mood

#### Scenario: User initiates import with no active mood

- **WHEN** a user imports a soundset while no mood is selected
- **THEN** the import succeeds and the soundset is available in source activation controls

### Requirement: Package Version Compatibility

The package manifest SHALL include a `format_version` indicating package-only scope semantics so import can validate compatibility.

#### Scenario: Importing unsupported package version

- **WHEN** a user imports a package with unsupported `format_version`
- **THEN** the system rejects the import and reports a compatibility error
