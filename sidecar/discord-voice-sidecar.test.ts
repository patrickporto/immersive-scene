import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';

import { afterEach, describe, expect, it } from 'vitest';

interface SidecarResponse {
  id: number;
  ok: boolean;
  result: unknown;
  error: string | null;
}

class SidecarHarness {
  private process = spawn('node', [resolve(process.cwd(), 'sidecar/discord-voice-sidecar.cjs')], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  private reader = createInterface({ input: this.process.stdout });
  private pending = new Map<number, (response: SidecarResponse) => void>();
  private nextId = 1;

  constructor() {
    this.reader.on('line', line => {
      const parsed = JSON.parse(line) as SidecarResponse;
      const resolver = this.pending.get(parsed.id);
      if (!resolver) {
        return;
      }

      this.pending.delete(parsed.id);
      resolver(parsed);
    });
  }

  async request(command: string, payload: Record<string, unknown> = {}) {
    const id = this.nextId;
    this.nextId += 1;

    const response = await new Promise<SidecarResponse>((resolveResponse, reject) => {
      this.pending.set(id, resolveResponse);
      this.process.stdin.write(`${JSON.stringify({ id, command, payload })}\n`, error => {
        if (error) {
          reject(error);
        }
      });
    });

    if (!response.ok) {
      throw new Error(response.error ?? 'Unknown sidecar error');
    }

    return response.result;
  }

  async shutdown() {
    try {
      await this.request('shutdown');
    } catch {
      // ignore
    }

    this.reader.close();
    this.process.kill('SIGTERM');
  }
}

describe('discord voice sidecar', () => {
  let harness: SidecarHarness | null = null;

  afterEach(async () => {
    if (harness) {
      await harness.shutdown();
      harness = null;
    }
  });

  it('keeps queue bounded and reports drop telemetry under sustained producer load', async () => {
    harness = new SidecarHarness();

    const packet = new Array<number>(3840).fill(1200);
    for (let i = 0; i < 500; i += 1) {
      await harness.request('sendPcm', { pcmData: packet });
    }

    const telemetry = (await harness.request('getTelemetry')) as {
      queueDepth: number;
      queueCapacity: number;
      chunksDropped: number;
      droppedFrames: number;
    };

    expect(telemetry.queueDepth).toBeLessThanOrEqual(telemetry.queueCapacity);
    expect(telemetry.chunksDropped).toBeGreaterThan(0);
    expect(telemetry.droppedFrames).toBeGreaterThan(0);
  });
});
