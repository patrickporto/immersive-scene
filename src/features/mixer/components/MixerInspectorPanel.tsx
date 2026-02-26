import { Info, Music, Timer, Volume2 } from 'lucide-react';

import { Cluster } from '../../../shared/components/layout/Cluster';
import { Stack } from '../../../shared/components/layout/Stack';
import { cn } from '../../../shared/utils/cn';

interface MixerInspectorPanelProps {
  selectedSource: {
    element: {
      id: number;
      file_name: string;
      file_path: string;
      channel_type: string;
    };
    gainNode: GainNode;
    isLooping: boolean;
  } | null;
  onSetVolume: (elementId: number, volume: number) => void;
  onToggleLoop: (elementId: number) => void;
}

/**
 * @description Renders selected audio source controls and metadata.
 * @param props - Component properties.
 * @returns Inspector panel content.
 */
export function MixerInspectorPanel({
  selectedSource,
  onSetVolume,
  onToggleLoop,
}: MixerInspectorPanelProps) {
  if (!selectedSource) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-4 opacity-30">
        <div className="p-4 bg-white/5 rounded-full">
          <Info className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-xs text-gray-500 font-medium">
          Select an audio element to
          <br /> inspect its properties.
        </p>
      </div>
    );
  }

  return (
    <>
      <Stack gap={2}>
        <Cluster gap={2}>
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <Music className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider truncate">
            {selectedSource.element.file_name}
          </h3>
        </Cluster>
        <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">
          Channel: {selectedSource.element.channel_type}
        </p>
      </Stack>

      <Stack gap={4}>
        <Stack gap={2}>
          <Cluster justify="between">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Volume2 className="w-3 h-3" /> Element Gain
            </label>
            <span className="text-[10px] font-mono text-cyan-400">
              {(selectedSource.gainNode.gain.value * 100).toFixed(0)}%
            </span>
          </Cluster>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={selectedSource.gainNode.gain.value}
            onChange={event => onSetVolume(selectedSource.element.id, Number(event.target.value))}
            className="w-full accent-cyan-500"
          />
        </Stack>

        <Stack gap={2}>
          <Cluster justify="between" align="center">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Timer className="w-3 h-3" /> Behavior
            </label>
            <button
              onClick={() => onToggleLoop(selectedSource.element.id)}
              className={cn(
                'px-3 py-1 rounded text-[9px] font-bold uppercase transition-all border',
                selectedSource.isLooping
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(0,212,255,0.3)]'
                  : 'bg-transparent border-white/10 text-gray-600'
              )}
            >
              Looping
            </button>
          </Cluster>
        </Stack>
      </Stack>

      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl mt-6">
        <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">
          Source Meta
        </h4>
        <pre className="text-[8px] font-mono text-gray-700 whitespace-pre-wrap">
          ID: {selectedSource.element.id}
          {'\n'}Path: {selectedSource.element.file_path.substring(0, 30)}...
        </pre>
      </div>
    </>
  );
}
