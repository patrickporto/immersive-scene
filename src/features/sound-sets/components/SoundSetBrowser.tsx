import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Folder, Plus, Smile, Trash2 } from 'lucide-react';

import { Cluster } from '../../../shared/components/layout/Cluster';
import { Stack } from '../../../shared/components/layout/Stack';
import { useSoundSetStore } from '../stores/soundSetStore';

export function SoundSetBrowser() {
  const {
    soundSets,
    moods,
    selectedSoundSet,
    selectedMood,
    isLoading,
    selectSoundSet,
    selectMood,
    createSoundSet,
    deleteSoundSet,
    createMood,
    loadMoods,
  } = useSoundSetStore();

  const [isCreatingSoundSet, setIsCreatingSoundSet] = useState(false);
  const [isCreatingMood, setIsCreatingMood] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCreateSoundSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await createSoundSet(newName, newDescription);
    setNewName('');
    setNewDescription('');
    setIsCreatingSoundSet(false);
  };

  const handleCreateMood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !selectedSoundSet) return;

    await createMood(selectedSoundSet.id, newName, newDescription);
    await loadMoods(selectedSoundSet.id);
    setNewName('');
    setNewDescription('');
    setIsCreatingMood(false);
  };

  return (
    <Stack className="h-full bg-[#12121a]">
      {/* Header */}
      <Cluster
        gap={2}
        justify="between"
        className="p-4 border-b border-[rgba(255,255,255,0.08)] shrink-0"
      >
        <h2 className="text-xs font-bold text-[#64748b] uppercase tracking-widest">SoundSets</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreatingSoundSet(true)}
          className="btn btn--ghost text-xs py-1.5 px-2"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo</span>
        </motion.button>
      </Cluster>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <AnimatePresence initial={false}>
          {isCreatingSoundSet && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-2"
            >
              <form onSubmit={handleCreateSoundSet} className="card space-y-3">
                <Stack gap={2}>
                  <input
                    type="text"
                    placeholder="Nome do SoundSet"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Descrição (opcional)"
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    className="w-full"
                  />
                </Stack>
                <Cluster gap={2} justify="end">
                  <button
                    type="button"
                    onClick={() => setIsCreatingSoundSet(false)}
                    className="btn btn--ghost text-xs"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn--primary text-xs">
                    Criar
                  </button>
                </Cluster>
              </form>
            </motion.div>
          )}

          {isLoading && soundSets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[#64748b] py-8 text-sm"
            >
              Carregando...
            </motion.div>
          ) : (
            soundSets.map(soundSet => (
              <motion.div
                layout
                key={soundSet.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="group/item"
              >
                <div
                  onClick={() => selectSoundSet(soundSet)}
                  className={`
                    relative px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between group/row border
                    ${
                      selectedSoundSet?.id === soundSet.id
                        ? 'bg-[#6366f1]/10 border-[#6366f1]/20 text-[#e0e7ff] shadow-sm'
                        : 'bg-transparent border-transparent text-[#64748b] hover:bg-white/[0.05] hover:text-[#94a3b8] hover:border-[rgba(255,255,255,0.05)]'
                    }
                  `}
                >
                  <Cluster gap={3}>
                    <Folder
                      className={`w-4 h-4 shrink-0 ${
                        selectedSoundSet?.id === soundSet.id ? 'text-[#818cf8]' : 'text-[#475569]'
                      }`}
                    />
                    <span className="truncate text-sm font-medium">{soundSet.name}</span>
                  </Cluster>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={e => {
                      e.stopPropagation();
                      deleteSoundSet(soundSet.id);
                    }}
                    className="opacity-0 group-hover/row:opacity-100 p-1 rounded-md hover:bg-[#ef4444]/10 transition-all text-[#475569] hover:text-[#ef4444]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>

                  {/* Active Indicator */}
                  {selectedSoundSet?.id === soundSet.id && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#6366f1] rounded-r-full"
                    />
                  )}
                </div>

                {/* Moods Sub-list */}
                <AnimatePresence>
                  {selectedSoundSet?.id === soundSet.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden ml-4 pl-4 border-l border-[rgba(255,255,255,0.08)] my-1 space-y-0.5"
                    >
                      {moods.map(mood => (
                        <motion.div
                          key={mood.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => selectMood(mood)}
                          className={`
                            px-3 py-2 rounded-md cursor-pointer text-sm transition-all duration-200 flex items-center gap-2 border
                            ${
                              selectedMood?.id === mood.id
                                ? 'bg-[#6366f1]/10 text-[#c7d2fe] border-[#6366f1]/20 font-medium'
                                : 'bg-transparent text-[#475569] border-transparent hover:text-[#94a3b8] hover:bg-white/[0.03]'
                            }
                          `}
                        >
                          <Smile
                            className={`w-3.5 h-3.5 ${
                              selectedMood?.id === mood.id ? 'text-[#818cf8]' : 'text-[#334155]'
                            }`}
                          />
                          <span className="truncate">{mood.name}</span>
                        </motion.div>
                      ))}

                      {/* Add Mood Button/Form */}
                      {isCreatingMood ? (
                        <motion.form
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          onSubmit={handleCreateMood}
                          className="mt-2 p-2 bg-[#1a1a25] rounded-lg border border-[rgba(255,255,255,0.08)] space-y-2"
                        >
                          <input
                            type="text"
                            placeholder="Nome do Mood"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="w-full text-xs py-1.5 px-2"
                            autoFocus
                          />
                          <Cluster gap={2} justify="end">
                            <button
                              type="button"
                              onClick={() => setIsCreatingMood(false)}
                              className="text-[10px] font-medium text-[#64748b] hover:text-white uppercase tracking-wider px-2 py-1"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="text-[10px] font-bold text-[#818cf8] hover:text-[#a5b4fc] uppercase tracking-wider px-2 py-1"
                            >
                              Salvar
                            </button>
                          </Cluster>
                        </motion.form>
                      ) : (
                        <motion.button
                          whileHover={{ x: 2 }}
                          onClick={() => setIsCreatingMood(true)}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-[#475569] hover:text-[#818cf8] transition-colors flex items-center gap-2 mt-1 opacity-70 hover:opacity-100"
                        >
                          <Plus className="w-3 h-3" />
                          Adicionar Mood
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}

          {soundSets.length === 0 && !isCreatingSoundSet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-[#475569] gap-2"
            >
              <Folder className="w-8 h-8 opacity-20" />
              <p className="text-xs font-medium">Nenhum SoundSet</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Stack>
  );
}
