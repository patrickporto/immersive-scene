import { useState, useMemo, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Hash,
  Server,
  Key,
  ChevronRight,
  ChevronLeft,
  Settings2,
  LogOut,
  Volume2,
  Mic2,
} from 'lucide-react';

import { useDiscordConnection } from '../hooks/useDiscordConnection';
import { useSettingsStore } from '../stores/settingsStore';

type ConfigStep = 'TOKEN' | 'GUILD' | 'CHANNEL' | 'ACTIVE';

export function DiscordSettingsSection() {
  const { settings, updateSettings } = useSettingsStore();

  const [token, setToken] = useState<string>(settings.discord_bot_token || '');
  const [guildId, setGuildId] = useState<string>(settings.discord_guild_id || '');
  const [channelId, setChannelId] = useState<string>(settings.discord_channel_id || '');

  const {
    isValidating,
    botUser,
    guilds,
    channels,
    error,
    validateToken,
    loadChannels,
    clearError,
    setBotUser,
    setGuilds,
    setChannels,
  } = useDiscordConnection();

  // Determine current step
  const currentStep = useMemo<ConfigStep>(() => {
    // If not validated yet, or no token saved and local token not validated
    if (!botUser) return 'TOKEN';

    // If we have a bot user but no guild selected locally
    if (!guildId) return 'GUILD';

    // If we have a guild but no channel selected locally
    if (!channelId) return 'CHANNEL';

    // Check if what we have selected matches what is saved as "active"
    const isActive =
      settings.discord_bot_token === token &&
      settings.discord_guild_id === guildId &&
      settings.discord_channel_id === channelId;

    if (isActive) return 'ACTIVE';

    // If we've selected everything but haven't "connected" (saved) it yet,
    // stay on CHANNEL so user can click Connect.
    return 'CHANNEL';
  }, [botUser, guildId, channelId, settings, token]);

  // Handle initial load of guilds if token exists in settings
  useEffect(() => {
    if (settings.discord_bot_token && !botUser && !isValidating && !error) {
      validateToken(settings.discord_bot_token).then(success => {
        if (success) {
          // If we had a saved config, restore local selection to match
          setGuildId(settings.discord_guild_id || '');
          setChannelId(settings.discord_channel_id || '');
        }
      });
    }
  }, [
    settings.discord_bot_token,
    botUser,
    isValidating,
    validateToken,
    settings.discord_guild_id,
    settings.discord_channel_id,
    error,
  ]);

  // Handle loading channels when guild is selected
  useEffect(() => {
    if (guildId && token && botUser) {
      loadChannels(token, guildId);
    }
  }, [guildId, token, loadChannels, botUser]);

  const handleValidate = async () => {
    const success = await validateToken(token);
    if (!success) {
      setGuildId('');
      setChannelId('');
    }
  };

  const handleSaveConfig = async () => {
    await updateSettings({
      ...settings,
      discord_bot_token: token,
      discord_guild_id: guildId,
      discord_channel_id: channelId,
    });
  };

  const handleClear = async () => {
    setToken('');
    setGuildId('');
    setChannelId('');
    setBotUser(null);
    setGuilds([]);
    setChannels([]);
    await updateSettings({
      ...settings,
      discord_bot_token: '',
      discord_guild_id: '',
      discord_channel_id: '',
    });
  };

  const handleResetToken = () => {
    setToken('');
    setBotUser(null);
    setGuilds([]);
    setChannels([]);
    setGuildId('');
    setChannelId('');
  };

  const handleBack = () => {
    if (currentStep === 'CHANNEL') {
      setChannelId('');
    } else if (currentStep === 'GUILD') {
      // To go back to Token, we just clear the token/botUser
      setToken('');
      // The hook doesn't have a clearBotUser, but clearing token and calling validate might work or just let user edit token input.
      // But actually, clearing guildId would stay in GUILD if botUser exists.
      // We'll just let the "Change Token" button handle it.
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="space-y-6 min-h-[400px]">
      <AnimatePresence mode="wait">
        {/* STEP 1: TOKEN ENTRY */}
        {currentStep === 'TOKEN' && (
          <motion.div
            key="token-step"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-1 flex items-center gap-2">
                <Key size={14} className="text-cyan-500" /> Discord Bot Token
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Enter your bot token..."
                  value={token}
                  onChange={e => {
                    setToken(e.target.value);
                    if (error) clearError();
                  }}
                  className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-mono transition-all placeholder:text-zinc-600"
                />
                <button
                  onClick={handleValidate}
                  disabled={isValidating || !token}
                  className="px-6 py-3 bg-cyan-500 text-zinc-950 text-sm font-bold rounded-2xl transition-all disabled:opacity-30 flex items-center gap-2 whitespace-nowrap active:scale-95 shadow-lg shadow-cyan-500/10"
                >
                  {isValidating ? <RefreshCw size={16} className="animate-spin" /> : 'Validate'}
                </button>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed px-1">
                Create a bot in the{' '}
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-0.5"
                >
                  Discord Developer Portal <ExternalLink size={10} />
                </a>
                . Required Permissions:{' '}
                <code className="bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">Connect</code>,{' '}
                <code className="bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">Speak</code>.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-start gap-3 shadow-xl shadow-red-500/5"
              >
                <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-500">Validation Failed</p>
                  <p className="text-xs text-red-500/70 mt-0.5">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-zinc-500 hover:text-zinc-100 transition-colors"
                >
                  <XCircle size={16} />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* STEP 2: GUILD SELECTION */}
        {currentStep === 'GUILD' && (
          <motion.div
            key="guild-step"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Server size={14} className="text-cyan-500" /> Select Server
              </label>
              <button
                onClick={handleResetToken}
                className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={10} /> Change Token
              </button>
            </div>

            {guilds.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-white/10 bg-zinc-900/30 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500">
                  <Server size={32} />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-200">No Servers Found</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-[240px]">
                    The bot is not present in any server. Invite it to your server to continue.
                  </p>
                </div>
                <a
                  href={`https://discord.com/api/oauth2/authorize?client_id=${botUser?.id}&permissions=3145728&scope=bot`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg"
                >
                  <ExternalLink size={14} /> Copy Invite Link
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {guilds.map(guild => (
                  <button
                    key={guild.id}
                    onClick={() => setGuildId(guild.id)}
                    className="group relative flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left overflow-hidden"
                  >
                    <div className="shrink-0">
                      {guild.icon ? (
                        <img
                          src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                          alt=""
                          className="w-12 h-12 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-500 border border-white/5 group-hover:bg-cyan-500/10 transition-colors uppercase">
                          {guild.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-100 truncate group-hover:text-cyan-400 transition-colors">
                        {guild.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter mt-0.5">
                        {guild.id.slice(0, 12)}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-zinc-700 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 3: CHANNEL SELECTION */}
        {currentStep === 'CHANNEL' && (
          <motion.div
            key="channel-step"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                {guilds.find(g => g.id === guildId)?.icon ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${guildId}/${guilds.find(g => g.id === guildId)?.icon}.png`}
                    alt=""
                    className="w-6 h-6 rounded-lg border border-white/10"
                  />
                ) : (
                  <Server size={14} className="text-cyan-500" />
                )}
                <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                  Voice Channels
                </label>
              </div>
              <button
                onClick={handleBack}
                className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={10} /> Back to Servers
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {channels.length === 0 && !isValidating ? (
                <div className="p-12 text-center bg-zinc-900/30 rounded-3xl border border-white/5 flex flex-col items-center gap-3">
                  <Volume2 size={32} className="text-zinc-700" />
                  <p className="text-sm text-zinc-500">
                    No voice channels available in this server.
                  </p>
                </div>
              ) : (
                channels.map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => setChannelId(channel.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                      channelId === channel.id
                        ? 'bg-cyan-500 text-zinc-950 font-bold shadow-lg shadow-cyan-500/20'
                        : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-zinc-100 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Volume2
                        size={16}
                        className={
                          channelId === channel.id
                            ? 'text-zinc-950'
                            : 'text-zinc-600 group-hover:text-cyan-400'
                        }
                      />
                      <span className="text-sm">{channel.name}</span>
                    </div>
                    {channelId === channel.id ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/10 group-hover:border-cyan-500/30 transition-colors" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSaveConfig}
                disabled={!channelId || !guildId || !token}
                className={`flex items-center gap-3 px-10 py-4 rounded-2xl text-sm font-black transition-all active:scale-95 shadow-2xl ${
                  !channelId || !guildId || !token
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none'
                    : 'bg-[#5865F2] text-white hover:bg-[#4752C4] shadow-[#5865f2]/20'
                }`}
              >
                Connect Integration
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: ACTIVE CONNECTION */}
        {currentStep === 'ACTIVE' && (
          <motion.div
            key="active-step"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <div className="p-8 rounded-3xl bg-[#5865F2]/5 border border-[#5865F2]/20 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                <Mic2 size={120} />
              </div>

              <div className="flex items-center gap-8 relative z-10">
                <div className="relative shrink-0">
                  {botUser?.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png`}
                      alt=""
                      className="w-20 h-20 rounded-[2rem] border-2 border-[#5865F2]/30 shadow-2xl"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-[2rem] bg-[#5865F2] flex items-center justify-center text-2xl font-black text-white shadow-2xl">
                      {botUser?.username?.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-[5px] border-zinc-950 shadow-lg shadow-green-500/20" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-xl font-black text-zinc-100 truncate tracking-tight">
                      {botUser?.username}
                    </h4>
                    <span className="text-[10px] bg-[#5865F2]/20 text-[#5865F2] px-2.5 py-0.5 rounded-full font-bold tracking-widest uppercase border border-[#5865F2]/30">
                      Live
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 font-bold">
                      <Server size={14} className="text-zinc-600" />
                      {guilds.find(g => g.id === settings.discord_guild_id)?.name ||
                        'Linked Server'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-cyan-400 font-bold">
                      <Hash size={14} className="text-cyan-500/50" />
                      {channels.find(c => c.id === settings.discord_channel_id)?.name ||
                        'Voice Channel'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setChannelId('');
                }}
                className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-300 text-sm font-bold transition-all active:scale-95 group"
              >
                <Settings2
                  size={18}
                  className="text-zinc-500 group-hover:text-cyan-400 transition-colors"
                />{' '}
                Reconfigure
              </button>
              <button
                onClick={handleClear}
                className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 text-red-500 text-sm font-bold transition-all active:scale-95"
              >
                <LogOut size={18} /> Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
