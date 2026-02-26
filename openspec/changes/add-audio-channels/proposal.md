# Change: Add Audio Channel System

## Why

The current mixer applies a single global volume to all elements. Users need per-category volume control (music, ambient, effects) with a channel-based routing model. Channels should be configurable per soundset, automatically created with sensible defaults when a mood is created, and manageable through a dedicated sidebar.

## What Changes

- Introduce an **Audio Channel** entity scoped to each SoundSet, with a name, icon identifier, and volume level.
- When a new mood is created, three default channels are auto-created: **Music**, **Ambient**, and **Sound Effects**.
- Each audio element references a channel; element volume is routed through its channel's gain, which itself respects the global volume.
- A right-side sidebar allows users to view, add, rename, reorder, and delete custom channels per soundset.
- Three built-in channels have dedicated icons; custom channels use a generic icon.
- When clicking the "new element" button, a modal (from the shared design system) asks for the file **and** the target channel.
- Channels are included in soundset export data.

## Impact

- Affected specs: `audio-channels` (new)
- Affected code:
  - `src-tauri/src/lib.rs` (new `audio_channels` table, CRUD commands)
  - `src/features/sound-sets/stores/soundSetStore.ts` (channel state)
  - `src/features/audio-engine/stores/audioEngineStore.ts` (channel-based volume routing)
  - `src/features/mixer/components/` (new ChannelSidebar component)
  - `src/features/audio-engine/components/AudioUploader.tsx` (channel selection in new element flow)
  - `src/App.tsx` (sidebar layout slot)
- Dependencies: `add-reusable-modal` (the new element flow uses the shared modal)
