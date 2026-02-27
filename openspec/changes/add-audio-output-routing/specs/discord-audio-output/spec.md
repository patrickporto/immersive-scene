## ADDED Requirements

### Requirement: Discord Bot Token Configuration

The system SHALL allow users to configure a Discord bot token in the App Settings modal. The token MUST be validated against the Discord REST API before being accepted. Upon successful validation, the system SHALL display the bot's username and avatar as confirmation.

#### Scenario: Valid token entered

- **WHEN** the user pastes a valid Discord bot token and validation succeeds
- **THEN** the bot's username and avatar are displayed, and server selection becomes available

#### Scenario: Invalid token entered

- **WHEN** the user pastes an invalid or expired Discord bot token
- **THEN** an error message is shown and the token is not saved

### Requirement: Discord Server and Voice Channel Selection

The system SHALL display the list of Discord servers the bot has joined. After selecting a server, the system SHALL display the available voice channels. The user MUST select both a server and a voice channel before connecting.

#### Scenario: Selecting a server and channel

- **WHEN** the user selects a server from the bot's guilds and a voice channel from that server
- **THEN** the Connect button becomes enabled

#### Scenario: Bot not in any server

- **WHEN** the bot has not been added to any server
- **THEN** the system displays a "Copy Invite Link" button with the correct permissions URL

### Requirement: Discord Voice Connection

The system SHALL connect the bot to the selected Discord voice channel when the user clicks "Connect". The connection status MUST be visually indicated (disconnected, connecting, connected, error). The bot SHALL remain connected until the user explicitly disconnects or switches output.

#### Scenario: Successful connection

- **WHEN** the user clicks Connect with a valid server and channel selected
- **THEN** the bot joins the voice channel and the status indicator shows "Connected"

#### Scenario: Connection failure

- **WHEN** the bot cannot join the voice channel (permissions, network error)
- **THEN** an error message is shown and the status indicator shows "Error"

#### Scenario: Disconnecting

- **WHEN** the user clicks Disconnect or switches output away from Discord
- **THEN** the bot leaves the voice channel and the status shows "Disconnected"

### Requirement: Discord Audio Streaming

The system SHALL stream the application's mixed audio output to the connected Discord voice channel in real time. Audio MUST be captured from the Web Audio API graph and transmitted to the Rust backend for Opus encoding and UDP transport via the Discord voice gateway.

#### Scenario: Audio plays while connected to Discord

- **WHEN** audio is playing and the output is set to Discord
- **THEN** remote users in the Discord voice channel hear the audio in real time

#### Scenario: No audio playing

- **WHEN** no audio is playing but the bot is connected
- **THEN** the bot remains in the voice channel transmitting silence (no disconnect)

### Requirement: Discord Credentials Persistence

The system SHALL persist Discord bot token, guild ID, and channel ID in the application settings. On startup, if Discord credentials are configured, the system SHALL show the previous configuration but NOT auto-connect.

#### Scenario: Credentials restored on startup

- **WHEN** the application starts with saved Discord credentials
- **THEN** the Discord section in Settings shows the saved configuration with a manual Connect option
