import { useEffect } from 'react';

import { motion } from 'framer-motion';

import { AudioUploader } from './features/audio-engine/components/AudioUploader';
import { useAudioEngineStore } from './features/audio-engine/stores/audioEngineStore';
import { BottomPlayer } from './features/mixer/components/BottomPlayer';
import { SoundSetBrowser } from './features/sound-sets/components/SoundSetBrowser';
import { useSoundSetStore } from './features/sound-sets/stores/soundSetStore';

export default function App() {
  const { loadSoundSets, selectedSoundSet, selectedMood, isLoading, soundSets, error } =
    useSoundSetStore();
  const { initAudioContext } = useAudioEngineStore();

  useEffect(() => {
    console.log('App mounted, loading soundsets...');
    loadSoundSets();
    initAudioContext();
  }, [loadSoundSets, initAudioContext]);

  useEffect(() => {
    console.log('SoundSets updated:', soundSets.length);
  }, [soundSets]);

  if (isLoading && soundSets.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0f]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 rounded-full border-t-2 border-r-2 border-cyan-500"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0f] flex-col gap-4">
        <div className="text-red-500 font-bold">Error: {error}</div>
        <button
          onClick={() => loadSoundSets()}
          className="px-4 py-2 bg-cyan-500 text-black rounded font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#0a0a0f] text-slate-100 font-sans overflow-hidden selection:bg-cyan-500/30">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-white/5 bg-[#0f0f15] shadow-2xl z-10 hidden md:block">
        <SoundSetBrowser />
      </div>

      {/* Primary Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {!selectedSoundSet && (
            <div className="flex items-center justify-center h-full text-gray-500 font-medium tracking-wider uppercase text-sm">
              Select or create a SoundSet to begin.
            </div>
          )}

          {selectedSoundSet && !selectedMood && (
            <div className="flex items-center justify-center h-full text-gray-500 font-medium tracking-wider uppercase text-sm">
              Select or create a Mood for &quot;{selectedSoundSet.name}&quot;
            </div>
          )}

          {selectedSoundSet && selectedMood && <AudioUploader moodId={selectedMood.id} />}
        </div>

        {/* Player */}
        <div className="h-24 flex-shrink-0 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] bg-[#0f0f15] border-t border-white/5 relative">
          <BottomPlayer />
        </div>
      </main>

      {/* Embedded Styles for custom-scrollbar */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #475569;
        }
      `,
        }}
      />
    </div>
  );
}
