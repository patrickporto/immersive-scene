## 1. Backend — Database & Commands

- [ ] 1.1 Add `audio_channels` table to `init_database`
- [ ] 1.2 Add `channel_id` column to `audio_elements` table
- [ ] 1.3 Migration: assign existing elements to a default "Music" channel
- [ ] 1.4 Implement Tauri commands: `create_audio_channel`, `get_audio_channels`, `update_audio_channel`, `delete_audio_channel`, `reorder_audio_channels`
- [ ] 1.5 Implement `seed_default_channels` command (called on mood creation if SoundSet has no channels yet)

## 2. Frontend — Store & Volume Routing

- [ ] 2.1 Add channel state and actions to `soundSetStore.ts`
- [ ] 2.2 Update `audioEngineStore.ts` to create channel GainNodes and route element → channel → global
- [ ] 2.3 Update `setGlobalVolume` and add `setChannelVolume` action

## 3. Frontend — UI

- [ ] 3.1 Create `ChannelSidebar` component (right sidebar, collapsible)
- [ ] 3.2 Add channel icons for Music, Ambient, Sound Effects, and generic
- [ ] 3.3 Update new element flow to use shared modal with channel selector
- [ ] 3.4 Integrate sidebar into `App.tsx` layout

## 4. Validation

- [ ] 4.1 Write store unit tests for channel CRUD and volume routing
- [ ] 4.2 Manual test: create mood → verify 3 default channels appear
- [ ] 4.3 Manual test: add element with channel → verify volume chain works
