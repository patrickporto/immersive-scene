## ADDED Requirements

### Requirement: Cross-platform desktop build pipeline

The system SHALL run GitHub Actions on pushes to `main` and generate desktop distribution artifacts for supported platforms.

#### Scenario: Push to main starts desktop build

- **WHEN** a commit is pushed to `main`
- **THEN** a workflow builds Windows, Linux, and macOS artifacts

#### Scenario: Linux AppImage output

- **WHEN** the Linux build completes successfully
- **THEN** the workflow publishes an AppImage artifact

#### Scenario: Linux Flatpak output

- **WHEN** the Flatpak build job completes successfully
- **THEN** the workflow publishes a `.flatpak` bundle artifact

### Requirement: Build artifacts include integrity metadata

The system SHALL generate checksums for produced release artifacts.

#### Scenario: Checksums generated

- **WHEN** platform artifacts are uploaded
- **THEN** a checksum file is uploaded alongside them
