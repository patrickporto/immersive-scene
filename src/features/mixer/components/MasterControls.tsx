import { Pause, Play, Square } from 'lucide-react';

import { Cluster } from '../../../shared/components/layout/Cluster';

interface MasterControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStopAll: () => void;
}

export function MasterControls({ isPlaying, onTogglePlay, onStopAll }: MasterControlsProps) {
  return (
    <Cluster gap={4} align="center" justify="center">
      <button
        onClick={onStopAll}
        className="p-3 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-full transition-all"
        title="Parar tudo"
      >
        <Square size={20} fill="currentColor" />
      </button>
      <button
        onClick={onTogglePlay}
        className="w-14 h-14 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:scale-105"
      >
        {isPlaying ? (
          <Pause size={24} fill="currentColor" />
        ) : (
          <Play size={24} fill="currentColor" className="ml-1" />
        )}
      </button>
    </Cluster>
  );
}
