import { useState } from 'react';

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
} from 'lucide-react';

import { useDiscordConnection } from '../hooks/useDiscordConnection';
import { useSettingsStore } from '../stores/settingsStore';

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
  } = useDiscordConnection();

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
    await updateSettings({
      ...settings,
      discord_bot_token: '',
      discord_guild_id: '',
      discord_channel_id: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        {/* Token Input Section */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-1 flex items-center gap-2">
            <Key size={14} className="text-cyan-500" /> Discord Bot Token
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Enter your bot token..."
              value={token}
              onChange={e => setToken(e.target.value)}
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
            . Permissions:{' '}
            <code className="bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">Connect</code>,{' '}
            <code className="bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">Speak</code>.
          </p>
        </div>

        {/* Status Overlay/Feedback */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-start gap-3 shadow-xl shadow-red-500/5"
            >
              <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-500">Connection Error</p>
                <p className="text-xs text-red-500/70 mt-0.5">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-zinc-500 hover:text-zinc-100 transition-colors"
                title="Dismiss"
              >
                <XCircle size={16} />
              </button>
            </motion.div>
          )}

          {botUser && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-3xl border border-white/5 bg-zinc-900/50 flex items-center gap-4 relative overflow-hidden group shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                {botUser.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png`}
                    alt=""
                    className="w-12 h-12 rounded-2xl border border-white/10 shadow-lg"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-lg font-black text-cyan-400 border border-cyan-500/20 shadow-lg">
                    {botUser.username.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-zinc-900 shadow-lg shadow-green-500/20" />
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-2">
                  <p className="text-base font-black text-zinc-100 truncate tracking-tight">
                    {botUser.username}
                  </p>
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-bold tracking-widest uppercase border border-cyan-500/20">
                    Active Bot
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium">Verified Discord Integration</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guild & Channel Selectors */}
        {(guilds.length > 0 || botUser) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-4 pt-2"
          >
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Server size={12} className="text-cyan-500" /> Target Server
              </label>
              <div className="relative group">
                <select
                  value={guildId}
                  onChange={e => {
                    setGuildId(e.target.value);
                    setChannelId('');
                    if (e.target.value) {
                      loadChannels(token, e.target.value);
                    }
                  }}
                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select a server</option>
                  {guilds.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 group-hover:text-cyan-400 transition-colors">
                  <Hash size={14} className="rotate-12" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Hash size={12} className="text-cyan-500" /> Voice Channel
              </label>
              <div className="relative group">
                <select
                  value={channelId}
                  disabled={!guildId || channels.length === 0}
                  onChange={e => setChannelId(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all appearance-none cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <option value="">Select a channel</option>
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 group-hover:text-cyan-400 transition-colors">
                  <RefreshCw size={14} className={isValidating ? 'animate-spin' : ''} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Local Controls */}
      <div className="flex justify-between items-center pt-8 border-t border-white/5">
        <button
          onClick={handleClear}
          disabled={!settings.discord_bot_token}
          className="text-xs font-bold text-zinc-500 hover:text-red-500 transition-colors disabled:opacity-0 p-1 uppercase tracking-widest"
        >
          Reset Config
        </button>

        <button
          onClick={handleSaveConfig}
          disabled={!channelId || !guildId || !token}
          className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-sm font-black transition-all active:scale-95 shadow-2xl ${
            !channelId || !guildId || !token
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none'
              : 'bg-[#5865F2] text-white hover:bg-[#4752C4] shadow-[#5865f2]/20'
          }`}
        >
          {settings.discord_bot_token === token &&
          settings.discord_guild_id === guildId &&
          settings.discord_channel_id === channelId ? (
            <>
              <CheckCircle2 size={18} /> Connected
            </>
          ) : (
            'Connect Integration'
          )}
        </button>
      </div>
    </div>
  );
}
