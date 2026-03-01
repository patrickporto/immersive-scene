const readline = require('node:readline');
const { PassThrough } = require('node:stream');

const {
  AudioPlayerStatus,
  EndBehaviorType,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
} = require('@discordjs/voice');
const { Client, GatewayIntentBits } = require('discord.js');
const prism = require('prism-media');

const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const FRAME_SIZE = 960;
const PCM_PACKET_MS = 20;
const MAX_QUEUE = 192;
const PCM_BYTES_PER_SAMPLE = 2;
const EXPECTED_PACKET_SAMPLES = FRAME_SIZE * CHANNELS * 2;
const FRAME_BYTES = FRAME_SIZE * CHANNELS * PCM_BYTES_PER_SAMPLE;
const START_BUFFER_FRAMES = 4;

/** @type {Client | null} */
let client = null;
let currentToken = null;
/** @type {import('@discordjs/voice').VoiceConnection | null} */
let voiceConnection = null;
/** @type {ReturnType<typeof createAudioPlayer> | null} */
let audioPlayer = null;
/** @type {PassThrough | null} */
let pcmInput = null;
/** @type {import('prism-media').opus.Encoder | null} */
let opusEncoder = null;
/** @type {NodeJS.Timeout | null} */
let pumpInterval = null;
let playbackPrimed = false;

/** @type {Buffer[]} */
const pcmQueue = [];

const telemetry = {
  connected: false,
  guildId: null,
  channelId: null,
  chunksSent: 0,
  chunksDropped: 0,
  queueDepth: 0,
  queueCapacity: MAX_QUEUE,
  underruns: 0,
  droppedFrames: 0,
  reconnectAttempts: 0,
  lastError: null,
};

process.on('uncaughtException', error => {
  telemetry.lastError = `Uncaught exception: ${error instanceof Error ? error.message : String(error)}`;
  process.stderr.write(`[discord-sidecar] ${telemetry.lastError}\n`);
});

process.on('unhandledRejection', reason => {
  telemetry.lastError = `Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`;
  process.stderr.write(`[discord-sidecar] ${telemetry.lastError}\n`);
});

function respond(id, ok, result, error) {
  process.stdout.write(
    `${JSON.stringify({
      id,
      ok,
      result: result ?? null,
      error: error ?? null,
    })}\n`
  );
}

function fail(message) {
  telemetry.lastError = message;
  throw new Error(message);
}

function ensureAudioPipeline() {
  if (audioPlayer && pcmInput && opusEncoder) {
    return;
  }

  audioPlayer = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
      maxMissedFrames: 5,
    },
  });

  pcmInput = new PassThrough({
    highWaterMark: MAX_QUEUE * FRAME_BYTES,
  });
  opusEncoder = new prism.opus.Encoder({
    rate: SAMPLE_RATE,
    channels: CHANNELS,
    frameSize: FRAME_SIZE,
  });

  pcmInput.pipe(opusEncoder);

  const resource = createAudioResource(opusEncoder, {
    inputType: StreamType.Opus,
    inlineVolume: false,
    silencePaddingFrames: 0,
  });

  audioPlayer.play(resource);

  audioPlayer.on('error', error => {
    telemetry.lastError = `Audio player error: ${error.message}`;
  });

  audioPlayer.on(AudioPlayerStatus.Idle, () => {
    // keep pipeline alive for continuous stream
  });

  if (pumpInterval) {
    clearInterval(pumpInterval);
  }

  const silenceChunk = Buffer.alloc(FRAME_BYTES);
  pumpInterval = setInterval(() => {
    if (!pcmInput) {
      return;
    }

    if (!playbackPrimed) {
      if (pcmQueue.length >= START_BUFFER_FRAMES) {
        playbackPrimed = true;
      } else {
        telemetry.queueDepth = pcmQueue.length;
        pcmInput.write(silenceChunk);
        return;
      }
    }

    const next = pcmQueue.shift();
    telemetry.queueDepth = pcmQueue.length;

    if (!next) {
      telemetry.underruns += 1;
      playbackPrimed = false;
      pcmInput.write(silenceChunk);
      return;
    }

    pcmInput.write(next);
  }, PCM_PACKET_MS);
}

async function ensureClient(token) {
  if (client && currentToken === token && client.isReady()) {
    return client;
  }

  if (client) {
    try {
      await client.destroy();
    } catch {
      // ignore
    }
    client = null;
    currentToken = null;
  }

  client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Discord ready timeout')), 15000);

    client.once('clientReady', () => {
      clearTimeout(timeout);
      resolve();
    });

    client
      .login(token)
      .then(() => {
        currentToken = token;
      })
      .catch(error => {
        clearTimeout(timeout);
        reject(error);
      });
  });

  return client;
}

async function handleConnect(payload) {
  const token = String(payload?.token ?? '').trim();
  const guildId = String(payload?.guildId ?? '').trim();
  const channelId = String(payload?.channelId ?? '').trim();

  if (!token || !guildId || !channelId) {
    fail('Missing token, guildId or channelId for Discord connect');
  }

  const readyClient = await ensureClient(token);
  const guild = await readyClient.guilds.fetch(guildId).catch(() => null);
  if (!guild) {
    fail(`Guild ${guildId} not found for bot`);
  }

  await guild.channels.fetch(channelId);

  ensureAudioPipeline();

  voiceConnection?.destroy();
  voiceConnection = joinVoiceChannel({
    guildId,
    channelId,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });

  voiceConnection.on('stateChange', async (_oldState, newState) => {
    if (newState.status === VoiceConnectionStatus.Disconnected) {
      telemetry.reconnectAttempts += 1;
      try {
        await Promise.race([
          entersState(voiceConnection, VoiceConnectionStatus.Signalling, 5000),
          entersState(voiceConnection, VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch {
        telemetry.lastError = 'Discord voice disconnected and could not reconnect';
        voiceConnection?.destroy();
        telemetry.connected = false;
      }
    }

    if (newState.status === VoiceConnectionStatus.Destroyed) {
      telemetry.connected = false;
    }
  });

  await entersState(voiceConnection, VoiceConnectionStatus.Ready, 15000);

  if (audioPlayer) {
    voiceConnection.subscribe(audioPlayer);
  }

  pcmQueue.length = 0;
  telemetry.queueDepth = 0;
  playbackPrimed = false;

  telemetry.connected = true;
  telemetry.guildId = guildId;
  telemetry.channelId = channelId;
  telemetry.lastError = null;
}

async function handleDisconnect() {
  voiceConnection?.destroy();
  voiceConnection = null;
  telemetry.connected = false;
  telemetry.guildId = null;
  telemetry.channelId = null;
  pcmQueue.length = 0;
  telemetry.queueDepth = 0;
  playbackPrimed = false;
}

function handleSendPcm(payload) {
  const samples = payload?.pcmData;
  if (!Array.isArray(samples) || samples.length === 0) {
    return;
  }

  if (samples.length !== EXPECTED_PACKET_SAMPLES) {
    telemetry.chunksDropped += 1;
    telemetry.droppedFrames += Math.floor(samples.length / CHANNELS);
    telemetry.lastError = `Invalid PCM packet size: ${samples.length}`;
    return;
  }

  const packet = Buffer.alloc(samples.length * PCM_BYTES_PER_SAMPLE);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Number(samples[i]) || 0;
    const clamped = Math.max(-32768, Math.min(32767, sample));
    packet.writeInt16LE(clamped, i * PCM_BYTES_PER_SAMPLE);
  }

  const firstFrame = packet.subarray(0, FRAME_BYTES);
  const secondFrame = packet.subarray(FRAME_BYTES);

  const enqueueFrame = frame => {
    if (pcmQueue.length >= MAX_QUEUE) {
      pcmQueue.shift();
      telemetry.chunksDropped += 1;
      telemetry.droppedFrames += FRAME_SIZE;
    }

    pcmQueue.push(Buffer.from(frame));
  };

  enqueueFrame(firstFrame);
  enqueueFrame(secondFrame);

  telemetry.queueDepth = pcmQueue.length;
  telemetry.chunksSent += 1;
}

function getTelemetry() {
  return {
    connected: telemetry.connected,
    guildId: telemetry.guildId,
    channelId: telemetry.channelId,
    chunksSent: telemetry.chunksSent,
    chunksDropped: telemetry.chunksDropped,
    queueDepth: telemetry.queueDepth,
    queueCapacity: telemetry.queueCapacity,
    underruns: telemetry.underruns,
    droppedFrames: telemetry.droppedFrames,
    reconnectAttempts: telemetry.reconnectAttempts,
    lastError: telemetry.lastError,
  };
}

async function handleShutdown() {
  await handleDisconnect();

  if (pumpInterval) {
    clearInterval(pumpInterval);
    pumpInterval = null;
  }

  if (pcmInput) {
    pcmInput.end();
    pcmInput = null;
  }

  if (opusEncoder) {
    opusEncoder.destroy();
    opusEncoder = null;
  }

  if (audioPlayer) {
    audioPlayer.stop(true);
    audioPlayer = null;
  }

  if (client) {
    await client.destroy();
    client = null;
    currentToken = null;
  }
}

async function dispatch(request) {
  switch (request.command) {
    case 'connect':
      await handleConnect(request.payload);
      return { connected: true };
    case 'disconnect':
      await handleDisconnect();
      return { connected: false };
    case 'sendPcm':
      handleSendPcm(request.payload);
      return { accepted: true };
    case 'getTelemetry':
      return getTelemetry();
    case 'shutdown':
      await handleShutdown();
      return { shutdown: true };
    default:
      fail(`Unsupported sidecar command: ${request.command}`);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on('line', async line => {
  let request;
  try {
    request = JSON.parse(line);
  } catch (error) {
    respond(0, false, null, `Invalid JSON request: ${String(error)}`);
    return;
  }

  const id = Number(request.id) || 0;
  try {
    const result = await dispatch(request);
    respond(id, true, result, null);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    telemetry.lastError = message;
    respond(id, false, null, message);
  }
});

process.on('SIGINT', async () => {
  await handleShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await handleShutdown();
  process.exit(0);
});
