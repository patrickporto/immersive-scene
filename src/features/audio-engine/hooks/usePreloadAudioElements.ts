import { useEffect } from 'react';

import { readFile } from '@tauri-apps/plugin-fs';

import { useSoundSetStore } from '../../sound-sets/stores/soundSetStore';
import { useAudioEngineStore } from '../stores/audioEngineStore';

/**
 * @description Preloads missing audio buffers into the engine cache.
 * @returns Void.
 */
export function usePreloadAudioElements() {
  const { audioElements } = useSoundSetStore();
  const initAudioContext = useAudioEngineStore(state => state.initAudioContext);
  const loadAudioFile = useAudioEngineStore(state => state.loadAudioFile);

  useEffect(() => {
    const loadMissingAudio = async () => {
      if (!audioElements.length) {
        return;
      }

      await initAudioContext();

      for (const element of audioElements) {
        const currentSources = useAudioEngineStore.getState().sources;
        if (currentSources.has(element.id)) {
          continue;
        }

        try {
          const fileData = await readFile(element.file_path);
          await loadAudioFile(element, fileData.buffer.slice(0));
        } catch (loadError) {
          console.error(`Failed to preload ${element.file_name}:`, loadError);
        }
      }
    };

    void loadMissingAudio();
  }, [audioElements, initAudioContext, loadAudioFile]);
}
