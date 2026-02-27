# Change: Add Audio Output Routing

## Why

Users currently have no control over which audio output device the application uses — audio always goes to the system default. For a tabletop RPG soundscape tool, users need to route audio to specific hardware (e.g. external speakers, a dedicated headset, or a virtual cable) and, critically, to a **Discord voice channel** so remote players hear the ambiance in real time without screen sharing.

## What Changes

- Add an **Audio Output** section inside the existing App Settings modal with a dropdown to select from available system audio output devices.
- Introduce a **Discord Bot** output option where the user provides a Bot Token and selects a voice channel. The app streams the mixed audio to Discord via the bot.
- A prominent **quick-access button** in the bottom player bar lets users switch output devices without opening the full settings modal — similar to how Spotify shows a device picker.
- The audio engine's `initAudioContext` is updated to use `setSinkId()` for hardware device selection and a parallel `MediaStreamDestination` node for Discord streaming.
- The Rust backend handles Discord Gateway/Voice connection via `serenity` or `songbird`, receiving raw PCM from the frontend and transmitting it to the voice channel.

## Impact

- Affected specs: `audio-output-routing` (new), `discord-audio-output` (new), `app-settings` (modified — new fields)
- Affected code:
  - `src/features/audio-engine/stores/audioEngineStore.ts` (output device routing, MediaStream capture)
  - `src/features/settings/stores/settingsStore.ts` (new fields: `output_device_id`, `discord_bot_token`, `discord_guild_id`, `discord_channel_id`)
  - `src/features/settings/components/SettingsModal.tsx` (new "Audio Output" section with device list, Discord config)
  - `src/features/mixer/components/BottomPlayer.tsx` (quick output switcher button)
  - `src-tauri/src/lib.rs` (device enumeration pass-through, AppSettings struct update)
  - `src-tauri/src/discord.rs` (new — Discord bot gateway, voice connection, audio streaming)
  - `Cargo.toml` (new dependency: `serenity` or `songbird` for Discord voice)
- Dependencies: `add-app-settings` (extends settings schema), `add-reusable-modal` (uses shared modal)
