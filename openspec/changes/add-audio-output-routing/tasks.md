## 1. System Audio Device Enumeration & Selection

- [ ] 1.1 Add `output_device_id` field to `AppSettings` struct in `src-tauri/src/lib.rs` and `settingsStore.ts` (default: `""` = system default)
- [ ] 1.2 Create `useAudioDevices` hook (`src/features/audio-engine/hooks/useAudioDevices.ts`) that calls `navigator.mediaDevices.enumerateDevices()` and filters `audiooutput` devices
- [ ] 1.3 Update `initAudioContext` in `audioEngineStore.ts` to call `audioContext.setSinkId()` with the persisted device ID on init
- [ ] 1.4 Add `setOutputDevice(deviceId)` action to `audioEngineStore.ts` that calls `setSinkId()` at runtime

## 2. Audio Output Section in Settings Modal

- [ ] 2.1 Add "Audio Output" section to `SettingsModal.tsx` with a dropdown listing system devices (from `useAudioDevices`)
- [ ] 2.2 Show device label and "Default" for the system default option
- [ ] 2.3 Persist selection to `settings.json` via `updateSettings`

## 3. Quick Output Switcher (Bottom Player)

- [ ] 3.1 Create `OutputDevicePicker` component (`src/features/audio-engine/components/OutputDevicePicker.tsx`) — a popover triggered by a speaker icon
- [ ] 3.2 Show available system devices and Discord (if configured) as selectable items with active indicator
- [ ] 3.3 Integrate picker into `BottomPlayer.tsx`

## 4. Discord Bot Integration — Backend

- [ ] 4.1 Add `songbird` and `serenity` dependencies to `Cargo.toml`
- [ ] 4.2 Create `src-tauri/src/discord.rs` module with:
  - Bot token validation via Discord REST API (`GET /users/@me`)
  - Guild/channel listing (`GET /users/@me/guilds`, `GET /guilds/{id}/channels`)
  - Voice connection management using `songbird`
  - PCM audio input source that receives chunks from frontend
- [ ] 4.3 Register Tauri commands: `discord_validate_token`, `discord_list_guilds`, `discord_list_voice_channels`, `discord_connect`, `discord_disconnect`, `discord_send_audio`
- [ ] 4.4 Add `discord_bot_token`, `discord_guild_id`, `discord_channel_id` fields to `AppSettings`

## 5. Discord Bot Integration — Frontend

- [ ] 5.1 Add Discord config section to `SettingsModal.tsx` with guided inline flow:
  - Token input → validate → show bot info
  - Server selector → channel selector → connect button
  - Status indicator (disconnected / connecting / connected / error)
- [ ] 5.2 Create `useDiscordConnection` hook (`src/features/settings/hooks/useDiscordConnection.ts`) to manage state and Tauri command calls
- [ ] 5.3 Add `MediaStreamAudioDestinationNode` path in `audioEngineStore.ts` to capture mixed audio for Discord streaming
- [ ] 5.4 Implement `AudioWorkletNode` or `ScriptProcessorNode` to extract PCM from the MediaStream and send via Tauri events to Rust

## 6. Output Device Picker Integration with Discord

- [ ] 6.1 Add "Discord" entry to `OutputDevicePicker` with connection status badge
- [ ] 6.2 When Discord is selected as output, start streaming; when switching away, stop streaming
- [ ] 6.3 Show helpful tooltip when Discord is not configured ("Set up in Settings")

## 7. Validation

- [ ] 7.1 Manual test: open Settings → Audio Output → select a different system device → audio routes to it
- [ ] 7.2 Manual test: switch back to "Default" → audio returns to system default
- [ ] 7.3 Manual test: open quick output picker from bottom player → select device → verify audio routing
- [ ] 7.4 Manual test: paste a valid Discord bot token in Settings → verify bot info appears
- [ ] 7.5 Manual test: select server + voice channel → click Connect → verify bot joins the channel
- [ ] 7.6 Manual test: play audio → verify audio is heard in the Discord voice channel
- [ ] 7.7 Manual test: switch output from Discord back to system device → verify Discord streaming stops
