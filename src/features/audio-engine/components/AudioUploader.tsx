import { useState } from 'react';

import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { AnimatePresence, motion } from 'framer-motion';

import {
  IconFileAudio,
  IconPause,
  IconPlay,
  IconRepeat,
  IconTrash,
  IconUpload,
} from '../../../shared/components/Icons';
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
  const [isUploading, setIsUploading] = useState(false);

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
          }
        } catch (error) {
          console.error('Erro ao processar arquivo:', error);
        }
      }

      await loadAudioElements(moodId);
    } catch (error) {
      console.error('Erro no upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Elementos de Áudio ({audioElements.length})
        </h4>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleUpload}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <span className="animate-pulse">Processando...</span>
          ) : (
            <>
              <IconUpload className="w-4 h-4" />
              <span>Adicionar Áudio</span>
            </>
          )}
        </motion.button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {audioElements.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-700/50 rounded-xl bg-gray-800/20 group cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
              onClick={handleUpload}
            >
              <div className="p-4 bg-gray-800 rounded-full group-hover:scale-110 transition-transform duration-300">
                <IconUpload className="w-8 h-8 text-gray-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-400 group-hover:text-gray-300">
                Clique para fazer upload de arquivos
              </p>
              <p className="text-xs text-gray-600 mt-1">OGG, MP3, WAV ou FLAC</p>
            </motion.div>
          ) : (
            audioElements.map(element => (
              <motion.div
                layout
                key={element.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <AudioElementItem element={element} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AudioElementItem({ element }: { element: AudioElement }) {
  const { play, pause, stop, sources, toggleLoop } = useAudioEngineStore();
  const { deleteAudioElement, loadAudioElements, selectedMood } = useSoundSetStore();
  const { channels } = useMixerStore();

  const source = sources.get(element.id);
  const isPlaying = source?.isPlaying || false;
  const isLooping = source?.isLooping || false;
  const channelInfo = channels[element.channel_type];

  const handleDelete = async () => {
    stop(element.id);
    await deleteAudioElement(element.id);
    if (selectedMood) {
      await loadAudioElements(selectedMood.id);
    }
  };

  return (
    <div className="bg-gray-800/80 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-xl p-4 flex items-center justify-between transition-all group shadow-sm relative overflow-hidden">
      {/* Playing progress/animation placeholder */}
      {isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-indigo-500/5 pointer-events-none"
        >
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent"
          />
        </motion.div>
      )}

      <div className="flex items-center gap-4 relative z-10">
        <button
          onClick={() => (isPlaying ? pause(element.id) : play(element.id))}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
            isPlaying
              ? 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950 scale-105'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105'
          }`}
        >
          {isPlaying ? <IconPause className="w-5 h-5" /> : <IconPlay className="w-5 h-5 ml-0.5" />}
        </button>

        <div>
          <div className="font-medium text-gray-200 text-sm flex items-center gap-2">
            <IconFileAudio
              className={`w-4 h-4 ${isPlaying ? 'text-indigo-400' : 'text-gray-500'}`}
            />
            {element.file_name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 border border-gray-600">
              {element.channel_type}
            </span>
            <span className="text-xs text-gray-500">
              {channelInfo.muted ? 'Muted' : `Vol: ${channelInfo.volume}%`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 relative z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleLoop(element.id)}
          className={`p-2 rounded-lg transition-colors ${
            isLooping ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-600 hover:text-gray-400'
          }`}
          title={isLooping ? 'Loop Ativado' : 'Loop Desativado'}
        >
          <IconRepeat className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, color: '#ef4444' }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDelete}
          className="p-2 text-gray-600 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <IconTrash className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
