# Change: Build Immersive Audio Engine

## Change ID

build-immersive-audio-engine

## Why

Criar uma plataforma de soundscape imersivo para RPGs com áudio espacial 3D, mixagem multi-canal e persistência local.

## What Changes

### Fase 1 (MVP) - Implementando agora:

1. **Database SQLite**: Schema básico para SoundSets, Moods e AudioElements
2. **Upload de arquivos**: Suporte a OGG, MP3, WAV, FLAC
3. **Playback básico**: Web Audio API para reprodução
4. **Mixer simples**: 5 canais com controles de volume
5. **UI básica**: Layout com browser, player e mixer

### Fases Futuras:

- Áudio espacial 3D completo
- Crossfade avançado
- Editor visual drag-and-drop
- Efeitos (reverb, EQ dinâmico)

## Impact

### Novos Módulos:

- `src/features/audio-engine/`
- `src/features/sound-sets/`
- `src/features/mixer/`
- `src-tauri/src/audio/`

### Dependências:

- Rust: `rusqlite`, `rodio`
- Frontend: `@tauri-apps/plugin-sql`, `@tauri-apps/plugin-fs`

## Success Criteria

- [x] Upload de arquivos OGG/MP3/WAV/FLAC funcional
- [x] Reprodução básica via Web Audio API
- [x] 5 canais de mixagem operacionais
- [x] Persistência SQLite funcional
- [x] UI com layout de 3 painéis

## Status

✅ **COMPLETED** - MVP implementado com sucesso
