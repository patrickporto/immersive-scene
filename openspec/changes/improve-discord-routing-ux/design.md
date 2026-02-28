# Design: Discord Routing UX Improvement

## Context
The current implementation of Discord routing configuration uses standard HTML dropdowns, which are functional but lack the visual feedback and branding associated with Discord. Users find it difficult to quickly navigate and select the correct server/channel, especially when the account is connected to many guilds.

## Goals / Non-Goals
- **Goals**:
  - Replace native `<select>` elements with custom, interactive UI.
  - Show Discord guild icons for server selection.
  - Implement a guided selection flow.
  - Improve visual feedback for connection states.
- **Non-Goals**:
  - Implement Discord OAuth2 (sticking with Bot Tokens for now).
  - Change the backend Rust implementation for voice streaming.

## Decisions

### 1. Guild Icon Selection Grid
Instead of a dropdown, we will display a horizontal scrollable list or a grid of guild icons (proxied through the Discord CDN).
- **Why**: Allows users to rely on visual identification, which is faster for many guilds.
- **Implementation**: Fetch `icon` from `DiscordGuild` and use `https://cdn.discordapp.com/icons/{guild_id}/{guild_icon}.png`.

### 2. Guided Selection Flow
The UI will be divided into clear steps:
1. **Connect Bot**: Entry of bot token.
2. **Select Guild**: Animated transition to server selection.
3. **Select Voice Channel**: List of available voice channels in the selected guild.
4. **Active Status**: View showing the current connection and an option to disconnect.

### 3. Usage of Framer Motion
We will use `AnimatePresence` and `motion` to handle transitions between steps.
- **Why**: Provides a premium, app-like feel instead of static UI updates.

### 4. Interactive Channel List
Voice channels will be listed with an icon (e.g., `Mic` or `Speaker`) and hover states that reflect Discord's own UI.

## Risks / Trade-offs
- **API Limits**: Fetching guild icons and listing channels too frequently could hit rate limits, though this is unlikely for the typical setup flow.
- **Screen Space**: A grid of icons takes up more space than a dropdown. We will mitigate this with a scrollable container.

## Open Questions
- Should we allow users to invite the bot directly if it's not in the desired server? (Already partially covered by the "Copy Invite Link" requirement).
- Do we need to show channel categories? (Will simplify and show all voice channels for now).
