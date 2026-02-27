## Context

The Immersive Scene app currently plays all audio through the Web Audio API's default `audioContext.destination`, which maps to the system's default output device. This change introduces two new output targets — **system audio devices** (via `setSinkId()`) and **Discord voice channels** (via a bot). Both are cross-cutting: the frontend audio graph, the settings persistence layer, and the Rust backend all need coordinated changes.

## Goals / Non-Goals

- **Goals:**
  - Allow users to select any system audio output device from a dropdown
  - Provide a Discord output mode where audio is streamed to a voice channel via a bot
  - One-click output switching from the bottom player bar (quick picker)
  - Persist selected output device and Discord credentials across sessions
  - Intuitive UX: guided setup for Discord bot token with clear status indicators

- **Non-Goals:**
  - Simultaneous output to multiple devices (future work)
  - Discord bot slash command interface or advanced bot features
  - Microphone input or voice chat mixing
  - Audio quality settings per output device

## Decisions

### Decision 1: System Audio Device Selection via `setSinkId()`

Modern browsers (and Tauri's WebView) support [`AudioContext.setSinkId()`](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/setSinkId) to route audio to a specific output device. We will enumerate devices with `navigator.mediaDevices.enumerateDevices()` (filtering `kind === 'audiooutput'`) and let the user pick one.

- **Alternatives considered:**
  - Rust-side `cpal`/`rodio` device routing → Would require piping all PCM from the browser to Rust. Over-complex; `setSinkId()` is simpler and sufficient.
  - `MediaStreamAudioDestinationNode` + HTMLAudioElement with `setSinkId()` → Needed only as a fallback if `AudioContext.setSinkId()` isn't supported. We'll implement this as the primary fallback path.

### Decision 2: Discord Bot Audio Streaming via Rust (`songbird`)

For Discord output, the Rust backend instantiates a `songbird`-based voice connection using the user-provided bot token. The frontend captures the mixed audio via `MediaStreamAudioDestinationNode`, converts it to raw PCM using an `AudioWorkletNode` or `ScriptProcessorNode`, and sends chunks to Rust via Tauri events. Rust feeds the PCM into `songbird`'s input source.

- **Alternatives considered:**
  - Pure frontend Discord.js approach → Discord voice requires UDP/WebSocket which isn't available in browser contexts. Rust is the only viable path.
  - WebRTC bridge → Over-engineered; `songbird` directly handles Opus encoding and UDP transport.

### Decision 3: Quick Output Switcher in Bottom Player

A speaker/device icon in the `BottomPlayer` opens a small popover listing available outputs (system devices + Discord). This provides fast access without navigating to the full settings modal.

- **Alternatives considered:**
  - Dedicated sidebar section → Too much screen real estate for what's a quick toggle.
  - System tray menu → Not discoverable enough for first-time users.

### Decision 4: Discord Setup UX — Guided Inline Flow

The Discord config section in Settings uses a step-by-step inline flow:
1. **Paste bot token** → validate it by calling Discord REST API (`/users/@me`)
2. Show **bot name + avatar** as confirmation
3. **Select server** (guild) from the bot's joined servers
4. **Select voice channel** from the chosen server
5. **Connect** button with live status indicator (connecting / connected / error)

This avoids separate screens/modals and makes the flow feel lightweight.

## Risks / Trade-offs

- **`setSinkId()` browser support** → Tauri WebView2 (Windows) and WebKitGTK (Linux) may have varying support. Mitigation: implement `HTMLAudioElement.setSinkId()` fallback with `MediaStreamAudioDestinationNode`.
- **Discord bot token security** → Token stored in plaintext `settings.json`. Mitigation: document that users should use a dedicated bot; future work could use OS keychain via `tauri-plugin-keyring`.
- **Audio latency to Discord** → PCM piped from frontend → Rust → Opus → UDP. Mitigation: use large enough buffer sizes (20ms Opus frames are standard); latency is acceptable for ambient soundscapes.
- **Bot needs to be in the server** → Users must invite the bot first. Mitigation: show a "Copy Invite Link" button in the Discord setup flow with the correct permissions URL.

## Open Questions

1. Should we support **simultaneous output** to both system device and Discord in v1, or only one active output at a time? (Recommendation: single output for v1, toggle between them.)
2. Should the Discord bot token be stored per-soundset or globally? (Recommendation: globally in `settings.json`, since it's a single bot identity.)
