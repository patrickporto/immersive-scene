import { useState } from 'react';

import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';

import { usePreloadAudioElements } from './usePreloadAudioElements';
import { useToast } from '../../../shared/hooks/useToast';
import { useSoundSetStore } from '../../sound-sets/stores/soundSetStore';
import { useAudioEngineStore } from '../stores/audioEngineStore';

const VALID_EXTENSIONS = ['.ogg', '.mp3', '.wav', '.flac'];
/**
 * @description Handles audio preload and upload workflow for a sound set.
 * @returns Upload state and upload action.
 */
export function useAudioUploader() {
  const { createAudioElement, loadAudioElements } = useSoundSetStore();
  const { initAudioContext, loadAudioFile } = useAudioEngineStore();
  const { success, error } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  usePreloadAudioElements();

  const selectFiles = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: 'Audio Files', extensions: ['ogg', 'mp3', 'wav', 'flac'] }],
      });
      if (!selected) return [];

      const files = Array.isArray(selected) ? selected : [selected];
      return files.filter(filePath => {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';
        const extension = `.${fileName.split('.').pop()?.toLowerCase()}`;
        return VALID_EXTENSIONS.includes(extension);
      });
    } catch (err) {
      console.error('File selection failed:', err);
      return [];
    }
  };

  const processUpload = async (files: string[], soundSetId: number, channelId: number | null) => {
    if (files.length === 0) return;
    setIsUploading(true);
    await initAudioContext();

    try {
      let uploadCount = 0;

      for (const filePath of files) {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';

        try {
          const fileData = await readFile(filePath);
          const newElement = await createAudioElement(
            soundSetId,
            filePath,
            fileName,
            'ambient',
            channelId
          );

          await loadAudioFile(newElement, fileData.buffer.slice(0));
          uploadCount += 1;
        } catch (processError) {
          console.error('Failed to process file:', processError);
        }
      }

      await loadAudioElements();

      if (uploadCount > 0) {
        success(`Successfully uploaded ${uploadCount} file(s)`);
      }
    } catch (uploadError) {
      console.error('Upload failed:', uploadError);
      error(
        `Failed to upload audio files: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    selectFiles,
    processUpload,
  };
}
