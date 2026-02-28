## MODIFIED Requirements

### Requirement: Discord Bot Token Configuration

The system SHALL allow users to configure a Discord bot token in the App Settings modal using a guided, multi-step interface. The token MUST be validated against the Discord REST API. Upon successful validation, the system SHALL transition with an animation to the guild selection step, displaying the bot's username and avatar as confirmation.

#### Scenario: Valid token entered
- **WHEN** the user pastes a valid Discord bot token and validation succeeds
- **THEN** the bot's username and avatar are displayed, and the UI automatically transitions to the Server Selection step.

#### Scenario: Invalid token entered
- **WHEN** the user pastes an invalid or expired Discord bot token
- **THEN** an error message is shown using a high-visibility alert, and the user remains on the token entry step.

### Requirement: Discord Server and Voice Channel Selection

The system SHALL display the list of Discord servers the bot has joined using a visual grid of server icons. After selecting a server icon, the system SHALL display the available voice channels in a clearly styled list. The selection process MUST be interactive and visual, allowing the user to easily identify their target destination.

#### Scenario: Selecting a server by icon
- **WHEN** the user clicks on a guild icon in the server selection grid
- **THEN** the server is marked as selected and the UI displays the voice channels for that guild with a slide-in animation.

#### Scenario: Selecting a voice channel
- **WHEN** the user selects a voice channel from the list
- **THEN** the selection is highlighted, and the Connect button becomes prominently enabled.
