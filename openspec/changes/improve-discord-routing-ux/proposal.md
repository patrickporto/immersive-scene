# Proposal: Improve Discord Routing UX

## Why
The current Discord routing configuration uses standard HTML dropdowns for server and voice channel selection. This doesn't align with the "premium" and "immersive" feel of the application and makes it less intuitive for users to quickly identify their target server (guild) and channel. A more visual approach, using Discord-like elements (server icons, voice channel indicators), will significantly improve the user experience.

## What Changes
1. **Visual Server Selection**: Replace the guild dropdown with a grid or horizontal scroll of server icons.
2. **Interactive Voice Channel Selection**: Replace the channel dropdown with a list of voice channels that includes status indicators (e.g., if the channel is full or restricted).
3. **Step-by-Step Configuration Flow**: A guided UI that leads the user from token entry to server selection, and finally to channel selection and connection.
4. **Enhanced Feedback**: Clearer visual cues during the validation and connection phases using `framer-motion` for smooth transitions.

## Impact
- **Improved UX**: Users can quickly identify servers by their icons.
- **Consistent Design**: The configuration UI will feel more integrated with the Discord ecosystem.
- **Reduced Friction**: A guided flow reduces cognitive load during setup.
