## ADDED Requirements

### Requirement: Automated semantic version preparation

The system SHALL automate semantic version preparation through a release PR workflow.

#### Scenario: Changes merged to main

- **WHEN** releasable changes are merged into `main`
- **THEN** the release automation updates or opens a versioning PR with semver bumps

### Requirement: Consistent versioning workflow in repository

The repository SHALL provide scripts/configuration so contributors can create and apply version changes consistently.

#### Scenario: Contributor creates version intent

- **WHEN** a contributor runs the configured changeset command
- **THEN** a changeset file is created and consumed by release automation
