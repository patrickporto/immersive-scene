## 1. Data Model and Backend

- [x] 1.1 Add/confirm persistent model for timeline tracks and scheduled clips (`startMs`, `durationMs`, order index, element reference).
- [x] 1.2 Add/confirm timeline loop flag and playback metadata in backend commands.
- [x] 1.3 Add migration/backfill so soundset elements are available across all moods in the same soundset.

## 2. Timeline Editing UX

- [x] 2.1 Implement timeline grid with explicit clip start positioning and visible empty gaps.
- [x] 2.2 Implement track CRUD (add, remove, reorder) with clear controls and drag support where applicable.
- [x] 2.3 Implement clip drag/reposition and ordering behavior with collision rules and snapping strategy.

## 3. Element Interactions

- [ ] 3.1 Implement drag-to-one-shot conversion flow and state update.
- [ ] 3.2 Improve element card playback feedback so currently playing clips/elements are obvious.
- [x] 3.3 Ensure all elements remain playable directly, independent of timeline mode.

## 4. Playback Engine and Bottom Bar

- [x] 4.1 Schedule timeline playback using clip `startMs` and preserve silence gaps.
- [x] 4.2 Implement timeline loop playback behavior.
- [x] 4.3 Implement crossfade between timeline transitions and/or track handoffs.
- [x] 4.4 Upgrade bottom bar play controls for timeline-aware play/pause/stop and loop state.

## 5. Validation

- [x] 5.1 Add unit/integration tests for scheduling (`startMs`, gaps, loop).
- [x] 5.2 Add interaction tests for track management and drag-drop workflows.
- [x] 5.3 Run `npm run lint:fix`, `npm run typecheck`, and relevant test suites.
