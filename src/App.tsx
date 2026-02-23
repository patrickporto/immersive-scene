import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Folder, Menu, Music, Smile } from 'lucide-react';

import { AudioUploader } from './features/audio-engine/components/AudioUploader';
import { MixerPanel } from './features/mixer/components/MixerPanel';
import { SoundSetBrowser } from './features/sound-sets/components/SoundSetBrowser';
import { useSoundSetStore } from './features/sound-sets/stores/soundSetStore';
import { Cluster } from './shared/components/layout/Cluster';
import { Stack } from './shared/components/layout/Stack';

function App() {
  const { loadSoundSets, selectedSoundSet, selectedMood } = useSoundSetStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    loadSoundSets();
  }, [loadSoundSets]);

  return (
    <div
      className="h-screen overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateAreas: `
          "header header"
          "sidebar main"
          "mixer mixer"
        `,
        gridTemplateColumns: sidebarCollapsed ? '0 1fr' : '18rem 1fr',
        gridTemplateRows: '3.5rem 1fr 14rem',
      }}
    >
      {/* Header */}
      <header
        style={{ gridArea: 'header' }}
        className="bg-[#12121a] border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between px-6 shrink-0 z-10"
      >
        <Cluster gap={3}>
          <div className="p-2 bg-[#6366f1] rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight gradient-text">Immersive Audio Engine</h1>
        </Cluster>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 hover:bg-white/[0.05] rounded-lg text-gray-400 transition-colors border border-[rgba(255,255,255,0.08)]"
          title={sidebarCollapsed ? 'Expandir Sidebar' : 'Recolher Sidebar'}
        >
          <Menu className="w-5 h-5" />
        </motion.button>
      </header>

      {/* Sidebar - SoundSet Browser */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 0 : 288,
          opacity: sidebarCollapsed ? 0 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ gridArea: 'sidebar' }}
        className="bg-[#12121a] border-r border-[rgba(255,255,255,0.08)] flex flex-col shrink-0 overflow-hidden"
      >
        <div className="w-72 h-full">
          <SoundSetBrowser />
        </div>
      </motion.aside>

      {/* Main Area */}
      <main
        style={{ gridArea: 'main' }}
        className="bg-[#0a0a0f] relative overflow-hidden flex flex-col"
      >
        <AnimatePresence mode="wait">
          {selectedSoundSet ? (
            <motion.div
              key={selectedSoundSet.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              {/* SoundSet Header */}
              <div className="p-6 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(18,18,26,0.5)] backdrop-blur-sm sticky top-0 z-10">
                <Cluster gap={3} className="mb-2">
                  <Folder className="w-6 h-6 text-[#6366f1]" />
                  <h2 className="text-2xl font-bold text-white">{selectedSoundSet.name}</h2>
                </Cluster>
                <p className="text-[#94a3b8] text-sm ml-9 max-w-2xl">
                  {selectedSoundSet.description || 'Sem descrição definida para este SoundSet.'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {selectedMood ? (
                    <motion.div
                      key={selectedMood.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="glass rounded-xl p-6"
                    >
                      <Cluster
                        gap={3}
                        className="mb-6 pb-4 border-b border-[rgba(255,255,255,0.08)]"
                      >
                        <div className="p-2 bg-[#6366f1]/10 rounded-lg">
                          <Smile className="w-5 h-5 text-[#818cf8]" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#e0e7ff]">
                          {selectedMood.name}
                        </h3>
                      </Cluster>
                      <AudioUploader moodId={selectedMood.id} />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center h-full text-[#64748b] space-y-4 p-12 border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-xl bg-[rgba(18,18,26,0.3)]"
                    >
                      <div className="p-4 bg-[#1a1a25] rounded-full">
                        <Smile className="w-8 h-8 text-[#475569]" />
                      </div>
                      <Stack gap={1} className="text-center">
                        <h3 className="text-lg font-medium text-[#cbd5e1]">
                          Nenhum Mood selecionado
                        </h3>
                        <p className="text-sm text-[#64748b]">
                          Selecione um mood na barra lateral para gerenciar seus áudios.
                        </p>
                      </Stack>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-[#64748b] space-y-6"
            >
              <div className="w-24 h-24 bg-[#12121a] rounded-2xl flex items-center justify-center border border-[rgba(255,255,255,0.08)] shadow-xl">
                <Folder className="w-12 h-12 text-[#334155]" />
              </div>
              <Stack gap={2} className="text-center max-w-md px-6">
                <h2 className="text-2xl font-bold text-[#cbd5e1]">Bem-vindo ao Immersive</h2>
                <p className="text-[#64748b]">
                  Selecione um SoundSet existente na barra lateral ou crie um novo para começar a
                  mixar sua experiência de áudio.
                </p>
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Panel - Mixer */}
      <div
        style={{ gridArea: 'mixer' }}
        className="bg-[#12121a] border-t border-[rgba(255,255,255,0.08)] shrink-0 z-20"
      >
        <MixerPanel />
      </div>
    </div>
  );
}

export default App;
