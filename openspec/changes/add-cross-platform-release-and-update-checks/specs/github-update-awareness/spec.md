## ADDED Requirements

### Requirement: Runtime app version visibility

The application SHALL expose its current runtime version to users.

#### Scenario: Version shown in settings

- **WHEN** the user opens app settings
- **THEN** the current app version is displayed

### Requirement: GitHub release update check

The application SHALL check GitHub for newer releases and report update status.

#### Scenario: New version available

- **WHEN** the latest GitHub release version is greater than the current app version
- **THEN** the UI reports that an update is available

#### Scenario: Already up to date

- **WHEN** the latest GitHub release version is equal to or lower than the current app version
- **THEN** the UI reports that the app is up to date

#### Scenario: Update check failure

- **WHEN** the GitHub API request fails or returns invalid release data
- **THEN** the UI reports a non-crashing error state
