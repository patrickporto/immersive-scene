## Context

The project already exports and imports SoundSets as ZIP archives using a JSON manifest contract. Users now need a CLI-first packaging flow where they can prepare a folder manually (or from another pipeline), validate it, and produce an archive that imports without custom fixes.

## Goals / Non-Goals

- Goals:
  - Provide one CLI command for folder validation + ZIP generation.
  - Guarantee produced ZIP layout is compatible with existing import flow.
  - Fail fast with actionable errors before writing invalid archives.
- Non-Goals:
  - Creating or editing manifest content automatically.
  - Supporting alternate manifest schemas beyond current export contract.
  - Replacing existing UI export/import workflows.

## Decisions

- Decision: Reuse the existing `ExportManifest` schema as canonical input.
  - Why: Keeps import/export/CLI contract unified and prevents format drift.
- Decision: Validate all file references before creating ZIP output.
  - Why: Prevents partially written archives and catches missing assets early.
- Decision: Enforce safe relative `archive_path` entries (no absolute paths and no `..`).
  - Why: Avoids zip-slip style path traversal and keeps archive structure predictable.
- Decision: Keep command scope minimal (single folder in, single zip out).
  - Why: Meets the request with low complexity and fast adoption.

## Risks / Trade-offs

- Risk: Strict validation may reject user-authored manifests that imported previously by accident.
  - Mitigation: Return exact validation errors and expected path examples.
- Trade-off: Single-command flow is intentionally narrow.
  - Mitigation: Future flags can be added only if real workflows require them.

## Migration Plan

1. Introduce CLI command and manifest/file validation layer.
2. Reuse or factor shared manifest checks used by import/export.
3. Add tests for success and failure cases.
4. Document usage examples for content creators.

## Open Questions

- None blocking for proposal stage. Default output path is defined as `<soundset-name>.zip` in current working directory.
