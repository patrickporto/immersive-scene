import { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, RefreshCw, AlertCircle, XCircle, Key, LogOut } from 'lucide-react';

import { useDiscordConnection } from '../hooks/useDiscordConnection';
import { useSettingsStore } from '../stores/settingsStore';

export function DiscordSettingsSection() {
  const { settings, updateSettings } = useSettingsStore();

  const [token, setToken] = useState<string>(settings.discord_bot_token || '');

  const {
    isValidating,
    botUser,
    error,
    validateToken,
    clearError,
    setBotUser,
    setGuilds,
    setChannels,
  } = useDiscordConnection();

  // Handle initial load of guilds if token exists in settings
  useEffect(() => {
    if (settings.discord_bot_token && !botUser && !isValidating && !error) {
      validateToken(settings.discord_bot_token);
    }
  }, [settings.discord_bot_token, botUser, isValidating, validateToken, error]);

  const handleValidate = async () => {
    const success = await validateToken(token);
    if (success) {
      await updateSettings({
        ...settings,
        discord_bot_token: token,
      });
      return;
    }
  };

  const handleClear = async () => {
    setToken('');
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

  const stepVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {!botUser ? (
          <motion.div
            key="token-entry"
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
        ) : (
          <motion.div
            key="active-config"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <div className="p-8 rounded-3xl bg-[#5865F2]/5 border border-[#5865F2]/20 relative overflow-hidden group shadow-2xl">
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
                      Connected
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Bot is ready. You can select the server and channel directly in the bottom
                    player.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleClear}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 text-red-500 text-sm font-bold transition-all active:scale-95"
            >
              <LogOut size={18} /> Disconnect Bot
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
