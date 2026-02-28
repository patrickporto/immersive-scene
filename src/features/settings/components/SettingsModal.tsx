import React, { useEffect, useState } from 'react';

import { open } from '@tauri-apps/plugin-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, CheckCircle2, Database, FolderOpen, Info, Shield, Volume2 } from 'lucide-react';

import { DiscordSettingsSection } from './DiscordSettingsSection';
import { Modal } from '../../../shared/components/Modal';
import { useAudioDevices } from '../../audio-engine/hooks/useAudioDevices';
import { useAudioEngineStore } from '../../audio-engine/stores/audioEngineStore';
import { useAppVersionAndUpdates } from '../hooks/useAppVersionAndUpdates';
import { useSettingsStore } from '../stores/settingsStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'audio' | 'discord' | 'storage' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, loadSettings, isLoading, error, clearError } =
    useSettingsStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('audio');
  const [localStrategy, setLocalStrategy] = useState(settings.audio_file_strategy);
  const [localLibraryPath, setLocalLibraryPath] = useState(settings.library_path);
  const [localOutputDeviceId, setLocalOutputDeviceId] = useState(settings.output_device_id);

  const { devices } = useAudioDevices();
  const {
    currentVersion,
    latestVersion,
    status: updateStatus,
    isChecking,
    message: updateMessage,
    checkForUpdates,
  } = useAppVersionAndUpdates();

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
    loadSettings,
    settings.audio_file_strategy,
    settings.library_path,
    settings.output_device_id,
  ]);

  const handleSave = async () => {
    await updateSettings({
      ...settings,
      audio_file_strategy: localStrategy,
      library_path: localLibraryPath,
      output_device_id: localOutputDeviceId,
    });

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

  const tabs = [
    { id: 'audio', label: 'Audio', icon: Volume2 },
    { id: 'discord', label: 'Discord', icon: Shield },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ] as const;

  const containerVariants = {
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, x: -10, transition: { duration: 0.15, ease: 'easeIn' } },
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="4xl" className="max-h-[85vh]">
      <div className="flex h-[700px] overflow-hidden bg-zinc-950/50">
        {/* Sidebar */}
        <div className="w-64 border-r border-white/5 bg-zinc-900/50 backdrop-blur-md flex flex-col">
          <div className="p-4 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative group ${
                  activeTab === tab.id
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-cyan-500/5 border border-cyan-500/20 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon
                  size={18}
                  className={`relative z-10 transition-colors ${
                    activeTab === tab.id ? 'text-cyan-400' : 'group-hover:text-zinc-200'
                  }`}
                />
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto p-6 space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                System Active
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-zinc-950/30 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-sm flex justify-between items-start animate-in fade-in slide-in-from-top-2">
                <span>{error}</span>
                <button onClick={clearError} className="opacity-50 hover:opacity-100">
                  &times;
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={containerVariants as any}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="max-w-2xl mx-auto"
              >
                {/* Header for sections */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h3>
                  <p className="text-zinc-500 text-sm mt-1">
                    Configure your {activeTab} preferences and integration settings.
                  </p>
                </div>

                {activeTab === 'audio' && (
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-1">
                        Playback Device
                      </label>
                      <div className="relative group">
                        <select
                          value={localOutputDeviceId}
                          onChange={e => setLocalOutputDeviceId(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="default">Default System Output</option>
                          {devices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                              {device.label || `Device ${device.deviceId.slice(0, 5)}...`}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-cyan-400 transition-colors">
                          <Volume2 size={16} />
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed px-1">
                        Select the primary output for all engine channels. This will not affect
                        Discord routing.
                      </p>
                    </section>
                  </div>
                )}

                {activeTab === 'discord' && (
                  <div className="space-y-6">
                    <DiscordSettingsSection />
                  </div>
                )}

                {activeTab === 'storage' && (
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-1">
                        Import Strategy
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          {
                            id: 'reference',
                            title: 'Reference',
                            desc: 'Keep files in their original location.',
                          },
                          {
                            id: 'copy',
                            title: 'Copy to Library',
                            desc: 'Organize files into a central folder.',
                          },
                        ].map(strategy => (
                          <button
                            key={strategy.id}
                            onClick={() => setLocalStrategy(strategy.id as 'reference' | 'copy')}
                            className={`p-5 rounded-2xl border transition-all text-left group relative overflow-hidden ${
                              localStrategy === strategy.id
                                ? 'bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/20'
                                : 'bg-zinc-900/50 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`font-bold ${
                                  localStrategy === strategy.id ? 'text-cyan-400' : 'text-zinc-300'
                                }`}
                              >
                                {strategy.title}
                              </span>
                              {localStrategy === strategy.id && (
                                <CheckCircle2 size={16} className="text-cyan-400" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                              {strategy.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section
                      className={`space-y-4 transition-all ${
                        localStrategy === 'reference'
                          ? 'opacity-40 grayscale cursor-not-allowed pointer-events-none'
                          : ''
                      }`}
                    >
                      <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-1">
                        Library Location
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1 group">
                          <input
                            type="text"
                            value={localLibraryPath || ''}
                            readOnly
                            placeholder="No folder selected"
                            className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-11 py-3 text-sm focus:outline-none transition-all cursor-default"
                          />
                          <FolderOpen
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-cyan-400 transition-colors"
                          />
                        </div>
                        <button
                          onClick={handleSelectFolder}
                          disabled={localStrategy === 'reference'}
                          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-semibold rounded-2xl transition-all active:scale-95"
                        >
                          Browse
                        </button>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="space-y-8">
                    <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Info size={120} />
                      </div>

                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                          <Activity size={40} className="text-cyan-400" />
                        </div>

                        <h4 className="text-2xl font-black text-zinc-100 tracking-tight">
                          Immersive Scene
                        </h4>
                        <p className="text-cyan-500 font-mono text-sm tracking-wider mt-1 px-3 py-0.5 bg-cyan-500/10 rounded-full">
                          V{currentVersion}
                          {latestVersion && latestVersion !== currentVersion && (
                            <span className="ml-2 opacity-50">→ {latestVersion}</span>
                          )}
                        </p>

                        <div className="mt-8 pt-8 border-t border-white/5 w-full space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">Platform</span>
                            <span className="text-zinc-300 font-medium">Tauri Native</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">License</span>
                            <span className="text-zinc-300 font-medium">Proprietary</span>
                          </div>
                        </div>

                        <button
                          onClick={checkForUpdates}
                          disabled={isChecking}
                          className={`mt-10 w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-xl ${
                            isChecking
                              ? 'bg-zinc-800 text-zinc-500'
                              : 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400 shadow-cyan-500/10'
                          }`}
                        >
                          {isChecking ? (
                            <>
                              <Activity size={18} className="animate-spin" />
                              Checking for updates...
                            </>
                          ) : (
                            'Check for Updates'
                          )}
                        </button>

                        <p
                          className={`mt-4 text-xs flex items-center gap-2 ${
                            updateStatus === 'up-to-date' ? 'text-green-500' : 'text-zinc-500'
                          }`}
                        >
                          {updateStatus === 'up-to-date' && <CheckCircle2 size={14} />}
                          {updateMessage || 'No recent checks'}
                        </p>
                      </div>
                    </section>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 bg-zinc-900/80 border-t border-white/5 backdrop-blur-xl shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || (localStrategy === 'copy' && !localLibraryPath)}
              className="px-8 py-3 bg-cyan-500 text-zinc-950 text-sm font-bold rounded-2xl hover:bg-cyan-400 transition-all active:scale-95 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? 'Saving...' : 'Apply Changes'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
