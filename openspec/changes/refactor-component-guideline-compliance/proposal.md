# Change: Refactor component guideline compliance

## Why

Core UI files were violating architectural rules from `AGENTS.md`, with oversized components, multiple components per file, and business logic mixed directly into presentation files. This made features harder to maintain and increased regression risk during timeline and mixer updates.

## What Changes

- Refactor large feature components into smaller composition units.
- Ensure feature components follow one-component-per-file.
- Extract heavy workflows into focused hooks.
- Remove inline timeline sub-structures into dedicated components.
- Keep visual behavior intact while reducing component complexity.

## Impact

- Affected specs: `component-architecture`
- Affected code:
  - `src/features/audio-engine/components/AudioUploader.tsx`
  - `src/features/audio-engine/components/TimelineEditor.tsx`
  - `src/features/mixer/components/MixerPanel.tsx`
  - `src/features/sound-sets/components/SoundSetBrowser.tsx`
  - `src/features/audio-engine/hooks/useAudioUploader.ts`
