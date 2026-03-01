import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Signal, AlertCircle } from 'lucide-react';

interface DiscordStreamTelemetry {
  connected: boolean;
  bridge_ready: boolean;
  bridge_connected: boolean;
  chunks_sent: number;
  chunks_dropped: number;
  queue_depth: number;
  queue_capacity: number;
  underruns: number;
  dropped_frames: number;
  reconnect_attempts: number;
  last_error: string | null;
}

interface DiscordTelemetryProps {
  telemetry: DiscordStreamTelemetry | null;
}

export function DiscordTelemetry({ telemetry }: DiscordTelemetryProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!telemetry) return null;

  const isLive = telemetry.bridge_connected;
  const hasError = !!telemetry.last_error;

  // Calculate a "quality" percentage based on chunks dropped vs sent
  const totalChunks = telemetry.chunks_sent + telemetry.chunks_dropped;
  const quality =
    totalChunks > 0
      ? Math.max(0, Math.min(100, 100 - (telemetry.chunks_dropped / totalChunks) * 100))
      : 100;

  const getSignalBars = () => {
    if (!isLive) return 0;
    if (quality > 98) return 4;
    if (quality > 90) return 3;
    if (quality > 70) return 2;
    return 1;
  };

  const signalBars = getSignalBars();

  return (
    <div className="relative flex items-center">
      <motion.button
        onClick={() => setShowDetails(!showDetails)}
        className={`group relative flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all duration-300 ${
          isLive
            ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30'
            : 'bg-white/5 border-white/5 hover:border-white/20'
        } ${hasError ? 'border-red-500/40' : ''}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isLive ? 'Discord Stream Live' : 'Discord Stream Syncing'}
      >
        {/* Connection Pulse */}
        <div className="relative flex items-center justify-center w-2 h-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400/50'}`}
          />
          {isLive && (
            <motion.div
              className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        {/* Minimal Signal Indicator */}
        <div className="flex items-end gap-0.5 h-2.5 mb-0.5">
          {[1, 2, 3, 4].map(bar => (
            <div
              key={bar}
              className={`w-0.5 rounded-full transition-all duration-500 ${
                bar <= signalBars ? (isLive ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-white/10'
              }`}
              style={{ height: `${bar * 25}%` }}
            />
          ))}
        </div>

        {hasError && <AlertCircle size={10} className="text-red-400 ml-0.5 animate-pulse" />}
      </motion.button>

      <AnimatePresence>
        {showDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
              className="absolute bottom-full mb-4 right-0 w-64 bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 p-4"
            >
              <div className="space-y-4">
                <header className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex flex-col">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">
                      Discord Stream
                    </h4>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">
                      Telemetry Data
                    </span>
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      isLive
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {isLive ? 'Live' : 'Sync'}
                  </div>
                </header>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                      Packets
                    </p>
                    <p className="text-sm font-mono font-bold text-zinc-100 italic">
                      {telemetry.chunks_sent.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                      Dropped
                    </p>
                    <p
                      className={`text-sm font-mono font-bold italic ${
                        telemetry.chunks_dropped > 0 ? 'text-red-400' : 'text-zinc-100'
                      }`}
                    >
                      {telemetry.chunks_dropped.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                      Queue
                    </p>
                    <p className="text-sm font-mono font-bold text-zinc-100 italic">
                      {telemetry.queue_depth}/{telemetry.queue_capacity}
                    </p>
                  </div>
                  <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                      Underruns
                    </p>
                    <p
                      className={`text-sm font-mono font-bold italic ${
                        telemetry.underruns > 0 ? 'text-amber-300' : 'text-zinc-100'
                      }`}
                    >
                      {telemetry.underruns.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-zinc-400 uppercase">Stream Integrity</span>
                    <span
                      className={`font-black ${
                        quality > 95 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {quality.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${quality > 95 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${quality}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {telemetry.last_error && (
                  <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle size={10} className="text-red-400" />
                      <span className="text-[9px] font-bold text-red-400 uppercase leading-none">
                        Status Error
                      </span>
                    </div>
                    <p className="text-[10px] text-red-300 leading-relaxed italic border-t border-red-400/10 pt-1 mt-1">
                      {telemetry.last_error}
                    </p>
                  </div>
                )}

                <div className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">
                  reconnects: {telemetry.reconnect_attempts} • dropped frames:{' '}
                  {telemetry.dropped_frames.toLocaleString()}
                </div>

                <footer className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity
                      size={10}
                      className={isLive ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}
                    />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
                      Bridge:{' '}
                      <span className={telemetry.bridge_ready ? 'text-zinc-200' : 'text-zinc-500'}>
                        {telemetry.bridge_ready ? 'Stable' : 'Initing'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Signal
                      size={10}
                      className={telemetry.connected ? 'text-emerald-400' : 'text-zinc-500'}
                    />
                    <span
                      className={`text-[9px] font-black uppercase ${
                        telemetry.connected ? 'text-emerald-500/60' : 'text-zinc-600'
                      }`}
                    >
                      {telemetry.connected ? 'OK' : 'OFF'}
                    </span>
                  </div>
                </footer>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
