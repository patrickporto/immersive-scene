## Context

SoundSets encapsulate creative audio work (moods, channels, timelines, clips). Without a portable format, users can't share or back up this work. A ZIP-based archive with a JSON manifest provides both portability and human-readability.

## Goals / Non-Goals

- Goals:
  - A self-contained archive format (`.immersive` or `.zip`) containing all audio files and a JSON metadata manifest.
  - Full round-trip fidelity: export → import recreates the exact same soundset state (moods, channels, timelines, tracks, clips, volumes).
  - Global one-shots are excluded from exports.
- Non-Goals:
  - Streaming or partial import/export.
  - Cloud storage or sharing service integration.
  - Diffing or merging of soundsets.

## Decisions

- Decision: **JSON for metadata (not TOML)**
  - Rationale: The existing Tauri backend already uses `serde_json` extensively. TOML would add a dependency and is less natural for nested structures (timelines → tracks → clips). JSON is universally toolable.
- Decision: **ZIP as container format**
  - Rationale: ZIP is widely supported, handles compression of audio files well, and Rust has mature crates (`zip`). The archive contains a `manifest.json` at the root plus an `audio/` directory.
- Decision: **Backend-driven export/import**
  - Rationale: All data access and file I/O happens through Tauri commands. The frontend only triggers the action and handles progress/error feedback.

## Archive Structure

```
soundset-export.zip
├── manifest.json       # Full metadata
└── audio/
    ├── element-1.ogg
    ├── element-2.mp3
    └── ...
```

### manifest.json Schema

```json
{
  "format_version": 1,
  "soundset": {
    "name": "...",
    "description": "..."
  },
  "channels": [
    { "name": "Music", "icon": "music", "volume": 1.0, "order_index": 0 }
  ],
  "elements": [
    {
      "file_name": "element-1.ogg",
      "archive_path": "audio/element-1.ogg",
      "channel_name": "Music",
      "volume_db": 0.0
    }
  ],
  "moods": [
    {
      "name": "...",
      "description": "...",
      "timeline": {
        "is_looping": false,
        "tracks": [
          {
            "name": "Track 1",
            "order_index": 0,
            "clips": [
              {
                "element_file_name": "element-1.ogg",
                "start_time_ms": 0,
                "duration_ms": 30000
              }
            ]
          }
        ]
      }
    }
  ]
}
```

## Risks / Trade-offs

- Risk: Large audio collections may produce very large archives.
  - Mitigation: Show progress during export/import. Consider optional compression level settings in future.
- Risk: Import may conflict with existing soundsets (name collision).
  - Mitigation: Append a suffix or prompt the user to rename on collision.
