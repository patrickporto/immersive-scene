## Context

The current audio engine manages a flat `globalVolume` that scales every element uniformly. The user needs a channel-based volume hierarchy: `Global Volume → Channel Volume → Element Volume`. Channels are per-soundset entities, and moods inherit them.

## Goals / Non-Goals

- Goals:
  - Audio channels as a first-class entity in the data model (`audio_channels` table).
  - Volume chain: element gain → channel gain → global gain.
  - Default channels automatically seeded when a mood is created: Music, Ambient, Sound Effects.
  - Right sidebar for viewing and managing channels.
  - Icons for built-in channels; generic icon for custom channels.
  - Channel selection when adding a new element (via shared modal).
- Non-Goals:
  - Per-element pan, EQ, or spatial audio routing through channels.
  - Channel grouping or sub-buses beyond a flat list.

## Decisions

- Decision: **Channels scoped to SoundSet, not Mood**
  - Rationale: Elements already belong to a SoundSet. Channels follow the same scope so any element-channel assignment is valid across all moods in the set.
- Decision: **Default channels auto-created on mood creation**
  - Rationale: This gives every mood a usable starting point. Channels are tied to the SoundSet, so this only creates the defaults if they don't already exist for that SoundSet.
- Decision: **Volume routing via Web Audio GainNode chain**
  - Rationale: The existing architecture already uses GainNodes per element. Adding a channel GainNode between the element and the AudioContext destination is a clean extension.

## Risks / Trade-offs

- Risk: Changing volume routing may break existing playback if migration doesn't assign a default channel to existing elements.
  - Mitigation: Migration assigns all existing elements to a "Music" channel by default.
- Risk: Right sidebar may crowd the UI on small screens.
  - Mitigation: Sidebar starts collapsed and can be toggled.

## Audio Volume Chain

```
Element GainNode → Channel GainNode → Global GainNode → AudioContext.destination
```

## Database Schema Addition

```sql
CREATE TABLE audio_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sound_set_id INTEGER NOT NULL REFERENCES sound_sets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'generic',
  volume REAL NOT NULL DEFAULT 1.0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- audio_elements gains a channel_id FK
ALTER TABLE audio_elements ADD COLUMN channel_id INTEGER REFERENCES audio_channels(id);
```
