## 1. Data Model and Backend

- [ ] 1.1 Enforce one timeline per mood in backend commands and persistence path.
- [ ] 1.2 Add migration to resolve existing moods that currently have multiple timelines.
- [ ] 1.3 Add backend validation preventing overlap within the same track on insert/update.

## 2. Timeline UX and Layout

- [ ] 2.1 Remove timeline selection/list UX and bind timeline editor to mood singleton timeline.
- [ ] 2.2 Move timeline panel below bottom player and apply discrete collapsed visual treatment.
- [ ] 2.3 Preserve explicit expand/collapse control for the timeline panel.
- [ ] 2.4 Add client-side overlap prevention feedback during drag/drop and clip repositioning.

## 3. Unified Playback and Context

- [ ] 3.1 Centralize play/pause/stop in bottom player and remove duplicated timeline transport controls.
- [ ] 3.2 Implement mood-to-mood crossfade when transport switches active mood while playback is running.
- [ ] 3.3 Add and maintain active playback context state independent from selection state.
- [ ] 3.4 Render bottom player metadata from active playback context (soundset + mood currently audible).

## 4. Validation

- [ ] 4.1 Add tests for singleton timeline behavior and migration outcomes.
- [ ] 4.2 Add tests for overlap rejection in create/move timeline element flows.
- [ ] 4.3 Add tests for unified transport behavior and mood crossfade transitions.
- [ ] 4.4 Run `npm run lint:fix`, `npm run typecheck`, and targeted test suites.
