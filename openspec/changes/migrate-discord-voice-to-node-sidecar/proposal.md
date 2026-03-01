# Change: migrar transporte de voz do Discord para sidecar Node

## Why

A qualidade de audio no pipeline atual (WebAudio -> Tauri Rust -> Songbird/Serenity) esta instavel sob jitter de IPC e variacao de carga, com quedas e artefatos perceptiveis. Precisamos migrar para um runtime de voz focado no ecossistema Discord em Node para melhorar continuidade e previsibilidade operacional.

## What Changes

- **BREAKING** substituir o runtime de voz Discord em Rust (Songbird/Serenity) por um sidecar Node baseado em `@discordjs/voice`.
- **BREAKING** remover compatibilidade retroativa: nao havera fallback para o pipeline Rust antigo.
- Introduzir contrato IPC explicito entre app desktop e sidecar para: conectar/desconectar, enviar PCM, consultar telemetria e estado de reconexao.
- Centralizar buffering, pacing e backpressure no sidecar Node com politicas deterministicas.
- Atualizar telemetria e UX de status para refletir o novo runtime e diagnosticos de qualidade.

## Impact

- Affected specs: `discord-audio-output`, `discord-streaming-quality`
- Affected code:
  - `src-tauri/src/discord.rs` e registro de comandos em `src-tauri/src/lib.rs`
  - `src/features/audio-engine/stores/audioEngineStore.ts`
  - `src/features/mixer/components/BottomPlayer.tsx`
  - `src/features/mixer/components/DiscordTelemetry.tsx`
  - novo pacote/processo sidecar Node (voz)
  - pipeline de build/distribuicao para incluir sidecar
