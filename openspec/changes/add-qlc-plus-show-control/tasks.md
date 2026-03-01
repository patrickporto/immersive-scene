## 1. Settings and Persistence

- [x] 1.1 Extend app settings schema with QLC+ fields (endpoint, auth mode/token, timeout, reconnect policy, stop behavior)
- [x] 1.2 Implement backend commands to read/write QLC+ settings with validation and safe defaults
- [x] 1.3 Add QLC+ tab/section in `SettingsModal` with connection test and status feedback

## 2. Backend QLC+ Adapter

- [x] 2.1 Implement adapter commands: list functions, trigger function, stop function, set parameter, panic
- [x] 2.2 Add connection health check and API compatibility checks
- [x] 2.3 Add structured error mapping for UI-safe messages (timeout, auth failure, endpoint unavailable, unsupported feature)

## 3. QLC+ Function Browser and Controls

- [x] 3.1 Create feature module for QLC+ function catalog state and API actions
- [x] 3.2 Build function listing UI with search/filter/sort and function type badges
- [x] 3.3 Add interaction controls for run/stop/toggle and parameter adjustments where supported

## 4. Timeline Automation Integration

- [x] 4.1 Extend timeline cue model to support QLC+ function cues and cue metadata
- [x] 4.2 Add drag-and-drop from QLC+ function browser into timeline tracks
- [x] 4.3 Execute QLC+ cues from timeline scheduler at precise cue start time
- [x] 4.4 Implement transport stop handling and optional global panic behavior

## 5. Validation

- [x] 5.1 Unit tests for settings parsing/validation and QLC+ adapter command mapping
- [x] 5.2 Component tests for function list rendering, interactions, and drag/drop cue creation
- [x] 5.3 Scheduler tests for cue timing, retries, and stop behavior
- [x] 5.4 Manual rehearsal checklist: configure endpoint, list functions, trigger manually, drag to timeline, run timeline, stop/panic verification
