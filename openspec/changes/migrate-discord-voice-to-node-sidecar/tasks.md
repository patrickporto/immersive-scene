## 1. Sidecar Node de voz

- [x] 1.1 Criar runtime sidecar Node com `@discordjs/voice` e contrato IPC de controle (`connect`, `disconnect`, `shutdown`).
- [x] 1.2 Implementar ingestao PCM no sidecar com pacing fixo, buffer limitado e politica de backpressure.
- [x] 1.3 Expor telemetria de streaming no sidecar (`queueDepth`, `underruns`, `droppedFrames`, `reconnectAttempts`, `lastError`).

## 2. Migracao breaking no app

- [x] 2.1 Redirecionar envio de audio Discord no frontend/store para o novo contrato do sidecar.
- [x] 2.2 Remover comandos de voz Discord no backend Rust e eliminar fallback para pipeline antigo.
- [x] 2.3 Remover dependencias e codigo legado Songbird/Serenity relacionados ao streaming de voz.

## 3. UX e observabilidade

- [x] 3.1 Atualizar componentes de estado/telemetria Discord para refletir o novo runtime e novos campos.
- [x] 3.2 Garantir feedback claro de falha de sidecar/conexao sem bloquear controles de transporte.

## 4. Validacao

- [x] 4.1 Adicionar testes de integracao para sequencias `play/pause/stop` com sidecar conectado e em reconexao.
- [x] 4.2 Executar teste de continuidade (soak) com carga de CPU por no minimo 10 minutos e verificar fila limitada.
- [x] 4.3 Validar qualidade/telemetria no Discord com thresholds definidos para underrun e drop.
- [x] 4.4 Executar `npm run lint:fix`, `npm run typecheck`, `cargo check` e validacao do sidecar antes da entrega.
