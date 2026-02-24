import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Music, Plus, Trash2 } from 'lucide-react';

import { Cluster } from '../../../shared/components/layout/Cluster';
import { Stack } from '../../../shared/components/layout/Stack';
import { useToast } from '../../../shared/hooks/useToast';
import { cn } from '../../../shared/utils/cn';
import { useSoundSetStore } from '../stores/soundSetStore';

interface SoundSetBrowserProps {
  isCollapsed?: boolean;
}

export function SoundSetBrowser({ isCollapsed = false }: SoundSetBrowserProps) {
  const {
    soundSets,
    moods,
    selectedSoundSet,
    selectedMood,
    selectSoundSet,
    selectMood,
    createSoundSet,
    deleteSoundSet,
    createMood,
    loadMoods,
  } = useSoundSetStore();

  const { success, error } = useToast();
  const [isCreatingSoundSet, setIsCreatingSoundSet] = useState(false);
  const [isCreatingMood, setIsCreatingMood] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCreateSoundSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      error('Please enter a name');
      return;
    }

    try {
      console.log('Creating SoundSet:', newName);
      await createSoundSet(newName, newDescription);
      console.log('SoundSet created successfully');
      console.log('Current soundSets:', soundSets.length);
      success(`SoundSet "${newName}" created`);
      setNewName('');
      setNewDescription('');
      setIsCreatingSoundSet(false);
    } catch (err) {
      console.error('Failed to create SoundSet:', err);
      error('Failed to create SoundSet: ' + String(err));
    }
  };

  const handleCreateMood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !selectedSoundSet) return;

    try {
      await createMood(selectedSoundSet.id, newName, newDescription);
      await loadMoods(selectedSoundSet.id);
      success(`Mood "${newName}" added`);
      setNewName('');
      setNewDescription('');
      setIsCreatingMood(false);
    } catch {
      error('Failed to create Mood');
    }
  };

  const handleDeleteSoundSet = async (id: number, name: string) => {
    try {
      await deleteSoundSet(id);
      success(`SoundSet "${name}" deleted`);
    } catch {
      error('Failed to delete SoundSet');
    }
  };

  if (isCollapsed) {
    return (
      <Stack className="h-full items-center py-4" gap={6}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsCreatingSoundSet(!isCreatingSoundSet)}
          className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20"
        >
          <Plus className="w-5 h-5" />
        </motion.button>

        <Stack className="flex-1 items-center overflow-y-auto no-scrollbar" gap={3}>
          {soundSets.map(soundSet => (
            <motion.div
              key={soundSet.id}
              onClick={() => selectSoundSet(soundSet)}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border',
                selectedSoundSet?.id === soundSet.id
                  ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_15px_rgba(0,212,255,0.4)] text-black'
                  : 'bg-black/40 border-white/5 text-gray-500 hover:text-white hover:border-white/20'
              )}
              title={soundSet.name}
            >
              <Music className="w-5 h-5" />
            </motion.div>
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack className="h-full bg-[#0f0f15]" gap={0}>
      {/* SoundSets Header */}
      <Cluster
        className="px-4 py-3 border-b border-white/5 bg-black/20"
        justify="between"
        align="center"
      >
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
          SoundSets
        </h2>
      </Cluster>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Stack className="p-4" gap={3}>
          {/* Add SoundSet Button/Form */}
          <AnimatePresence mode="wait">
            {!isCreatingSoundSet ? (
              <motion.div
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setIsCreatingSoundSet(true)}
                className="group cursor-pointer transition-all border border-dashed border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 rounded-xl"
              >
                <Cluster className="px-4 py-3" gap={2} justify="center">
                  <Plus className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-xs font-bold text-gray-500 group-hover:text-cyan-400 transition-colors">
                    Add SoundSet
                  </span>
                </Cluster>
              </motion.div>
            ) : (
              <motion.form
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleCreateSoundSet}
                className="p-4 rounded-xl bg-black/40 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,212,255,0.1)]"
              >
                <Stack gap={3}>
                  <input
                    type="text"
                    placeholder="New SoundSet..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    autoFocus
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/50 outline-none"
                  />
                  <Cluster justify="between" gap={2}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingSoundSet(false);
                        setNewName('');
                      }}
                      className="flex-1 text-[10px] font-bold uppercase py-2 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-cyan-500 text-black text-[10px] font-bold uppercase py-2 rounded shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-colors"
                    >
                      Create
                    </button>
                  </Cluster>
                </Stack>
              </motion.form>
            )}
          </AnimatePresence>

          {/* SoundSets List */}
          <Stack className="overflow-y-auto custom-scrollbar" gap={2}>
            {soundSets.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-sm">
                No SoundSets yet. Create one above!
              </div>
            )}
            {soundSets.map(soundSet => (
              <motion.div
                layout
                key={soundSet.id}
                onClick={() => selectSoundSet(soundSet)}
                className={cn(
                  'group relative cursor-pointer transition-all border rounded-xl',
                  selectedSoundSet?.id === soundSet.id
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-white shadow-[0_0_15px_rgba(0,212,255,0.1)]'
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                )}
              >
                <Cluster className="px-4 py-3" justify="between" align="center">
                  <span className="text-sm font-bold truncate tracking-tight">{soundSet.name}</span>
                  <Trash2
                    className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all flex-shrink-0"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteSoundSet(soundSet.id, soundSet.name);
                    }}
                  />
                </Cluster>

                {selectedSoundSet?.id === soundSet.id && (
                  <motion.div
                    layoutId="activeSoundSet"
                    className="absolute left-0 top-2 bottom-2 w-0.5 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(0,212,255,1)]"
                  />
                )}
              </motion.div>
            ))}
          </Stack>
        </Stack>

        {/* Moods Section */}
        <AnimatePresence>
          {selectedSoundSet && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="border-t border-white/10 bg-black/40 flex-1 flex flex-col min-h-0"
            >
              <Cluster
                className="px-4 py-3 border-b border-white/5 bg-black/20"
                justify="between"
                align="center"
              >
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Moods
                </span>
              </Cluster>
              <Stack className="flex-1 overflow-y-auto p-4 custom-scrollbar" gap={2}>
                <AnimatePresence mode="wait">
                  {!isCreatingMood ? (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setIsCreatingMood(true)}
                      className="group cursor-pointer transition-all border border-dashed border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 rounded-lg"
                    >
                      <Cluster className="px-4 py-2" gap={2} justify="center">
                        <Plus className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-cyan-400 transition-colors">
                          Add Mood
                        </span>
                      </Cluster>
                    </motion.div>
                  ) : (
                    <motion.form
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onSubmit={handleCreateMood}
                      className="p-3 bg-black/40 rounded-lg border border-cyan-500/30"
                    >
                      <Stack gap={2}>
                        <input
                          type="text"
                          placeholder="New Mood..."
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          autoFocus
                          className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/50 outline-none"
                        />
                        <Cluster justify="between" gap={2}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingMood(false);
                              setNewName('');
                            }}
                            className="flex-1 text-[9px] font-bold uppercase py-1.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 bg-cyan-500 text-black text-[9px] font-bold uppercase py-1.5 rounded hover:bg-cyan-400 transition-colors"
                          >
                            Create
                          </button>
                        </Cluster>
                      </Stack>
                    </motion.form>
                  )}
                </AnimatePresence>

                {moods.map(mood => (
                  <div
                    key={mood.id}
                    onClick={() => selectMood(mood)}
                    className={cn(
                      'px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer transition-all border',
                      selectedMood?.id === mood.id
                        ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,212,255,0.4)] border-transparent'
                        : 'text-gray-500 hover:bg-white/[0.03] border-transparent'
                    )}
                  >
                    {mood.name}
                  </div>
                ))}
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Stack>
  );
}
