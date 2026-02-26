import { useEffect, useState } from 'react';

import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { motion } from 'framer-motion';

import { GlobalOneShotCard } from './GlobalOneShotCard';
import { IconPlay } from '../../../shared/components/Icons';
import { useToast } from '../../../shared/hooks/useToast';
import { cn } from '../../../shared/utils/cn';
import { useAudioEngineStore } from '../../audio-engine/stores/audioEngineStore';
import { useGlobalOneShotStore } from '../stores/globalOneShotStore';

const VALID_EXTENSIONS = ['.ogg', '.mp3', '.wav', '.flac'];

export function GlobalOneShotsSection() {
  const { globalOneShots, loadGlobalOneShots, createGlobalOneShot } = useGlobalOneShotStore();
  const { initAudioContext, loadAudioFile } = useAudioEngineStore();
  const { success, error } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    void loadGlobalOneShots();
  }, [loadGlobalOneShots]);

  const handleCreateOneShot = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: 'Audio Files', extensions: ['ogg', 'mp3', 'wav', 'flac'] }],
      });
      if (!selected) return;

      const files = Array.isArray(selected) ? selected : [selected];
      const validFiles = files.filter(filePath => {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';
        const extension = `.${fileName.split('.').pop()?.toLowerCase()}`;
        return VALID_EXTENSIONS.includes(extension);
      });

      if (validFiles.length === 0) return;

      setIsUploading(true);
      await initAudioContext();

      let uploadCount = 0;

      for (const filePath of validFiles) {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';

        try {
          const fileData = await readFile(filePath);
          const newElement = await createGlobalOneShot(filePath, fileName, 'ambient');

          await loadAudioFile(newElement, fileData.buffer.slice(0));
          uploadCount += 1;
        } catch (processError) {
          console.error('Failed to process file:', processError);
        }
      }

      await loadGlobalOneShots();

      if (uploadCount > 0) {
        success(`Successfully uploaded ${uploadCount} global one-shot(s)`);
      } else {
        error('Could not upload the selected files');
      }
    } catch (err) {
      console.error('File selection failed:', err);
      error('Failed to select file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="pt-6 border-t border-white/5 bg-black/20 p-6 lg:p-8 transition-colors">
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
        Global One-Shots (Available Everywhere)
      </h4>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
        <motion.div
          layout
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => void handleCreateOneShot()}
          className={cn(
            'bg-[#1a1a25]/50 border border-dashed border-white/10 rounded-xl px-4 py-3 flex items-center justify-start h-[80px] transition-all cursor-pointer group hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 gap-4',
            isUploading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-5 h-5 rounded-full border-t-2 border-r-2 border-fuchsia-500 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-fuchsia-500/10 transition-colors shrink-0">
              <IconPlay className="w-5 h-5 text-gray-500 group-hover:text-fuchsia-400 transition-colors ml-0.5" />
            </div>
          )}
          <div className="flex-1 text-left min-w-0">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-fuchsia-400 transition-colors truncate">
              {isUploading ? 'Uploading...' : 'Add Global One-Shot'}
            </div>
            <div className="text-[9px] text-gray-600 truncate mt-0.5">
              {isUploading ? 'Please wait' : 'Click to upload files'}
            </div>
          </div>
        </motion.div>

        {globalOneShots.map(element => (
          <GlobalOneShotCard key={element.id} element={element} />
        ))}
      </div>
    </div>
  );
}
