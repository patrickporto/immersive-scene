import React, { useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Box, Check, MonitorSpeaker, Speaker } from 'lucide-react';

import { useSettingsStore } from '../../settings/stores/settingsStore';
import { useAudioDevices } from '../hooks/useAudioDevices';
import { useAudioEngineStore } from '../stores/audioEngineStore';

export function OutputDevicePicker() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { devices } = useAudioDevices();
  const { setOutputDevice } = useAudioEngineStore();
  const { settings, updateSettings } = useSettingsStore();

  const selectedDeviceId = settings.output_device_id || '';
  // Temporary: we'll add discord config fields later
  const hasDiscordConfig = !!(settings as any).discord_bot_token;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (deviceId: string) => {
    await updateSettings({ ...settings, output_device_id: deviceId });
    setOutputDevice(deviceId).catch(console.error);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-white/5 rounded-full transition-colors flex-shrink-0 text-gray-500 hover:text-cyan-400 group"
        title="Output Device"
      >
        <Speaker size={16} className={isOpen ? 'text-cyan-400' : ''} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 w-64 bg-[#1a1a25] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-white/10 bg-black/20">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Output Device
              </h4>
            </div>

            <div className="py-2 max-h-64 overflow-y-auto custom-scrollbar">
              <button
                onClick={() => handleSelect('')}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors text-sm text-left group"
              >
                <div className="flex items-center gap-3 text-gray-300 group-hover:text-white">
                  <MonitorSpeaker
                    size={14}
                    className={selectedDeviceId === '' ? 'text-cyan-400' : 'text-gray-500'}
                  />
                  <span className={selectedDeviceId === '' ? 'text-cyan-400 font-medium' : ''}>
                    System Default
                  </span>
                </div>
                {selectedDeviceId === '' && <Check size={14} className="text-cyan-400" />}
              </button>

              {devices.map(device => (
                <button
                  key={device.deviceId}
                  onClick={() => handleSelect(device.deviceId)}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors text-sm text-left group"
                >
                  <div className="flex items-center gap-3 text-gray-300 group-hover:text-white truncate pr-4">
                    <MonitorSpeaker
                      size={14}
                      className={
                        selectedDeviceId === device.deviceId
                          ? 'text-cyan-400 flex-shrink-0'
                          : 'text-gray-500 flex-shrink-0'
                      }
                    />
                    <span
                      className={`truncate ${selectedDeviceId === device.deviceId ? 'text-cyan-400 font-medium' : ''}`}
                    >
                      {device.label || `Device ${device.deviceId.slice(0, 5)}...`}
                    </span>
                  </div>
                  {selectedDeviceId === device.deviceId && (
                    <Check size={14} className="text-cyan-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-white/10 py-2">
              <button
                onClick={() => handleSelect('discord')}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors text-sm text-left group"
              >
                <div className="flex items-center gap-3 text-gray-300 group-hover:text-white">
                  <Box
                    size={14}
                    className={selectedDeviceId === 'discord' ? 'text-[#5865F2]' : 'text-gray-500'}
                  />
                  <div className="flex flex-col">
                    <span
                      className={selectedDeviceId === 'discord' ? 'text-[#5865F2] font-medium' : ''}
                    >
                      Discord Voice
                    </span>
                    {!hasDiscordConfig && (
                      <span className="text-[10px] text-amber-500">Not configured</span>
                    )}
                  </div>
                </div>
                {selectedDeviceId === 'discord' && <Check size={14} className="text-[#5865F2]" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
