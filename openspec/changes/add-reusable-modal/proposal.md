# Change: Add Reusable Modal Component

## Why

The application needs a shared modal dialog for multiple features (new element creation with channel selection, app settings, confirmations). Currently no reusable modal component exists in the design system. Building one shared component ensures consistent behavior, animation, and accessibility across all use cases.

## What Changes

- Create a reusable `Modal` component in `src/shared/components/Modal.tsx`.
- The modal MUST support:
  - Title, content (children), and footer actions.
  - Backdrop overlay with click-to-close behavior.
  - Keyboard accessibility (Escape to close, focus trapping).
  - Motion animations (fade + scale entrance/exit using `AnimatePresence`).
  - Configurable size variants.
- Export from `src/shared/components/index.ts`.
- Update `AGENTS.md` with the new component documentation.

## Impact

- Affected specs: `design-system` (new capability)
- Affected code:
  - `src/shared/components/Modal.tsx` (new)
  - `src/shared/components/index.ts`
  - `AGENTS.md` (design system documentation)
- Dependents: `add-audio-channels`, `add-app-settings` (both consume this modal)
