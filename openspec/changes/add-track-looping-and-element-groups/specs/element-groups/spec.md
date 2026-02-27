## ADDED Requirements

### Requirement: Audio Element Group Entity

The system SHALL support a named group entity that contains multiple audio elements. A group SHALL belong to a SoundSet (`sound_set_id` non-null) or exist globally (`sound_set_id = NULL`). Each group MUST contain at least one audio element.

#### Scenario: Creating a group within a SoundSet

- **WHEN** a user creates a new element group within a SoundSet and adds audio elements to it
- **THEN** the group is persisted with the given name, linked to that SoundSet, and lists its member elements

#### Scenario: Creating a global group (for one-shots)

- **WHEN** a user creates an element group without a SoundSet context
- **THEN** the group is persisted with `sound_set_id = NULL` and is accessible from the One Shots section

### Requirement: Random Selection Playback

When an element group is triggered for playback, the system SHALL randomly select exactly one member element to play. The system SHALL NOT select the same element that was played on the immediately previous trigger of that group (no-immediate-repeat), unless the group contains only one element.

#### Scenario: Playing a group with multiple elements

- **WHEN** a user triggers playback of a group containing elements A, B, and C, and element A was played last
- **THEN** the system randomly selects either B or C for playback

#### Scenario: Playing a group with a single element

- **WHEN** a user triggers playback of a group containing only element A
- **THEN** element A is played

### Requirement: Group as Timeline Clip

The system SHALL allow element groups to be placed on timeline tracks in the same way as single audio elements. When a timeline clip references a group, the random selection SHALL occur at each scheduled trigger (including each loop iteration of the track).

#### Scenario: Placing a group on a timeline track

- **WHEN** a user drags an element group onto a timeline track
- **THEN** a clip is created at the drop position referencing the group, with explicit duration set by the user or defaulting to the longest member element's duration

#### Scenario: Group clip plays different element on each loop

- **WHEN** a track with a group clip loops
- **THEN** each loop iteration re-resolves the group, potentially selecting a different element than the previous iteration

### Requirement: Group Management UI

The system SHALL provide a UI for creating, renaming, and deleting element groups. Users SHALL be able to add and remove member elements via drag-and-drop or a picker interface. Groups MUST be visually distinguishable from single elements through a stacked/layered card design showing member count.

#### Scenario: Adding an element to a group via drag-and-drop

- **WHEN** a user drags an audio element onto a group card
- **THEN** the element is added as a member of the group and the group card updates to reflect the new member count

#### Scenario: Removing an element from a group

- **WHEN** a user removes an element from a group that has more than one member
- **THEN** the element is removed from the group and the group's member list updates

#### Scenario: Group visual distinction

- **WHEN** a group card is rendered alongside single element cards
- **THEN** the group card displays a stacked/layered visual design with a badge showing the member count, clearly distinguishing it from single-element cards
