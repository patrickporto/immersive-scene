import { useState } from 'react';
import type { FormEvent } from 'react';

import { open, save } from '@tauri-apps/plugin-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Music, Plus, Trash2, Download } from 'lucide-react';

import { MoodCreateSection } from './MoodCreateSection';
import { SoundSetCreateSection } from './SoundSetCreateSection';
import { SoundSetListItem } from './SoundSetListItem';
import { Cluster } from '../../../shared/components/layout/Cluster';
import { Stack } from '../../../shared/components/layout/Stack';
import { useToast } from '../../../shared/hooks/useToast';
import { cn } from '../../../shared/utils/cn';
import { useSoundSetStore } from '../stores/soundSetStore';

interface SoundSetBrowserProps {
  isCollapsed?: boolean;
}

/**
 * @description Displays sound set and mood selection with create actions.
 * @param props - Component properties.
 * @param props.isCollapsed - Whether panel is rendered in compact mode.
 * @returns Sound set browser component.
 */
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
    deleteMood,
    loadMoods,
    importSoundSet,
    exportSoundSet,
  } = useSoundSetStore();

  const { success, error } = useToast();
  const [isCreatingSoundSet, setIsCreatingSoundSet] = useState(false);
  const [isCreatingMood, setIsCreatingMood] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreateSoundSet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newName.trim()) {
      error('Please enter a name');
      return;
    }

    try {
      await createSoundSet(newName, '');
      success(`SoundSet "${newName}" created`);
      setNewName('');
      setIsCreatingSoundSet(false);
    } catch (createError) {
      error(`Failed to create SoundSet: ${String(createError)}`);
    }
  };

  const handleCreateMood = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newName.trim() || !selectedSoundSet) {
      return;
    }

    try {
      await createMood(selectedSoundSet.id, newName, '');
      await loadMoods(selectedSoundSet.id);
      success(`Mood "${newName}" added`);
      setNewName('');
      setIsCreatingMood(false);
    } catch {
      error('Failed to create Mood');
    }
  };

  const handleDeleteSoundSet = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete SoundSet "${name}"?`)) {
      return;
    }

    try {
      await deleteSoundSet(id);
      success(`SoundSet "${name}" deleted`);
    } catch {
      error('Failed to delete SoundSet');
    }
  };

  const handleDeleteMood = async (event: React.MouseEvent, id: number, name: string) => {
    event.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete Mood "${name}"?`)) {
      return;
    }

    try {
      await deleteMood(id);
      success(`Mood "${name}" deleted`);
    } catch {
      error('Failed to delete Mood');
    }
  };

  const handleImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Immersive Archive', extensions: ['zip', 'immersive'] }],
      });
      if (!selected || Array.isArray(selected)) return;

      success('Importing SoundSet...');
      await importSoundSet(selected);
      success('SoundSet imported successfully!');
    } catch (err) {
      error(`Failed to import SoundSet: ${String(err)}`);
    }
  };

  const handleExport = async (id: number, name: string) => {
    try {
      const selected = await save({
        defaultPath: `${name}-export.zip`,
        filters: [{ name: 'Immersive Archive', extensions: ['zip', 'immersive'] }],
      });
      if (!selected) return;

      success('Exporting SoundSet...');
      await exportSoundSet(id, selected);
      success('SoundSet exported successfully!');
    } catch (err) {
      error(`Failed to export SoundSet: ${String(err)}`);
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
      <Cluster
        className="px-4 py-3 border-b border-white/5 bg-black/20"
        justify="between"
        align="center"
      >
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
          SoundSets
        </h2>
        <button
          onClick={() => void handleImport()}
          className="text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded p-1"
          title="Import SoundSet"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </Cluster>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Stack className="p-4" gap={3}>
          <SoundSetCreateSection
            isCreating={isCreatingSoundSet}
            value={newName}
            onValueChange={setNewName}
            onStart={() => setIsCreatingSoundSet(true)}
            onCancel={() => {
              setIsCreatingSoundSet(false);
              setNewName('');
            }}
            onSubmit={handleCreateSoundSet}
          />

          <Stack className="overflow-y-auto custom-scrollbar" gap={2}>
            {soundSets.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-sm">
                No SoundSets yet. Create one above!
              </div>
            )}

            {soundSets.map(soundSet => (
              <SoundSetListItem
                key={soundSet.id}
                id={soundSet.id}
                name={soundSet.name}
                isSelected={selectedSoundSet?.id === soundSet.id}
                onSelect={() => selectSoundSet(soundSet)}
                onDelete={() => void handleDeleteSoundSet(soundSet.id, soundSet.name)}
                onExport={() => void handleExport(soundSet.id, soundSet.name)}
              />
            ))}
          </Stack>
        </Stack>

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
                <MoodCreateSection
                  isCreating={isCreatingMood}
                  value={newName}
                  onValueChange={setNewName}
                  onStart={() => setIsCreatingMood(true)}
                  onCancel={() => {
                    setIsCreatingMood(false);
                    setNewName('');
                  }}
                  onSubmit={handleCreateMood}
                />

                {moods.map(mood => (
                  <div
                    key={mood.id}
                    className={cn(
                      'group px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border flex items-center justify-between',
                      selectedMood?.id === mood.id
                        ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,212,255,0.4)] border-transparent'
                        : 'text-gray-500 hover:bg-white/[0.03] border-transparent'
                    )}
                  >
                    <span className="cursor-pointer flex-1" onClick={() => selectMood(mood)}>
                      {mood.name}
                    </span>
                    <button
                      type="button"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        void handleDeleteMood(e, mood.id, mood.name);
                      }}
                      className={cn(
                        'opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer',
                        selectedMood?.id === mood.id
                          ? 'hover:bg-black/20 text-black/70 hover:text-black'
                          : 'hover:bg-white/10 text-gray-500 hover:text-red-400'
                      )}
                      title="Delete mood"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
