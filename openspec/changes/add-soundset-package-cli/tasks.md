## 1. CLI command

- [x] 1.1 Add a new CLI command that receives a source folder path and optional output zip path.
- [x] 1.2 Wire command help/usage text with examples for local packaging.

## 2. Validation

- [x] 2.1 Validate `manifest.json` exists and parses to the export manifest schema.
- [x] 2.2 Validate `format_version` is supported and required fields are present.
- [x] 2.3 Validate each `elements[].archive_path` is safe (relative, no traversal) and exists under the source folder.
- [x] 2.4 Return actionable errors containing the exact failing field/path.

## 3. ZIP generation

- [x] 3.1 Create ZIP with `manifest.json` at root and audio files at their declared archive paths.
- [x] 3.2 Ensure generated ZIP is deterministic enough for repeatable imports (stable file placement and no partial output on validation failure).

## 4. Verification

- [x] 4.1 Add automated tests for successful packaging from a valid folder.
- [x] 4.2 Add automated tests for invalid manifest, missing files, unsupported version, and unsafe paths.
- [x] 4.3 Add integration verification that generated ZIP can be imported by existing soundset import command.
- [x] 4.4 Run `openspec validate add-soundset-package-cli --strict`.
