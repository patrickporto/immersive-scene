## ADDED Requirements

### Requirement: Global Mood Ownership

The system SHALL treat moods as global project entities that are not owned by a specific soundset.

#### Scenario: Listing moods without soundset selection

- **WHEN** a user opens mood management
- **THEN** the mood list is available without requiring selection of a specific soundset

### Requirement: Multi-SoundSet Mood Composition

The system SHALL allow a single mood timeline to include audio elements from multiple enabled soundsets simultaneously.

#### Scenario: Building a mixed-source mood

- **WHEN** a user adds clips from SoundSet A and SoundSet B into the same mood timeline
- **THEN** the timeline accepts both sources and plays them in a single mood context

### Requirement: Unavailable Source Feedback and Recovery

When a mood references elements from a disabled soundset, the system SHALL provide clear unavailable-source feedback and a direct recovery path.

#### Scenario: Source disabled after composition

- **WHEN** a soundset used by clips in the active mood is disabled
- **THEN** the affected clips show an unavailable indicator and playback skips those clips

#### Scenario: Re-enabling an unavailable source

- **WHEN** a user chooses a recovery action to re-enable the disabled source
- **THEN** affected clips return to playable state without remapping

### Requirement: Source Attribution in Editing Surfaces

The system SHALL display source attribution for elements and clips to help users understand which soundset each asset belongs to.

#### Scenario: Inspecting element origin

- **WHEN** a user views element cards or timeline clips
- **THEN** each item includes a visible source label identifying its soundset
