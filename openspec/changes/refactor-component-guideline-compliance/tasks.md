## 1. Refactor Critical Component Files

- [x] 1.1 Refactor `AudioUploader` into composition + dedicated card component.
- [x] 1.2 Refactor `TimelineEditor` by extracting ruler, zoom controls, and track lane rendering.
- [x] 1.3 Refactor `MixerPanel` into channel strip, inspector, VU meter, and master section components.
- [x] 1.4 Refactor `SoundSetBrowser` by extracting creation/list section components.

## 2. Extract Logic from UI Components

- [x] 2.1 Move audio preload logic into `usePreloadAudioElements`.
- [x] 2.2 Keep upload orchestration in `useAudioUploader` and simplify UI component responsibilities.

## 3. Validation

- [x] 3.1 Run `npm run lint:fix`.
- [x] 3.2 Run `npm run typecheck`.
- [x] 3.3 Run relevant test suite.
- [x] 3.4 Validate OpenSpec change with `openspec validate refactor-component-guideline-compliance --strict`.
