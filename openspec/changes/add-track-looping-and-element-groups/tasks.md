## 1. Backend: Track Looping

- [ ] 1.1 Add `is_looping BOOLEAN DEFAULT FALSE` column to `timeline_tracks` table (migration)
- [ ] 1.2 Update `get_timeline_tracks` command to return `is_looping` field
- [ ] 1.3 Add `set_track_looping` command (`track_id`, `is_looping`)
- [ ] 1.4 Update `toggle_timeline_loop` to propagate `is_looping` to all tracks

## 2. Backend: Audio Element Groups

- [ ] 2.1 Create `element_groups` table (`id`, `name`, `sound_set_id` nullable, `created_at`)
- [ ] 2.2 Create `element_group_members` table (`id`, `group_id`, `audio_element_id`, `order_index`)
- [ ] 2.3 Add `element_group_id` nullable column to `timeline_elements` table
- [ ] 2.4 Add CRUD commands: `create_element_group`, `rename_element_group`, `delete_element_group`
- [ ] 2.5 Add member commands: `add_element_to_group`, `remove_element_from_group`, `get_group_members`
- [ ] 2.6 Add `get_element_groups` command (by `sound_set_id` or global)
- [ ] 2.7 Update `add_element_to_track` to accept optional `element_group_id`

## 3. Frontend: Track Looping Store & Scheduling

- [ ] 3.1 Update `TimelineTrack` interface in `timelineStore.ts` to include `is_looping`
- [ ] 3.2 Add `setTrackLooping` action to timeline store
- [ ] 3.3 Update `crossfadeToTimeline` in `audioEngineStore.ts` to schedule per-track loop restarts
- [ ] 3.4 Ensure `setTimelineLoopEnabled` propagates `is_looping` to all tracks

## 4. Frontend: Track Looping UI

- [ ] 4.1 Add loop toggle button to `TimelineTrackLane.tsx` track header
- [ ] 4.2 Add visual loop indicator (icon/badge) when track is looping
- [ ] 4.3 Style loop toggle with active/inactive states

## 5. Frontend: Element Group Store

- [ ] 5.1 Create `elementGroupStore.ts` with group CRUD and member management actions
- [ ] 5.2 Update `audioEngineStore.ts` with random selection logic (no-immediate-repeat)

## 6. Frontend: Element Group UI

- [ ] 6.1 Create `ElementGroupCard.tsx` with stacked/layered visual design
- [ ] 6.2 Add "Create Group" action to element library
- [ ] 6.3 Add drag-and-drop to add elements to group
- [ ] 6.4 Show group member count and quick-preview on hover
- [ ] 6.5 Support group cards in the One Shots section (global one-shot groups)
- [ ] 6.6 Support placing groups on timeline tracks

## 7. Validation

- [ ] 7.1 Verify track loop toggle persists through page refresh
- [ ] 7.2 Verify looping track restarts independently while other tracks play through
- [ ] 7.3 Verify element group CRUD (create, add members, remove, delete)
- [ ] 7.4 Verify random selection plays different elements on consecutive triggers
- [ ] 7.5 Verify group works as global one-shot and as timeline clip
