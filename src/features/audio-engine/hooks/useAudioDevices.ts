import { useEffect, useState } from 'react';

export function useAudioDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = allDevices.filter(d => d.kind === 'audiooutput');

        if (mounted) {
          setDevices(audioOutputs);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          console.warn('Failed to enumerate audio devices or get permission:', err);
          setError(String(err));
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const audioOutputs = allDevices.filter(d => d.kind === 'audiooutput');
          setDevices(audioOutputs);
        }
      }
    }

    loadDevices();

    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      mounted = false;
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, []);

  return { devices, error };
}
