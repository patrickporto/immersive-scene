# Proposal: Refactor Realtime Audio Routing Pipeline

## Why

The current transport flow (`start`, `pause`, `stop`) is tightly coupled to routing and bridge health, so UI actions can block or feel delayed during Discord reconnect/recovery paths. Audio quality is also sensitive to IPC jitter, causing audible cuts under load even when packets are flowing.

## What Changes

1. Introduce a non-blocking transport command path that decouples UI intent from routing/bridge execution.
2. Define a deterministic transport state machine with command coalescing for rapid user actions.
3. Add explicit buffering strategy (capture buffer + jitter buffer + bounded backpressure policy) for Discord streaming stability.
4. Add paced egress for Discord audio packets to avoid bursty delivery and reduce underruns.
5. Harden bridge lifecycle so pause/stop/start remain instant even while routing recovers.
6. Add transport/routing telemetry to measure latency, queue depth, underruns, and recovery events.

## Impact

- Affected specs: `realtime-transport-controls`, `discord-streaming-quality`
- Affected code:
  - `src/features/audio-engine/stores/audioEngineStore.ts`
  - `src/features/mixer/components/BottomPlayer.tsx`
  - `src-tauri/src/discord.rs`
  - `src-tauri/src/lib.rs`
  - `public/worklets/discord-capture-processor.js`
