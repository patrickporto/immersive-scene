## Context

O aplicativo atualmente usa um pipeline de voz Discord implementado no backend Rust, com envio de PCM via IPC e ponte de reproducao em Songbird. Apesar de ajustes recentes de pacing e buffer, o comportamento sob carga segue inconsistente para uso continuo.

## Goals / Non-Goals

- Goals:
  - Migrar o transporte de voz para sidecar Node com `@discordjs/voice`.
  - Eliminar o runtime Rust de voz Discord sem fallback legado.
  - Definir contrato IPC estavel para comandos de controle, ingestao de audio e telemetria.
  - Melhorar continuidade (menos stutter), visibilidade de falhas e recuperacao.
- Non-Goals:
  - Reescrever motor de audio local (WebAudio) fora da integracao de saida Discord.
  - Suportar operacao simultanea de dois runtimes de voz (Rust + Node).
  - Introduzir codec/protocolo proprietario alem do necessario para voz Discord.

## Decisions

- Decision: runtime de voz Discord passa a ser sidecar Node dedicado.
  - Rationale: `@discordjs/voice` oferece fluxo de voz maduro para Discord e reduz atrito de manutencao para reconexao/estado de voz.

- Decision: migracao breaking, sem backwards compatibility.
  - Rationale: manter dois runtimes aumenta superficie de erro e complexidade operacional; objetivo e convergir para um unico caminho.

- Decision: adotar contrato IPC explicito com mensagens de comando e telemetria.
  - Comandos minimos: `connect`, `disconnect`, `sendPcm`, `getTelemetry`, `shutdown`.
  - Telemetria minima: `queueDepth`, `queueCapacity`, `underruns`, `droppedFrames`, `reconnectAttempts`, `lastError`, `connected`.

- Decision: backpressure no sidecar com buffer limitado e politica de descarte definida.
  - Rationale: evitar crescimento nao limitado de memoria e latencia acumulada.

## Alternatives Considered

- Ajustar ainda mais o pipeline Rust atual.
  - Rejeitado para esta mudanca: melhoria incremental nao resolveu qualidade de forma consistente no uso alvo.

- Servico remoto de voz fora da maquina local.
  - Rejeitado: adiciona dependencia de infraestrutura e latencia de rede sem necessidade para o escopo desktop.

## Risks / Trade-offs

- Empacotamento e distribuicao ficam mais complexos por incluir runtime/processo Node.
  - Mitigacao: checklist de build por plataforma e health-check de startup do sidecar.

- Maior dependencia em IPC entre app e sidecar.
  - Mitigacao: protocolo enxuto, timeout padrao e comportamento fail-fast com feedback ao usuario.

- Mudanca breaking pode interromper fluxos existentes durante rollout.
  - Mitigacao: migracao guiada nas configuracoes e mensagens claras em caso de incompatibilidade.

## Migration Plan

1. Introduzir sidecar Node e contrato IPC de voz.
2. Redirecionar fluxo de audio Discord do frontend para o sidecar.
3. Atualizar telemetria e estados de UX para o novo contrato.
4. Remover comandos Rust de voz Discord e dependencias Songbird/Serenity.
5. Validar continuidade/latencia e empacotamento em plataformas suportadas.

## Open Questions

- Confirmar nomenclatura do pacote alvo como `@discordjs/voice` (interpretando o pedido `@discord/voice` como referencia a esse pacote).
- Definir formato de transporte IPC final (stdio, socket local, ou invoke + ponte no backend) na etapa de implementacao.
