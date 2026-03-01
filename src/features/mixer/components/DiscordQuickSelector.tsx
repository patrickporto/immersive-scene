import { useState, useRef, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Server, Volume2, ChevronRight, ChevronLeft, Check, Hash } from 'lucide-react';

import { useAudioEngineStore } from '../../audio-engine/stores/audioEngineStore';
import { useDiscordConnection } from '../../settings/hooks/useDiscordConnection';
import { useSettingsStore } from '../../settings/stores/settingsStore';

export function DiscordQuickSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'GUILD' | 'CHANNEL'>('GUILD');
  const containerRef = useRef<HTMLDivElement>(null);

  const { settings, updateSettings } = useSettingsStore();
  const setOutputDevice = useAudioEngineStore(state => state.setOutputDevice);
  const { guilds, channels, loadChannels, botUser, validateToken } = useDiscordConnection();

  const selectedGuildId = settings.discord_guild_id;
  const selectedChannelId = settings.discord_channel_id;

  const activeGuild = guilds.find(g => g.id === selectedGuildId);
  const activeChannel = channels.find(c => c.id === selectedChannelId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure guilds are loaded
  useEffect(() => {
    if (settings.discord_bot_token && !botUser) {
      validateToken(settings.discord_bot_token);
    }
  }, [settings.discord_bot_token, botUser, validateToken]);

  // Load channels when guild is selected or changed
  useEffect(() => {
    if (selectedGuildId && settings.discord_bot_token) {
      loadChannels(settings.discord_bot_token, selectedGuildId);
    }
  }, [selectedGuildId, settings.discord_bot_token, loadChannels]);

  const handleGuildSelect = async (guildId: string) => {
    const currentSettings = useSettingsStore.getState().settings;
    await updateSettings({
      ...currentSettings,
      discord_guild_id: guildId,
      discord_channel_id: '',
    });
    setStep('CHANNEL');
  };

  const handleChannelSelect = async (channelId: string) => {
    const currentSettings = useSettingsStore.getState().settings;
    const nextSettings = {
      ...currentSettings,
      discord_channel_id: channelId,
      output_device_id: 'discord',
    };
    await updateSettings(nextSettings);

    // Always connect/reconnect when a channel is selected via the quick selector
    await setOutputDevice('discord');

    setIsOpen(false);
  };

  const stepVariants = {
    initial: { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setStep(selectedGuildId ? 'CHANNEL' : 'GUILD');
        }}
        className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/20 hover:bg-[#5865F2]/20 transition-all group"
      >
        <div className="shrink-0">
          {activeGuild?.icon ? (
            <img
              src={`https://cdn.discordapp.com/icons/${activeGuild.id}/${activeGuild.icon}.png`}
              alt=""
              className="w-5 h-5 rounded-md"
            />
          ) : (
            <Server size={14} className="text-[#5865F2]" />
          )}
        </div>
        <div className="flex flex-col items-start min-w-0 pr-1">
          <span className="text-[10px] font-bold text-[#5865F2] uppercase tracking-wider leading-none mb-0.5">
            Discord Voice
          </span>
          <span className="text-xs text-zinc-100 font-bold truncate max-w-[120px]">
            {activeChannel ? activeChannel.name : 'Select Channel'}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-3 right-0 w-72 bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                {step === 'GUILD' ? (
                  <>
                    <Server size={12} className="text-[#5865F2]" /> Select Server
                  </>
                ) : (
                  <>
                    <Volume2 size={12} className="text-[#5865F2]" /> Select Channel
                  </>
                )}
              </h4>
              {step === 'CHANNEL' && (
                <button
                  onClick={() => setStep('GUILD')}
                  className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
                >
                  <ChevronLeft size={10} /> Servers
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
              <AnimatePresence mode="wait">
                {step === 'GUILD' ? (
                  <motion.div
                    key="guild-list"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-1"
                  >
                    {guilds.map(guild => (
                      <button
                        key={guild.id}
                        onClick={() => {
                          handleGuildSelect(guild.id).catch(console.error);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all group ${
                          selectedGuildId === guild.id
                            ? 'bg-[#5865F2] text-white'
                            : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-100'
                        }`}
                      >
                        {guild.icon ? (
                          <img
                            src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                            alt=""
                            className="w-8 h-8 rounded-lg"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold uppercase">
                            {guild.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-bold flex-1 text-left truncate">
                          {guild.name}
                        </span>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="channel-list"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-1"
                  >
                    {channels.map(channel => (
                      <button
                        key={channel.id}
                        onClick={() => {
                          handleChannelSelect(channel.id).catch(console.error);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                          selectedChannelId === channel.id
                            ? 'bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/20'
                            : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-100'
                        }`}
                      >
                        <Hash
                          size={16}
                          className={
                            selectedChannelId === channel.id
                              ? 'text-white'
                              : 'text-zinc-600 group-hover:text-[#5865F2]'
                          }
                        />
                        <span className="text-sm font-bold flex-1 text-left truncate">
                          {channel.name}
                        </span>
                        {selectedChannelId === channel.id && <Check size={14} />}
                      </button>
                    ))}
                    {channels.length === 0 && (
                      <p className="text-xs text-zinc-500 text-center py-4">
                        No voice channels found.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
