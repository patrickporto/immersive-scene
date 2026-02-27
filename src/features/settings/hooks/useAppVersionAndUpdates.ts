import { useCallback, useEffect, useState } from 'react';

import { getVersion } from '@tauri-apps/api/app';

const DEFAULT_REPOSITORY = 'patrickporto/immersive-scene';

type UpdateStatus = 'idle' | 'up-to-date' | 'update-available' | 'error';

interface UseAppVersionAndUpdatesResult {
  currentVersion: string;
  latestVersion: string;
  status: UpdateStatus;
  isChecking: boolean;
  message: string;
  checkForUpdates: () => Promise<void>;
}

interface GitHubRelease {
  tag_name?: string;
}

/**
 * @description Compares two semantic version strings.
 * @param current - Current app version.
 * @param latest - Latest release version.
 * @returns Positive if latest is newer, zero if equal, negative if older.
 */
function compareSemver(current: string, latest: string): number {
  const normalize = (version: string): number[] => {
    const [core] = version.replace(/^v/, '').split('-');
    return core.split('.').map(part => Number.parseInt(part, 10) || 0);
  };

  const currentParts = normalize(current);
  const latestParts = normalize(latest);
  const size = Math.max(currentParts.length, latestParts.length);

  for (let index = 0; index < size; index += 1) {
    const currentValue = currentParts[index] ?? 0;
    const latestValue = latestParts[index] ?? 0;
    if (latestValue !== currentValue) {
      return latestValue - currentValue;
    }
  }

  return 0;
}

/**
 * @description Reads app version and checks for updates from GitHub releases.
 * @returns Current version, update status, and action to check for updates.
 */
export function useAppVersionAndUpdates(): UseAppVersionAndUpdatesResult {
  const [currentVersion, setCurrentVersion] = useState('unknown');
  const [latestVersion, setLatestVersion] = useState('');
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState('Ready to check updates.');

  useEffect(() => {
    getVersion()
      .then(version => {
        setCurrentVersion(version);
      })
      .catch(() => {
        setCurrentVersion('unknown');
      });
  }, []);

  const checkForUpdates = useCallback(async () => {
    setIsChecking(true);
    setStatus('idle');
    setMessage('Checking latest release...');

    try {
      const repository = import.meta.env.VITE_GITHUB_REPO || DEFAULT_REPOSITORY;
      const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`);

      if (!response.ok) {
        throw new Error(`GitHub request failed with status ${response.status}`);
      }

      const release = (await response.json()) as GitHubRelease;
      const latestTag = (release.tag_name || '').trim();
      if (!latestTag) {
        throw new Error('Latest release does not include tag_name.');
      }

      setLatestVersion(latestTag);

      const isNewer = compareSemver(currentVersion, latestTag) > 0;
      if (isNewer) {
        setStatus('update-available');
        setMessage(`Update available: ${latestTag}`);
      } else {
        setStatus('up-to-date');
        setMessage('You are using the latest version.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to check updates.');
    } finally {
      setIsChecking(false);
    }
  }, [currentVersion]);

  return {
    currentVersion,
    latestVersion,
    status,
    isChecking,
    message,
    checkForUpdates,
  };
}
