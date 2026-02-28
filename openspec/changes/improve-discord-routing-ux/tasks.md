# Tasks: Discord Routing UX Improvement

## 1. Research & Analysis
- [x] 1.1 Review existing `DiscordSettingsSection.tsx` and `useDiscordConnection.ts` logic <!-- id: 100 -->
- [x] 1.2 Identify specific `framer-motion` patterns for stepped transitions <!-- id: 101 -->

## 2. Component Refactoring
- [x] 2.1 Extract Discord configuration into a separate sub-component structure if necessary <!-- id: 200 -->
- [x] 2.2 Implement `GuildIcon` component for visual server selection <!-- id: 201 -->
- [x] 2.3 Implement `ChannelItem` component with Discord-like styling <!-- id: 202 -->

## 3. Implementation of Stepped Flow
- [x] 3.1 Refactor `DiscordSettingsSection.tsx` to use a step-based state machine (Token -> Guild -> Channel -> Active) <!-- id: 300 -->
- [x] 3.2 Add animations between steps using `AnimatePresence` <!-- id: 301 -->
- [x] 3.3 Implement the visual Guild selection grid/scroll <!-- id: 302 -->
- [x] 3.4 Implement the visual Channel selection list <!-- id: 303 -->

## 4. UI Polish & Feedback
- [x] 4.1 Enhance connection status indicators with micro-animations <!-- id: 400 -->
- [x] 4.2 Improve error handling visual feedback within the new flow <!-- id: 401 -->

## 5. Verification
- [x] 5.1 Verify that bot token validation still works correctly <!-- id: 500 -->
- [x] 5.2 Verify that guild and channel selection correctly updates the `settingsStore` <!-- id: 501 -->
- [x] 5.3 Verify that the Discord connection remains stable throughout the navigation <!-- id: 502 -->
