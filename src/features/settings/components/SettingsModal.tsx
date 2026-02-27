import React, { useEffect, useState } from 'react';

import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen } from 'lucide-react';

import { DiscordSettingsSection } from './DiscordSettingsSection';
import { Modal } from '../../../shared/components/Modal';
import { useAudioDevices } from '../../audio-engine/hooks/useAudioDevices';
import { useAudioEngineStore } from '../../audio-engine/stores/audioEngineStore';
import { useSettingsStore } from '../stores/settingsStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, loadSettings, isLoading, error, clearError } =
    useSettingsStore();

  const [localStrategy, setLocalStrategy] = useState(settings.audio_file_strategy);
  const [localLibraryPath, setLocalLibraryPath] = useState(settings.library_path);
  const [localOutputDeviceId, setLocalOutputDeviceId] = useState(settings.output_device_id);

  const { devices } = useAudioDevices();

  useEffect(() => {
    if (isOpen) {
      loadSettings().then(() => {
        setLocalStrategy(settings.audio_file_strategy);
        setLocalLibraryPath(settings.library_path);
        setLocalOutputDeviceId(settings.output_device_id);
      });
    }
  }, [
    isOpen,
    settings.audio_file_strategy,
    settings.library_path,
    settings.output_device_id,
    loadSettings,
  ]);

  // Sync local state when store settings change (e.g. after load)
  useEffect(() => {
    setLocalStrategy(settings.audio_file_strategy);
    setLocalLibraryPath(settings.library_path);
    setLocalOutputDeviceId(settings.output_device_id);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({
      ...settings,
      audio_file_strategy: localStrategy,
      library_path: localLibraryPath,
      output_device_id: localOutputDeviceId,
    });

    // Apply audio output device immediately
    useAudioEngineStore.getState().setOutputDevice(localOutputDeviceId).catch(console.error);

    onClose();
  };

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select App Library Folder',
      });

      if (selected !== null && !Array.isArray(selected)) {
        setLocalLibraryPath(selected);
      }
    } catch (err) {
      console.error('Failed to open directory picker:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="App Settings" size="md">
      <div className="flex flex-col gap-6 py-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm flex justify-between items-start">
            <span>{error}</span>
            <button onClick={clearError} className="opacity-50 hover:opacity-100">
              &times;
            </button>
          </div>
        )}

        {/* Audio Output section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-foreground/80">Audio Output Device</h3>
          <div className="flex flex-col gap-2">
            <select
              title="Select Output Device"
              value={localOutputDeviceId || ''}
              onChange={e => setLocalOutputDeviceId(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Default System Device</option>
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Device ${device.deviceId.slice(0, 5)}...`}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              Select where the audio should be played.
            </span>
          </div>
        </div>

        {/* Discord Config section */}
        <DiscordSettingsSection />

        {/* Audio Strategy section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-foreground/80">Audio File Strategy</h3>

          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/50 cursor-pointer hover:bg-card hover:border-border-hover transition-colors">
              <input
                type="radio"
                name="audio_strategy"
                value="reference"
                checked={localStrategy === 'reference'}
                onChange={() => setLocalStrategy('reference')}
                className="mt-1 accent-primary"
              />
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">Reference Original File</span>
                <span className="text-xs text-muted-foreground">
                  Keep audio files where they are. Uses their original absolute path.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/50 cursor-pointer hover:bg-card hover:border-border-hover transition-colors">
              <input
                type="radio"
                name="audio_strategy"
                value="copy"
                checked={localStrategy === 'copy'}
                onChange={() => setLocalStrategy('copy')}
                className="mt-1 accent-primary"
              />
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">Copy to Library</span>
                <span className="text-xs text-muted-foreground">
                  Copy imported files into the central library folder. Safer for sharing sound sets.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Library Path Selection - Only explicitly required if 'copy' is selected but always good to show */}
        <div
          className={`flex flex - col gap - 2 transition - opacity duration - 300 ${localStrategy === 'copy' ? 'opacity-100' : 'opacity-50'} `}
        >
          <h3 className="text-sm font-medium text-foreground/80">Library Folder Path</h3>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={localLibraryPath || 'Not set'}
              className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm text-muted-foreground"
            />
            <button
              onClick={handleSelectFolder}
              className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md transition-colors flex items-center justify-center shrink-0"
              title="Select Folder"
            >
              <FolderOpen size={18} />
            </button>
          </div>
          {localStrategy === 'copy' && !localLibraryPath && (
            <span className="text-xs text-amber-500">
              Please select a folder to use the &apos;Copy to Library&apos; strategy.
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium border border-border hover:bg-muted rounded-md transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow flex items-center gap-2"
          disabled={isLoading || (localStrategy === 'copy' && !localLibraryPath)}
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </Modal>
  );
};
