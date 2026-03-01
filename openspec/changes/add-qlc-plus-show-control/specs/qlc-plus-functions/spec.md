## ADDED Requirements

### Requirement: QLC+ Function Catalog Listing

The system SHALL retrieve and display available QLC+ functions in a dedicated list component, including function identifier, display name, function type, and execution capability metadata.

#### Scenario: Listing functions from QLC+

- **WHEN** QLC+ integration is healthy and the user opens the QLC+ function browser
- **THEN** the system displays the available functions with searchable and filterable fields

#### Scenario: Empty function catalog

- **WHEN** QLC+ responds with no functions
- **THEN** the system displays an explicit empty state with guidance to configure functions in QLC+

### Requirement: Direct Function Interaction

The system SHALL allow operators to manually execute supported QLC+ actions from the function list, including run/start, stop, toggle/flash, and parameter adjustments when the function type supports adjustable parameters.

#### Scenario: Manually triggering a function

- **WHEN** a user triggers run/start for a listed function
- **THEN** the command is sent to QLC+ and the UI shows command result status

#### Scenario: Unsupported parameter operation

- **WHEN** a user attempts to adjust a parameter that is not supported by that function type
- **THEN** the UI prevents the action or returns a clear unsupported-operation message

### Requirement: Function Status Feedback

The system SHALL present per-function command feedback states (`pending`, `success`, `error`) and include retry action for transient failures.

#### Scenario: Transient network failure on command

- **WHEN** a function command fails due to timeout or temporary transport error
- **THEN** the function row shows error state and exposes retry without forcing full browser refresh
