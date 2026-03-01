import { useEffect, useState } from 'react';

export function useAudioDevices() {
  const supportsEnumerateDevices =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.enumerateDevices === 'function';

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(
    supportsEnumerateDevices
      ? null
      : 'Audio device enumeration is not supported in this environment.'
  );

  useEffect(() => {
    if (!supportsEnumerateDevices) {
      return;
    }

    let mounted = true;

    async function loadDevices() {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = allDevices.filter(d => d.kind === 'audiooutput');

        if (mounted) {
          setDevices(audioOutputs);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const isPermissionDenied =
            err instanceof DOMException &&
            (err.name === 'NotAllowedError' || err.name === 'SecurityError');

          if (isPermissionDenied) {
            setError('Audio device permission is blocked. Using system default output.');
          } else {
            setError(String(err));
          }

          setDevices([]);
        }
      }
    }

    loadDevices();

    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      mounted = false;
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, [supportsEnumerateDevices]);

  return { devices, error };
}
