## ADDED Requirements

### Requirement: Reusable Modal Component

The design system SHALL provide a reusable `Modal` component that renders a dialog overlay with a title, content area, and optional footer actions. The modal MUST use Motion animations for entrance and exit transitions.

#### Scenario: Modal opens with animation

- **WHEN** `isOpen` is set to `true`
- **THEN** the modal fades in with a scale animation and a backdrop overlay appears

#### Scenario: Modal closes on backdrop click

- **WHEN** the user clicks the backdrop overlay
- **THEN** the modal closes with an exit animation and `onClose` is called

#### Scenario: Modal closes on Escape key

- **WHEN** the modal is open and the user presses the Escape key
- **THEN** the modal closes and `onClose` is called

### Requirement: Modal Accessibility

The modal MUST trap focus within the dialog while open. When the modal closes, focus MUST return to the element that triggered it.

#### Scenario: Focus trapping

- **WHEN** the modal is open
- **THEN** pressing Tab cycles focus only within the modal's focusable elements
