import { useState } from 'react';

import { Activity, Settings, Volume2, VolumeX } from 'lucide-react';

import { MasterControls } from './MasterControls';
import { Cluster } from '../../../shared/components/layout/Cluster';
import { Stack } from '../../../shared/components/layout/Stack';
import { useAudioEngineStore } from '../../audio-engine/stores/audioEngineStore';
import { useSoundSetStore } from '../../sound-sets/stores/soundSetStore';
import { useTimelineStore } from '../../sound-sets/stores/timelineStore';

export function BottomPlayer() {
  const { selectedSoundSet, selectedMood } = useSoundSetStore();
  const { selectedTimelineId, timelines } = useTimelineStore();
  const { sources, stopAll, globalVolume, setGlobalVolume } = useAudioEngineStore();

  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);

  // Derive playing status
  const playingCount = Array.from(sources.values()).filter(s => s.isPlaying).length;
  const isPlaying = playingCount > 0;

  const handleToggleMute = () => {
    if (isMasterMuted) {
      setIsMasterMuted(false);
      setGlobalVolume(prevVolume);
    } else {
      setPrevVolume(globalVolume);
      setIsMasterMuted(true);
      setGlobalVolume(0);
    }
  };

  const handleVolumeChange = (vol: number) => {
    const normVol = vol / 100;
    setGlobalVolume(normVol);
    if (normVol > 0 && isMasterMuted) {
      setIsMasterMuted(false);
    } else if (normVol === 0) {
      setIsMasterMuted(true);
    }
  };

  return (
    <div className="bg-[#0f0f15] h-full flex flex-col justify-center px-6">
      <div className="max-w-screen-2xl mx-auto w-full">
        <Cluster gap={4} align="center" justify="between">
          {/* Currently Playing Info */}
          <Cluster gap={3} align="center" className="flex-1 min-w-0">
            <div className="relative w-12 h-12 rounded-lg bg-[#1a1a25] flex-shrink-0 border border-white/5 flex items-center justify-center">
              {isPlaying && (
                <div className="absolute inset-0 bg-cyan-500/10 flex items-center justify-center backdrop-blur-[1px] rounded-lg">
                  <Activity size={18} className="text-cyan-400 animate-pulse" />
                </div>
              )}
            </div>
            <Stack gap={0} className="min-w-0 flex-1 overflow-hidden">
              <p className="text-sm font-bold text-gray-200 truncate">
                {selectedSoundSet ? selectedSoundSet.name : 'No SoundSet Selected'}
              </p>
              <p className="text-xs text-gray-500 truncate font-medium tracking-wide">
                {selectedMood ? selectedMood.name : 'No Mood Selected'}
                {selectedTimelineId && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-cyan-400">
                      Timeline: {timelines.find(t => t.id === selectedTimelineId)?.name}
                    </span>
                  </>
                )}
                <span className="mx-2">•</span>
                {playingCount} channels active
              </p>
            </Stack>
          </Cluster>

          {/* Master Controls */}
          <Cluster gap={2} align="center" justify="center" className="flex-shrink-0">
            <MasterControls
              isPlaying={isPlaying}
              onTogglePlay={() => {}} /* Not strictly needed if elements manage own play state, but could implement a global pause */
              onStopAll={stopAll}
            />
          </Cluster>

          {/* Master Volume */}
          <Cluster gap={2} align="center" justify="end" className="flex-1 text-gray-500">
            <button
              onClick={handleToggleMute}
              className="p-2 hover:text-white hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
            >
              {isMasterMuted || globalVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMasterMuted ? 0 : globalVolume * 100}
              onChange={e => handleVolumeChange(parseInt(e.target.value))}
              className="w-20 md:w-28 accent-cyan-500 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer flex-shrink-0 border border-white/5"
            />
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors hidden md:flex flex-shrink-0 text-gray-500">
              <Settings size={16} />
            </button>
          </Cluster>
        </Cluster>
      </div>
    </div>
  );
}
