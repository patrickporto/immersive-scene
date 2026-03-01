class DiscordCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.frameSamples = 960; // 20ms @ 48kHz
    this.channels = 2;
    this.framesPerPacket = 2; // 40ms payload to reduce IPC jitter
    this.packetValues = this.frameSamples * this.channels * this.framesPerPacket;
    this.buffer = new Int16Array(this.packetValues);
    this.bufferIndex = 0;
    this.pendingPackets = [];
    this.maxPendingPackets = 8;
    this.packetHasSignal = false;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    if (!input || input.length === 0) {
      return true;
    }

    const left = input[0];
    const right = input[1] || input[0];
    if (!left) {
      return true;
    }

    const frames = left.length;
    for (let i = 0; i < frames; i += 1) {
      const l = Math.max(-1, Math.min(1, left[i]));
      const r = Math.max(-1, Math.min(1, right[i]));

      this.buffer[this.bufferIndex] = Math.round(l * 32767);
      this.buffer[this.bufferIndex + 1] = Math.round(r * 32767);
      if (Math.abs(l) > 0.0005 || Math.abs(r) > 0.0005) {
        this.packetHasSignal = true;
      }
      this.bufferIndex += 2;

      if (this.bufferIndex >= this.packetValues) {
        if (this.packetHasSignal) {
          const packet = this.buffer;
          this.pendingPackets.push(packet.buffer);
          if (this.pendingPackets.length > this.maxPendingPackets) {
            this.pendingPackets.shift();
          }

          while (this.pendingPackets.length > 0) {
            const next = this.pendingPackets.shift();
            if (!next) {
              break;
            }
            this.port.postMessage(next, [next]);
          }
        }

        this.buffer = new Int16Array(this.packetValues);
        this.bufferIndex = 0;
        this.packetHasSignal = false;
      }
    }

    return true;
  }
}

registerProcessor('discord-capture-processor', DiscordCaptureProcessor);
