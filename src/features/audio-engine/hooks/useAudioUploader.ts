import { useState } from 'react';

import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';

import { usePreloadAudioElements } from './usePreloadAudioElements';
import { useToast } from '../../../shared/hooks/useToast';
import { useSoundSetStore } from '../../sound-sets/stores/soundSetStore';
import { useAudioEngineStore } from '../stores/audioEngineStore';

interface UseAudioUploaderOptions {
  soundSetId: number;
}

const VALID_EXTENSIONS = ['.ogg', '.mp3', '.wav', '.flac'];

/**
 * @description Handles audio preload and upload workflow for a sound set.
 * @param options - Hook options.
 * @param options.soundSetId - Active sound set identifier.
 * @returns Upload state and upload action.
 */
export function useAudioUploader({ soundSetId }: UseAudioUploaderOptions) {
  const { createAudioElement, loadAudioElements } = useSoundSetStore();
  const { initAudioContext, loadAudioFile } = useAudioEngineStore();
  const { success, error } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  usePreloadAudioElements();

  const handleUpload = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: 'Audio Files', extensions: ['ogg', 'mp3', 'wav', 'flac'] }],
      });

      if (!selected) {
        return;
      }

      setIsUploading(true);
      await initAudioContext();

      const files = Array.isArray(selected) ? selected : [selected];
      let uploadCount = 0;

      for (const filePath of files) {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';
        const extension = `.${fileName.split('.').pop()?.toLowerCase()}`;
        if (!VALID_EXTENSIONS.includes(extension)) {
          continue;
        }

        try {
          const fileData = await readFile(filePath);
          await createAudioElement(soundSetId, filePath, fileName, 'ambient');
          await loadAudioElements(soundSetId);

          const latestElements = useSoundSetStore.getState().audioElements;
          const newElement = latestElements.find(element => element.file_path === filePath);
          if (!newElement) {
            continue;
          }

          await loadAudioFile(newElement, fileData.buffer.slice(0));
          uploadCount += 1;
        } catch (processError) {
          console.error('Failed to process file:', processError);
        }
      }

      await loadAudioElements(soundSetId);

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
    handleUpload,
  };
}
