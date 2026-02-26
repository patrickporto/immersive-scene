## 1. Implementation

- [ ] 1.1 Create `Modal.tsx` in `src/shared/components/` with:
  - `isOpen`, `onClose`, `title`, `children`, `footer`, `size` props
  - Backdrop overlay with click-to-close
  - Escape key to close
  - Focus trapping
  - Motion animations (`AnimatePresence`, fade + scale)
  - Tailwind styling
- [ ] 1.2 Export from `src/shared/components/index.ts`
- [ ] 1.3 Update `AGENTS.md` with Modal component documentation

## 2. Validation

- [ ] 2.1 Write unit test for Modal rendering, open/close behavior, and keyboard handling
- [ ] 2.2 Manual test: render modal in a test page → verify animation, backdrop, escape key
