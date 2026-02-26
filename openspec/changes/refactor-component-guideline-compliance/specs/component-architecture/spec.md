## ADDED Requirements

### Requirement: Feature Components Must Be Single-Responsibility Files

Feature UI components SHALL be structured as one primary component per file, with complex sections extracted into colocated components.

#### Scenario: Refactoring a monolithic feature component

- **WHEN** a feature component grows into multiple visual and behavioral sections
- **THEN** those sections are split into dedicated component files
- **AND** the original file remains a composition entry point

### Requirement: UI Components Must Delegate Domain Workflows

Feature UI components SHALL delegate heavy domain workflows to hooks or service functions.

#### Scenario: Upload and preload workflow extraction

- **WHEN** a component handles upload orchestration and source preloading
- **THEN** that orchestration is moved into hooks
- **AND** the component focuses on rendering and user interactions

### Requirement: Timeline Editor Sections Must Be Modular

Timeline editing interfaces SHALL separate ruler, lane rendering, and zoom controls into modular components.

#### Scenario: Rendering timeline structure

- **WHEN** timeline UI includes time ruler, track lanes, and zoom controls
- **THEN** each section is implemented as a dedicated component
- **AND** timeline behavior remains equivalent after extraction
