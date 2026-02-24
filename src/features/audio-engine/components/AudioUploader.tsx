import { useEffect, useState } from 'react';

import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { AnimatePresence, motion } from 'framer-motion';

import { IconPause, IconPlay, IconRepeat, IconTrash } from '../../../shared/components/Icons';
import { Waveform } from '../../../shared/components/Waveform';
import { useToast } from '../../../shared/hooks/useToast';
import { cn } from '../../../shared/utils/cn';
import { useMixerStore } from '../../mixer/stores/mixerStore';
import { AudioElement, useSoundSetStore } from '../../sound-sets/stores/soundSetStore';
import { useAudioEngineStore } from '../stores/audioEngineStore';

interface AudioUploaderProps {
  moodId: number;
}

const VALID_EXTENSIONS = ['.ogg', '.mp3', '.wav', '.flac'];

export function AudioUploader({ moodId }: AudioUploaderProps) {
  const { createAudioElement, loadAudioElements, audioElements } = useSoundSetStore();
  const { initAudioContext, loadAudioFile } = useAudioEngineStore();
  const { success, error } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadMissingAudio = async () => {
      if (!audioElements.length) return;

      await initAudioContext();

      for (const element of audioElements) {
        // Use getState to avoid infinite loops from sources dependency
        const currentSources = useAudioEngineStore.getState().sources;
        if (!currentSources.has(element.id)) {
          try {
            const fileData = await readFile(element.file_path);
            await loadAudioFile(element, fileData.buffer.slice(0));
          } catch (err) {
            console.error(`Failed to preload ${element.file_name}:`, err);
          }
        }
      }
    };

    loadMissingAudio();
  }, [audioElements, initAudioContext, loadAudioFile]);

  const handleUpload = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: 'Audio Files',
            extensions: ['ogg', 'mp3', 'wav', 'flac'],
          },
        ],
      });

      if (!selected) return;

      setIsUploading(true);
      await initAudioContext();

      const files = Array.isArray(selected) ? selected : [selected];
      let uploadCount = 0;

      for (const filePath of files) {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';
        const extension = '.' + fileName.split('.').pop()?.toLowerCase();

        if (!VALID_EXTENSIONS.includes(extension)) {
          console.warn(`Formato inválido: ${extension}`);
          continue;
        }

        try {
          const fileData = await readFile(filePath);
          await createAudioElement(moodId, filePath, fileName, 'ambient');

          await loadAudioElements(moodId);
          const elements = useSoundSetStore.getState().audioElements;
          const newElement = elements.find(e => e.file_path === filePath);

          if (newElement) {
            await loadAudioFile(newElement, fileData.buffer.slice(0));
            uploadCount++;
          }
        } catch (err) {
          console.error('Erro ao processar arquivo:', err);
        }
      }

      await loadAudioElements(moodId);
      if (uploadCount > 0) {
        success(`Successfully uploaded ${uploadCount} file(s)`);
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      error(`Failed to upload audio files: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 p-8 max-w-[1600px] mx-auto w-full overflow-hidden">
      {/* Elements Grid - Main Mixing Board */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6 px-4">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
            Mixing Elements ({audioElements.length})
          </h4>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
          <motion.div
            layout
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpload}
            className={cn(
              'bg-[#1a1a25]/50 border border-dashed border-white/10 rounded-xl p-3 flex flex-col items-center justify-center h-[180px] transition-all cursor-pointer group hover:border-cyan-500/50 hover:bg-cyan-500/5',
              isUploading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isUploading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-6 h-6 rounded-full border-t-2 border-r-2 border-cyan-500 mb-2"
              />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-cyan-500/10 mb-2 transition-colors">
                <IconPlay className="w-6 h-6 text-gray-500 group-hover:text-cyan-400 transition-colors" />
              </div>
            )}
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center group-hover:text-cyan-400 transition-colors">
              {isUploading ? 'Uploading...' : 'Add Element'}
            </span>
          </motion.div>
          <AnimatePresence mode="popLayout">
            {audioElements
              .filter(e => e.channel_type !== 'effects')
              .map(element => (
                <motion.div
                  layout
                  key={element.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <AudioElementItem element={element} />
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>

      {/* One-shots Section - At the bottom of main area */}
      <div className="pt-6 border-t border-white/5 bg-black/20 rounded-t-3xl p-6 lg:p-8">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
          One-Shots (Instant Triggers)
        </h4>
        <div className="flex flex-wrap gap-4">
          {audioElements
            .filter(e => e.channel_type === 'effects')
            .map(element => (
              <OneShotButton key={element.id} element={element} />
            ))}

          {/* Empty state for one-shots if none exist */}
          {audioElements.filter(e => e.channel_type === 'effects').length === 0 && (
            <div className="text-[10px] text-gray-600 italic py-2">
              No one-shots available. Add an audio file with &apos;effects&apos; channel type.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OneShotButton({ element }: { element: AudioElement }) {
  const { play, sources, selectedElementId, setSelectedElementId } = useAudioEngineStore();
  const source = sources.get(element.id);
  const isPlaying = source?.isPlaying || false;

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        play(element.id);
        setSelectedElementId(element.id);
      }}
      className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center transition-all relative group',
        'bg-[#1a1a25] border-2 shadow-[0_4px_0_rgba(0,0,0,0.4)]',
        isPlaying
          ? 'border-cyan-400 text-cyan-400 glow-cyan'
          : 'border-white/10 text-gray-500 hover:border-white/20',
        selectedElementId === element.id &&
          'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#0a0a0f]'
      )}
      title={element.file_name}
    >
      <IconPlay className="w-5 h-5 ml-0.5" />
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[9px] font-bold text-gray-400 uppercase pointer-events-none">
        {element.file_name.substring(0, 8)}
      </div>
    </motion.button>
  );
}

function AudioElementItem({ element }: { element: AudioElement }) {
  const { play, pause, stop, sources, toggleLoop, selectedElementId, setSelectedElementId } =
    useAudioEngineStore();
  const { deleteAudioElement, loadAudioElements, selectedMood } = useSoundSetStore();
  const { channels, setChannelVolume } = useMixerStore();
  const { success, error } = useToast();

  const source = sources.get(element.id);
  const isPlaying = source?.isPlaying || false;
  const isLooping = source?.isLooping || false;
  // Fallback to prevent crashes if channel type is not present in mixer store
  const channelInfo = channels[element.channel_type] || {
    volume: 80,
    isMuted: false,
    isSoloed: false,
  };

  const handleDelete = async () => {
    try {
      stop(element.id);
      await deleteAudioElement(element.id);
      if (selectedMood) {
        await loadAudioElements(selectedMood.id);
      }
      success(`Element "${element.file_name}" removed`);
    } catch {
      error('Failed to remove element');
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => {
        setSelectedElementId(element.id);
        if (isPlaying) {
          pause(element.id);
        } else {
          play(element.id);
        }
      }}
      className={cn(
        'bg-[#1a1a25] border rounded-xl p-3 flex flex-col items-center h-[180px] transition-all relative overflow-hidden cursor-pointer group/card',
        isPlaying
          ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(0,212,255,0.1)]'
          : 'border-white/[0.05]',
        selectedElementId === element.id && 'border-cyan-500 ring-1 ring-cyan-500/30'
      )}
    >
      <div className="flex-1 flex gap-2 w-full">
        {/* Vertical Volume Slider - mimicking individual channel strips */}
        <div className="w-6 flex flex-col items-center gap-1 group/slider">
          <div className="flex-1 relative w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className={cn(
                'absolute bottom-0 left-0 right-0 transition-all duration-75',
                isPlaying ? 'bg-cyan-500' : 'bg-gray-700'
              )}
              style={{ height: `${channelInfo.volume}%` }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={channelInfo.volume}
              onChange={e => setChannelVolume(element.channel_type, Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              style={{ WebkitAppearance: 'slider-vertical' }}
            />
          </div>
          <span className="text-[8px] font-bold text-gray-500">{channelInfo.volume}</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-between py-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={e => {
              e.stopPropagation();
              if (isPlaying) {
                pause(element.id);
              } else {
                play(element.id);
              }
            }}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg',
              isPlaying
                ? 'bg-cyan-500 text-black'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            )}
          >
            {isPlaying ? (
              <IconPause className="w-6 h-6" />
            ) : (
              <IconPlay className="w-6 h-6 ml-0.5" />
            )}
          </motion.button>

          <div className="text-center w-full mt-2">
            <p className="text-[10px] font-bold text-gray-300 truncate w-full px-1">
              {element.file_name.split('.')[0]}
            </p>
            <div className="flex justify-center gap-1 mt-1">
              <motion.button
                onClick={e => {
                  e.stopPropagation();
                  toggleLoop(element.id);
                }}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  isLooping ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-600 hover:text-gray-400'
                )}
              >
                <IconRepeat className="w-3 h-3" />
              </motion.button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="p-1.5 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <IconTrash className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization at bottom of card */}
      {isPlaying && (
        <div className="w-full h-4 mt-2">
          <Waveform isPlaying={isPlaying} height={16} barCount={12} color="bg-cyan-400" />
        </div>
      )}
    </motion.div>
  );
}
